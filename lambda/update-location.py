import json
import boto3
import logging
import os
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE_NAME", "postcard-dev-dynamodb")
table = dynamodb.Table(table_name)


def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda handler triggered by EventBridge cron
    Updates location data in DynamoDB table
    """
    try:
        logger.info("Update location Lambda function started")
        logger.info(f"Using DynamoDB table: {table_name}")
        logger.info(f"Event: {json.dumps(event)}")

        # Count total items in DynamoDB table
        response = table.scan(Select="COUNT")
        total_items = response["Count"]

        logger.info(f"Total items in table: {total_items}")

        result = {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Location update check completed",
                    "total_items": total_items,
                    "timestamp": datetime.now().isoformat(),
                }
            ),
        }

        logger.info(f"Function completed: {result['body']}")
        return result

    except Exception as e:
        logger.error(f"Lambda function error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": str(e), "timestamp": datetime.now().isoformat()}
            ),
        }
