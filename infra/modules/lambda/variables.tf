variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "function_name" {
  description = "Lambda function name (will be prefixed with app_name-environment)"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "handler" {
  description = "Lambda function handler"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "source_code_path" {
  description = "Path to the Lambda source code Python file (will be zipped automatically)"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name to grant access to"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN to grant access to"
  type        = string
}

variable "cron_schedule" {
  description = "EventBridge cron schedule expression"
  type        = string
  default     = "rate(1 hour)"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
