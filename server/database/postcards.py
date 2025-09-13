from typing import Optional, Dict, Any, List
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError


class PostcardOperations:
    """Postcard-related DynamoDB operations"""

    def __init__(self, client):
        self.client = client

    def create_postcard(
        self, author_id: str, image_url: str, text: str
    ) -> Dict[str, str]:
        """Create a new postcard"""
        postcard_id = self.client._generate_id()
        timestamp = self.client._get_timestamp()

        try:
            self.client.table.put_item(
                Item={
                    "PK": f"POSTCARD#{postcard_id}",
                    "SK": "METADATA",
                    "postcard_id": postcard_id,
                    "author_id": author_id,
                    "image_url": image_url,
                    "text": text,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                    "likes_count": 0,
                    "status": "traveling",  # traveling, stopped, collected
                }
            )

            return {"postcard_id": postcard_id, "created_at": timestamp}
        except ClientError as e:
            self.client._handle_client_error(e, "create_postcard")

    def get_postcard(self, postcard_id: str) -> Optional[Dict[str, Any]]:
        """Get postcard details"""
        try:
            response = self.client.table.get_item(
                Key={"PK": f"POSTCARD#{postcard_id}", "SK": "METADATA"}
            )
            return response.get("Item")
        except ClientError as e:
            self.client._handle_client_error(e, "get_postcard")
            return None

    def update_postcard(self, postcard_id: str, image_url: str, text: str) -> bool:
        """Update postcard content"""
        try:
            self.client.table.update_item(
                Key={"PK": f"POSTCARD#{postcard_id}", "SK": "METADATA"},
                UpdateExpression="SET image_url = :image_url, #text = :text, updated_at = :updated_at",
                ExpressionAttributeNames={
                    "#text": "text"  # 'text' is a reserved word in DynamoDB
                },
                ExpressionAttributeValues={
                    ":image_url": image_url,
                    ":text": text,
                    ":updated_at": self.client._get_timestamp(),
                },
                ConditionExpression=Attr("PK").exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "update_postcard")

    def delete_postcard(self, postcard_id: str) -> bool:
        """Delete postcard"""
        try:
            self.client.table.delete_item(
                Key={"PK": f"POSTCARD#{postcard_id}", "SK": "METADATA"},
                ConditionExpression=Attr("PK").exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "delete_postcard")

    def add_path_point(
        self, postcard_id: str, prefecture: str, lat: float, lon: float
    ) -> bool:
        """Add a path point to postcard's journey"""
        try:
            point_id = self.client._generate_id()
            self.client.table.put_item(
                Item={
                    "PK": f"POSTCARD#{postcard_id}",
                    "SK": f"PATH#{point_id}",
                    "postcard_id": postcard_id,
                    "prefecture": prefecture,
                    "lat": lat,
                    "lon": lon,
                    "arrival_time": self.client._get_timestamp(),
                }
            )
            return True
        except ClientError as e:
            self.client._handle_client_error(e, "add_path_point")
            return False

    def get_postcard_path(self, postcard_id: str) -> List[Dict[str, Any]]:
        """Get postcard's travel path"""
        try:
            response = self.client.table.query(
                KeyConditionExpression=Key("PK").eq(f"POSTCARD#{postcard_id}")
                & Key("SK").begins_with("PATH#"),
                ScanIndexForward=True,  # Sort by SK ascending
            )

            path_points = []
            for item in response["Items"]:
                path_points.append(
                    {
                        "prefecture": item["prefecture"],
                        "lat": item["lat"],
                        "lon": item["lon"],
                        "arrival_time": item["arrival_time"],
                    }
                )

            return path_points
        except ClientError as e:
            self.client._handle_client_error(e, "get_postcard_path")
            return []

    def get_nearby_postcards(
        self, lat: float, lon: float, radius: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get postcards near a location (simplified - in real implementation would use geospatial indexing)"""
        # This is a simplified implementation
        # In production, you'd want to use DynamoDB with geospatial indexing or ElasticSearch
        try:
            # For now, return all active postcards (would need proper geo-querying)
            response = self.client.table.scan(
                FilterExpression=Attr("SK").eq("METADATA")
                & (Attr("status").eq("traveling") | Attr("status").eq("stopped"))
            )

            nearby_postcards = []
            for item in response["Items"]:
                # In real implementation, calculate distance and filter
                nearby_postcards.append(
                    {
                        "postcard_id": item["postcard_id"],
                        "image_url": item["image_url"],
                        "text": item["text"],
                        "current_position": {"lat": lat, "lon": lon},  # Placeholder
                        "next_destination": {
                            "lat": lat + 0.1,
                            "lon": lon + 0.1,
                        },  # Placeholder
                        "last_updated_at": item["updated_at"],
                    }
                )

            return nearby_postcards[:10]  # Limit results
        except ClientError as e:
            self.client._handle_client_error(e, "get_nearby_postcards")
            return []
