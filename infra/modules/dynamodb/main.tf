# dynamoDB for the application
resource "aws_dynamodb_table" "app_table" {
  # テーブル名は既存の命名規則を維持します
  name = "${var.app_name}-${var.environment}-dynamodb"

  # 開発段階やアクセスが予測しにくい場合に推奨されるオンデマンド課金モードに変更
  billing_mode = "PAY_PER_REQUEST"

  # --- プライマリキーの定義 ---
  # パーティションキー(PK)
  hash_key = "PK"
  # ソートキー(SK)
  range_key = "SK"

  # --- 属性の定義 ---
  # キーとして使用するすべての属性の名前と型をここで宣言します
  attribute {
    name = "PK"
    type = "S" # S = String
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSIで使用する属性もここで定義が必要です
  attribute {
    name = "GSI-1-PK"
    type = "S"
  }

  attribute {
    name = "GSI-1-SK"
    type = "S"
  }


  # --- GSI (グローバルセカンダリインデックス) の定義 ---
  # これが「もう一つの検索キーセット」の役割を果たします
  global_secondary_index {
    name            = "GSI-1"
    hash_key        = "GSI-1-PK"
    range_key       = "GSI-1-SK"
    projection_type = "ALL" # テーブルの全属性をGSIにコピーします。利便性が高いですが、コストに注意。
  }

  tags = {
    Name = "logipost-table"
  }
}
