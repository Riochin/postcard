resource "aws_cognito_user_pool" "pool" {
  name = "${var.app_name}-${var.environment}-user-pool"
}


resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.app_name}-${var.environment}-user-pool-client"
  user_pool_id = aws_cognito_user_pool.pool.id
}
