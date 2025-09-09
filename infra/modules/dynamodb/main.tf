resource "aws_dynamodb_table" "app_table" {
  name           = "${var.app_name}-${var.environment}-dynamodb"
  write_capacity = 1
  read_capacity  = 1
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S" #　String型の[S]
  }
}
