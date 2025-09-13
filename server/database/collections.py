from typing import List, Dict, Any
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError


class CollectionOperations:
    """Collection-related DynamoDB operations"""

    def __init__(self, client):
        self.client = client

    def collect_postcard(self, user_id: str, postcard_id: str) -> bool:
        """Add postcard to user's collection"""
        try:
            # First check if postcard exists and is available
            postcard = self.client.postcards.get_postcard(postcard_id)
            if not postcard or postcard.get("status") == "collected":
                return False

            # Add to collection
            self.client.table.put_item(
                Item={
                    "PK": f"USER#{user_id}",
                    "SK": f"COLLECTION#{postcard_id}",
                    "user_id": user_id,
                    "postcard_id": postcard_id,
                    "collected_at": self.client._get_timestamp(),
                },
                ConditionExpression=Attr("PK").not_exists(),
            )

            # Update postcard status
            self.client.table.update_item(
                Key={"PK": f"POSTCARD#{postcard_id}", "SK": "METADATA"},
                UpdateExpression="SET #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "collected",
                    ":updated_at": self.client._get_timestamp(),
                },
            )

            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "collect_postcard")

    def get_user_collection(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's postcard collection"""
        try:
            response = self.client.table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_id}")
                & Key("SK").begins_with("COLLECTION#")
            )

            collection_items = []
            for item in response["Items"]:
                postcard_id = item["postcard_id"]
                postcard = self.client.postcards.get_postcard(postcard_id)
                if postcard:
                    collection_items.append(
                        {
                            "postcard_id": postcard_id,
                            "image_url": postcard["image_url"],
                            "text": postcard["text"],
                            "created_at": postcard["created_at"],
                            "author_id": postcard["author_id"],
                            "likes_count": postcard["likes_count"],
                            "collected_at": item["collected_at"],
                        }
                    )

            return collection_items
        except ClientError as e:
            self.client._handle_client_error(e, "get_user_collection")
            return []

    def like_postcard(self, user_id: str, postcard_id: str) -> bool:
        """Like a postcard"""
        try:
            # Check if already liked
            existing_like = self.client.table.get_item(
                Key={"PK": f"USER#{user_id}", "SK": f"LIKE#{postcard_id}"}
            )

            if existing_like.get("Item"):
                return False  # Already liked

            # Add like record
            self.client.table.put_item(
                Item={
                    "PK": f"USER#{user_id}",
                    "SK": f"LIKE#{postcard_id}",
                    "user_id": user_id,
                    "postcard_id": postcard_id,
                    "liked_at": self.client._get_timestamp(),
                }
            )

            # Increment likes count
            self.client.table.update_item(
                Key={"PK": f"POSTCARD#{postcard_id}", "SK": "METADATA"},
                UpdateExpression="ADD likes_count :inc",
                ExpressionAttributeValues={":inc": 1},
            )

            return True
        except ClientError as e:
            self.client._handle_client_error(e, "like_postcard")
            return False
