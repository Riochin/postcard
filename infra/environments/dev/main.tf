locals {
  github_repository_url = "https://github.com/Riochin/postcard"
  common_tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

module "cognito" {
  source      = "../../modules/cognito"
  app_name    = var.app_name
  environment = var.environment
}


# ECR Repository
module "ecr" {
  source      = "../../modules/ecr"
  app_name    = var.app_name
  environment = var.environment
  tags        = local.common_tags
}

# IAM Roles for ECS
module "iam" {
  source = "../../modules/iam"

  project_name = var.app_name
  tags         = local.common_tags
}

# Compute Resources (EC2, Auto Scaling, Security Groups)
module "compute" {
  source                = "../../modules/compute"
  app_name              = var.app_name
  environment           = var.environment
  instance_profile_name = module.iam.ecs_instance_profile_name
  instance_type         = var.instance_type
  key_name              = var.key_name
  app_port              = var.app_port
  min_capacity          = var.min_capacity
  max_capacity          = var.max_capacity
  desired_capacity      = var.desired_capacity
  tags                  = local.common_tags
}

# ECS Cluster, Service, and Load Balancer
module "ecs" {
  source = "../../modules/ecs"

  app_name                        = var.app_name
  environment                     = var.environment
  aws_region                      = var.aws_region
  vpc_id                          = data.aws_vpc.default.id
  subnet_ids                      = data.aws_subnets.default.ids
  container_image                 = var.container_image
  task_execution_role_arn         = module.iam.ecs_task_execution_role_arn
  task_cpu                        = var.task_cpu
  task_memory                     = var.task_memory
  container_memory                = var.container_memory
  container_port                  = var.container_port
  desired_count                   = var.service_desired_count
  log_retention_days              = var.log_retention_days
  container_environment_variables = var.container_environment_variables
  tags                            = local.common_tags

  depends_on = [module.compute]
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  app_name    = var.app_name
  environment = var.environment
}

# OIDC for GitHub Actions
module "oidc" {
  source            = "../../modules/oidc"
  app_name          = var.app_name
  environment       = var.environment
  github_repository = "Riochin/postcard"
  tags              = local.common_tags
}
