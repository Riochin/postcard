# SNS topic for postcard collect notifications
resource "aws_sns_topic" "postcard_collect_notifications" {
  name = "postcard_collect_notifications"

  tags = var.tags
}

# SNS Platform Application for Firebase Cloud Messaging (PWA)
resource "aws_sns_platform_application" "postcard_fcm_app" {
  count = var.firebase_server_key != null ? 1 : 0

  name                = "${var.app_name}-${var.environment}-fcm-app"
  platform            = "GCM"
  platform_credential = var.firebase_server_key
}

# IAM policy for SNS publish and endpoint creation
resource "aws_iam_policy" "sns_publish_policy" {
  name        = "${var.app_name}-${var.environment}-sns-publish-policy"
  path        = "/"
  description = "Policy for SNS publish and endpoint creation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.postcard_collect_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:CreatePlatformEndpoint",
          "sns:DeleteEndpoint",
          "sns:GetEndpointAttributes",
          "sns:SetEndpointAttributes"
        ]
        Resource = var.firebase_server_key != null ? "${aws_sns_platform_application.postcard_fcm_app[0].arn}/*" : "*"
      }
    ]
  })

  tags = var.tags
}
