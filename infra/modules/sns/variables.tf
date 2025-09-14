variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "firebase_server_key" {
  description = "Firebase Cloud Messaging server key for PWA push notifications"
  type        = string
  default     = null
  sensitive   = true
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
