from typing import Optional, Dict, Any, List
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from decimal import Decimal


class PostcardOperations:
    """Postcard-related DynamoDB operations"""

    def __init__(self, client):
        self.client = client

    def create_postcard(
        self, author_id: str, image_url: str, text: str, lat: float, lon: float
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
                    "current_lat": Decimal(str(lat)),
                    "current_lon": Decimal(str(lon)),
                }
            )

            # 初期位置を旅の軌跡として記録
            try:
                self.add_path_point(postcard_id, "作成場所", lat, lon)
            except Exception:
                pass  # パス記録失敗は無視

            return {"postcard_id": postcard_id, "created_at": timestamp}
        except ClientError as e:
            self.client._handle_client_error(e, "create_postcard")
            return {"postcard_id": "", "created_at": ""}

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
                    "lat": Decimal(str(lat)),
                    "lon": Decimal(str(lon)),
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
                        "lat": float(item["lat"]),
                        "lon": float(item["lon"]),
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
        """Get postcards near a location with actual distance calculation"""
        import math

        def calculate_distance(
            lat1: float, lon1: float, lat2: float, lon2: float
        ) -> float:
            """Calculate distance between two points using Haversine formula (returns meters)"""
            R = 6371000  # Earth's radius in meters

            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lon = math.radians(lon2 - lon1)

            a = math.sin(delta_lat / 2) * math.sin(delta_lat / 2) + math.cos(
                lat1_rad
            ) * math.cos(lat2_rad) * math.sin(delta_lon / 2) * math.sin(delta_lon / 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

            return R * c

        try:
            response = self.client.table.scan(
                FilterExpression=Attr("SK").eq("METADATA")
                & (Attr("status").eq("traveling") | Attr("status").eq("stopped"))
            )

            nearby_postcards = []
            for item in response["Items"]:
                # 実際の距離計算
                if "current_lat" in item and "current_lon" in item:
                    distance = calculate_distance(
                        lat, lon, float(item["current_lat"]), float(item["current_lon"])
                    )

                    # 指定した半径内のみを返す
                    if distance <= radius:
                        nearby_postcards.append(
                            {
                                "postcard_id": item["postcard_id"],
                                "image_url": item["image_url"],
                                "text": item["text"],
                                "current_position": {
                                    "lat": float(item["current_lat"]),
                                    "lon": float(item["current_lon"]),
                                },
                                "next_destination": {
                                    "lat": float(item["current_lat"]) + 0.01,
                                    "lon": float(item["current_lon"]) + 0.01,
                                },
                                "last_updated_at": item["updated_at"],
                                "distance_meters": round(distance),
                            }
                        )

            # 距離の近い順にソート
            nearby_postcards.sort(key=lambda x: x["distance_meters"])
            return nearby_postcards[:10]  # Limit results

        except ClientError as e:
            self.client._handle_client_error(e, "get_nearby_postcards")
            return []

    def get_user_postcards(self, author_id: str) -> List[Dict[str, Any]]:
        """Get all postcards created by a specific user"""
        try:
            response = self.client.table.scan(
                FilterExpression=Attr("SK").eq("METADATA")
                & Attr("author_id").eq(author_id)
            )

            user_postcards = []
            for item in response["Items"]:
                # Get the travel path for each postcard
                path = self.get_postcard_path(item["postcard_id"])

                user_postcards.append(
                    {
                        "postcard_id": item["postcard_id"],
                        "image_url": item["image_url"],
                        "text": item["text"],
                        "created_at": item["created_at"],
                        "author_id": item["author_id"],
                        "likes_count": item.get("likes_count", 0),
                        "status": item.get("status", "traveling"),
                        "current_position": {
                            "lat": float(item.get("current_lat", 0)),
                            "lon": float(item.get("current_lon", 0)),
                        }
                        if item.get("current_lat") and item.get("current_lon")
                        else None,
                        "path": path,
                    }
                )

            # Sort by creation date (newest first)
            user_postcards.sort(key=lambda x: x["created_at"], reverse=True)
            return user_postcards

        except ClientError as e:
            self.client._handle_client_error(e, "get_user_postcards")
            return []
