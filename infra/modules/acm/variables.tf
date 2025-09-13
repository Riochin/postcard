variable "domain_name" {
  description = "Domain name for the certificate (set to null to use self-signed for ALB default DNS)"
  type        = string
  default     = null
}

variable "subject_alternative_names" {
  description = "Subject alternative names for the certificate"
  type        = list(string)
  default     = []
}

variable "organization" {
  description = "Organization name for self-signed certificate"
  type        = string
  default     = "Default Organization"
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}
