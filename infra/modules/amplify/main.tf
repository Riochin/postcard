resource "aws_amplify_app" "nextjs_app" {
  name        = "${var.app_name}-${var.environment}-app"
  repository  = var.github_repository_url
  oauth_token = var.github_oauth_token
  platform    = "WEB"


  # Amplifyがアプリケーションをビルドするための設定(build_spec)
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd client
            - yarn install --frozen-lockfile
        build:
          commands:
            - yarn build
      artifacts:
        baseDirectory: client/.next
        files:
          - '**/*'
      cache:
        paths:
          - client/node_modules/**/*
  EOT
}

# デプロイするブランチの定義
resource "aws_amplify_branch" "prod_branch_deployment" {
  app_id      = aws_amplify_app.nextjs_app.id
  branch_name = var.amplify_prod_branch_name
  stage       = "PRODUCTION"
}
