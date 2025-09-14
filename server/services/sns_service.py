import os
import json
from typing import Optional
import boto3
from botocore.exceptions import ClientError
from pywebpush import webpush, WebPushException


class SNSService:
    """Service class for AWS SNS operations and Web Push notifications"""

    def __init__(self):
        self.sns_client = boto3.client("sns")
        self.platform_application_arn = os.getenv("SNS_PLATFORM_APPLICATION_ARN")
        self.topic_arn = os.getenv("SNS_TOPIC_ARN")
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")

        # Storage for Web Push subscriptions (in production, use a database)
        self.web_push_subscriptions = {}

    def create_platform_endpoint(
        self, user_id: str, token: str, user_data: Optional[dict] = None
    ) -> Optional[str]:
        """
        Create a platform endpoint for push notifications
        For Web Push, we'll store the subscription data and return a mock ARN

        Args:
            user_id: Unique user identifier
            token: Web Push subscription JSON string from the client
            user_data: Optional user data for the endpoint

        Returns:
            Mock endpoint ARN for Web Push
        """
        print(f"Creating Web Push endpoint for user {user_id}")
        print(f"Token data: {token}")

        try:
            # Parse the Web Push subscription data
            subscription_info = json.loads(token)

            # Store the subscription (in production, save to database)
            self.web_push_subscriptions[user_id] = subscription_info

            # Create a mock endpoint ARN that includes the user ID
            mock_endpoint_arn = (
                f"arn:aws:sns:us-east-1:868865500828:endpoint/WEBPUSH/{user_id}"
            )

            print(f"Created Web Push endpoint: {mock_endpoint_arn}")
            print(f"Stored subscription for user {user_id}")
            return mock_endpoint_arn

        except json.JSONDecodeError as e:
            print(f"Failed to parse subscription JSON: {e}")
            return None
        except Exception as e:
            print(f"Error creating Web Push endpoint: {e}")
            return None

    def send_notification(
        self, endpoint_arn: str, message: str, title: str = "Postcard Notification"
    ) -> bool:
        """
        Send a Web Push notification directly to the user

        Args:
            endpoint_arn: Mock ARN containing the user ID
            message: Notification message
            title: Notification title

        Returns:
            True if successful, False if failed
        """
        try:
            # Extract user ID from the mock ARN
            user_id = endpoint_arn.split("/")[-1]
            print(f"Sending Web Push notification to user {user_id}")

            # Get the stored subscription for this user
            subscription_info = self.web_push_subscriptions.get(user_id)
            if not subscription_info:
                print(f"No subscription found for user {user_id}")
                return False

            # Create message payload for Web Push
            web_push_message = {
                "title": title,
                "body": message,
                "icon": "/icon-512x512.png",
                "badge": "/icon-512x512.png",
                "url": "/collection",
            }

            # Send Web Push notification
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(web_push_message),
                vapid_private_key=self.vapid_private_key,
                vapid_claims={"sub": "mailto:your-email@example.com"},
            )

            print(f"Web Push notification sent successfully: {response.status_code}")
            return True

        except WebPushException as e:
            print(f"Web Push error: {e}")
            return False
        except Exception as e:
            print(f"Error sending Web Push notification: {e}")
            return False

    def delete_endpoint(self, endpoint_arn: str) -> bool:
        """
        Delete a platform endpoint

        Args:
            endpoint_arn: ARN of the platform endpoint to delete

        Returns:
            True if successful, False if failed
        """
        try:
            self.sns_client.delete_endpoint(EndpointArn=endpoint_arn)
            return True

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            print(
                f"Error deleting endpoint: {error_code} - {e.response['Error']['Message']}"
            )
            return False
