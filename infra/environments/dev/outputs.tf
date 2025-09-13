# ECR outputs
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecr.repository_url
}

# ECS outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.load_balancer_dns_name
}

output "application_url" {
  description = "URL to access the application (HTTP - redirects to HTTPS)"
  value       = "http://${module.ecs.load_balancer_dns_name}"
}

output "application_url_https" {
  description = "HTTPS URL to access the application"
  value       = "https://${module.ecs.load_balancer_dns_name}"
}

# OIDC outputs
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role for OIDC"
  value       = module.oidc.github_actions_role_arn
}

# Lambda outputs
output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.function_arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

# S3 outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3.bucket_arn
}
