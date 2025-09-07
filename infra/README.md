# インフラストラクチャ

このディレクトリには、Terraformを使用したインフラストラクチャの構成が含まれています。

## ディレクトリ構成

```
infra/
├── docker-compose.yml        # Terraform実行用のDockerコンテナ設定
├── .env                      # 環境変数設定
├── environments/             # 環境別の設定
│   └── dev/                 # 開発環境
│       ├── main.tf          # メインのTerraform設定
│       ├── variables.tf     # 変数定義
│       └── terraform.tfvars # 変数の値
└── modules/                 # 再利用可能なTerraformモジュール
```

## 使用方法

### 1. 環境変数の設定

`.env`ファイルにAWSの認証情報を設定してください：

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 2. Terraformコンテナに入る

```bash
cd infra
docker compose -f docker-compose.yml run --rm terraform
```

### 3. Terraform初期化

コンテナ内で以下を実行：

```bash
cd environments/dev
terraform init
```

### 4. Terraformプランの確認

```bash
terraform plan
```

### 5. インフラストラクチャのデプロイ

```bash
terraform apply
```
