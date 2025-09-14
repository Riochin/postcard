output "topic_arn" {
  description = "ARN of the SNS topic for postcard collect notifications"
  value       = aws_sns_topic.postcard_collect_notifications.arn
}

output "topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.postcard_collect_notifications.name
}

output "platform_application_arn" {
  description = "ARN of the SNS platform application for FCM"
  value       = null
}

output "sns_policy_arn" {
  description = "ARN of the SNS publish policy"
  value       = aws_iam_policy.sns_publish_policy.arn
}
