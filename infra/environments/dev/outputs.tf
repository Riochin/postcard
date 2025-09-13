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
  description = "URL to access the application"
  value       = "http://${module.ecs.load_balancer_dns_name}"
}

# OIDC outputs
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role for OIDC"
  value       = module.oidc.github_actions_role_arn
}
