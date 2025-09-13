output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = var.domain_name != null ? aws_acm_certificate.main[0].arn : aws_acm_certificate.self_signed[0].arn
}

output "certificate_domain_name" {
  description = "Domain name of the certificate"
  value       = var.domain_name != null ? aws_acm_certificate.main[0].domain_name : "*.elb.amazonaws.com"
}
