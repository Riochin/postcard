#============================================================================
# Github Actions 用ロール
#============================================================================
# -----------------------------------------------------------------------------
# GitHub Actions プロバイダー設定
# -----------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "terraform_cicd" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # このコードは固定値
  # OIDC ID プロバイダーのサムプリント
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# -----------------------------------------------------------------------------
# GitHub Actions 用ロール作成
# -----------------------------------------------------------------------------
resource "aws_iam_role" "terraform_cicd_oidc_role" {
  name = "${var.app_name}-${var.environment}-oidc-role"
  path = "/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = aws_iam_openid_connect_provider.terraform_cicd.arn
      }
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [
            # リポジトリ制限
            # 複数定義可能
            # xxxxx：GitHubのアカウント名
            # terraform_testの部分はGitHubActionsを使用したいリポジトリ名
            "repo:${var.github_repository}:*",
          ]
        }
      }
    }]
  })
}

# -----------------------------------------------------------------------------
# ポリシーのアタッチ（AdministratorAccess_attachment）
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "AdministratorAccess_attachment" {
  role = aws_iam_role.terraform_cicd_oidc_role.name
  # Admin権限を指定
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
