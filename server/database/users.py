from typing import Optional, Dict, Any
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError


class UserOperations:
    """User-related DynamoDB operations"""

    def __init__(self, client):
        self.client = client

    def create_user(
        self,
        user_id: str,
        username: str,
        email: str,
        profile_image_url: str,
        sns_endpoint_arn: Optional[str] = None,
    ) -> bool:
        """Create a new user profile"""
        try:
            item = {
                "PK": f"USER#{user_id}",
                "SK": "PROFILE",
                "user_id": user_id,
                "username": username,
                "email": email,
                "profile_image_url": profile_image_url,
                "created_at": self.client._get_timestamp(),
                "updated_at": self.client._get_timestamp(),
            }

            if sns_endpoint_arn:
                item["sns_endpoint_arn"] = sns_endpoint_arn

            self.client.table.put_item(
                Item=item,
                ConditionExpression=Attr("PK").not_exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "create_user")

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile"""
        try:
            response = self.client.table.get_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
            )
            return response.get("Item")
        except ClientError as e:
            self.client._handle_client_error(e, "get_user")
            return None

    def update_user(self, user_id: str, username: str, profile_image_url: str) -> bool:
        """Update user profile"""
        try:
            self.client.table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
                UpdateExpression="SET username = :username, profile_image_url = :profile_image_url, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":username": username,
                    ":profile_image_url": profile_image_url,
                    ":updated_at": self.client._get_timestamp(),
                },
                ConditionExpression=Attr("PK").exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "update_user")

    def delete_user(self, user_id: str) -> bool:
        """Delete user profile"""
        try:
            self.client.table.delete_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
                ConditionExpression=Attr("PK").exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "delete_user")

    def update_user_sns_endpoint(self, user_id: str, sns_endpoint_arn: str) -> bool:
        """Update user's SNS endpoint ARN"""
        try:
            self.client.table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
                UpdateExpression="SET sns_endpoint_arn = :endpoint_arn, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":endpoint_arn": sns_endpoint_arn,
                    ":updated_at": self.client._get_timestamp(),
                },
                ConditionExpression=Attr("PK").exists(),
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            self.client._handle_client_error(e, "update_user_sns_endpoint")
