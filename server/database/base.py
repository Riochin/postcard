import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError


class BaseDynamoDBOperations:
    """Base class for DynamoDB operations"""

    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.getenv("DYNAMODB_TABLE_NAME", "postcard-dev-dynamodb")
        self.table = self.dynamodb.Table(self.table_name)

    def _generate_id(self) -> str:
        """Generate unique ID"""
        return str(uuid.uuid4())

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat() + "Z"

    def _handle_client_error(self, error: ClientError, operation: str = "") -> None:
        """Handle DynamoDB client errors"""
        error_code = error.response["Error"]["Code"]
        print(
            f"DynamoDB error in {operation}: {error_code} - {error.response['Error']['Message']}"
        )
        raise error
