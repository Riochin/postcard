locals {
  github_repository_url    = "https://github.com/Riochin/postcard"
  amplify_prod_branch_name = "main"
}

module "cognito" {
  source      = "../../modules/cognito"
  app_name    = var.app_name
  environment = var.environment
}

module "amplify" {
  source                   = "../../modules/amplify"
  app_name                 = var.app_name
  environment              = var.environment
  aws_region               = var.aws_region
  github_repository_url    = local.github_repository_url
  github_oauth_token       = var.github_oauth_token
  amplify_prod_branch_name = local.amplify_prod_branch_name
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  app_name    = var.app_name
  environment = var.environment
}
