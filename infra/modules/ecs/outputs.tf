output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "task_definition_arn" {
  description = "Full ARN of the Task Definition"
  value       = aws_ecs_task_definition.app.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "load_balancer_zone_id" {
  description = "Hosted zone ID of the load balancer"
  value       = aws_lb.app.zone_id
}

output "target_group_arn" {
  description = "ARN of the Target Group"
  value       = aws_lb_target_group.app.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}
