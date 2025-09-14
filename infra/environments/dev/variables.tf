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


# ECS/EC2 related variables
variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the EC2 key pair"
  type        = string
  default     = null
}

variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 8000
}

variable "min_capacity" {
  description = "Minimum number of instances in the Auto Scaling Group"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of instances in the Auto Scaling Group"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in the Auto Scaling Group"
  type        = number
  default     = 1
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

variable "service_desired_count" {
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

# SNS related variables
variable "firebase_server_key" {
  description = "Firebase Cloud Messaging server key for push notifications"
  type        = string
  default     = null
  sensitive   = true
}
