variable "app_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the load balancer"
  type        = list(string)
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "task_cpu" {
  description = "Number of cpu units used by the task"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Amount of memory (in MiB) used by the task"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Amount of memory (in MiB) to allow the container to use"
  type        = number
  default     = 512
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
  default     = 8000
}

variable "desired_count" {
  description = "Desired number of instances of the task definition to place and keep running"
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "Number of days to retain log events"
  type        = number
  default     = 7
}

variable "container_environment_variables" {
  description = "List of environment variables to pass to the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}
