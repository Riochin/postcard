output "security_group_id" {
  description = "ID of the ECS instance security group"
  value       = aws_security_group.ecs_instance.id
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.ecs_instance.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.ecs.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.ecs.arn
}
