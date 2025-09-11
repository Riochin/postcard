variable "environment" {
  description = "Environment name"
  type        = string

}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "aws_region" {
  description = "To deploy resources."
  type        = string
  default     = "ap-northeast-1"
}

variable "github_repository_url" {
  description = "The URL of the GitHub repository containing the React app."
  type        = string
}

variable "github_oauth_token" {
  description = "GitHub OAuth Token with 'repo' scope for Amplify to access the repository."
  type        = string
  sensitive   = true
}

variable "amplify_prod_branch_name" {
  description = "The branch name to deploy in Amplify."
  type        = string
  default     = "main"
}
