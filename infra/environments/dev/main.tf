terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  required_version = ">= 1.0.0"
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}


module "cognitive" {
  source      = "../../modules/cognito"
  app_name    = var.app_name
  environment = var.environment
}
