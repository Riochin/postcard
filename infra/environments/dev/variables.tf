variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "github_oauth_token" {
  description = "GitHub OAuth Token with 'repo' scope for Amplify to access the repository."
  type        = string
  sensitive   = true
}
