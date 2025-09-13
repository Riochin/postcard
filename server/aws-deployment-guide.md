# AWS ECS + EC2 Terraform デプロイメント手引書

このドキュメントは、FastAPIサーバーアプリケーションをTerraformを使用してAWS ECS + EC2にデプロイするための手引書です。

## 前提条件

- Terraform がインストール済み（v1.0以上推奨）
- AWS CLI がインストール済み
- Docker がインストール済み
- AWS アカウントとIAMユーザーが設定済み

## アプリケーション構成

- **フレームワーク**: FastAPI
- **依存関係**: fastapi, uvicorn
- **Python バージョン**: >= 3.13
- **起動ポート**: 8000（デフォルト）

## 1. Dockerfile の作成

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# uv をインストール
RUN pip install uv

# 依存関係ファイルをコピー
COPY pyproject.toml uv.lock ./

# 依存関係をインストール
RUN uv sync --frozen

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# アプリケーションを起動
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 2. Terraform 設定ファイルの作成

### `terraform/` ディレクトリ構成を作成

```
terraform/
├── main.tf          # メインのリソース定義
├── variables.tf     # 変数定義
├── outputs.tf       # 出力値
├── versions.tf      # プロバイダ設定
└── terraform.tfvars # 変数値（.gitignore推奨）
```

### versions.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "postcard"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}
```

### main.tf

```hcl
# データソース
data "aws_caller_identity" "current" {}

data "aws_ami" "ecs_optimized" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
}

# ECR リポジトリ
resource "aws_ecr_repository" "app" {
  name         = "${var.project_name}-server"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# CloudWatch ロググループ
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-server"
  retention_in_days = 7
}

# ECS クラスター
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS クラスター容量プロバイダー
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["EC2"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "EC2"
  }
}

# IAM ロール（ECS インスタンス用）
resource "aws_iam_role" "ecs_instance_role" {
  name = "${var.project_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.project_name}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

# セキュリティグループ
resource "aws_security_group" "ecs_instance" {
  name        = "${var.project_name}-ecs-instance"
  description = "Security group for ECS instances"

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Launch Template
resource "aws_launch_template" "ecs_instance" {
  name_prefix   = "${var.project_name}-ecs-"
  image_id      = data.aws_ami.ecs_optimized.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ecs_instance.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-ecs-instance"
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "ecs" {
  name                = "${var.project_name}-ecs-asg"
  vpc_zone_identifier = [data.aws_subnet.default.id]
  min_size            = 1
  max_size            = 3
  desired_capacity    = 1

  launch_template {
    id      = aws_launch_template.ecs_instance.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }
}

# デフォルトVPC情報を取得
data "aws_vpc" "default" {
  default = true
}

data "aws_subnet" "default" {
  vpc_id            = data.aws_vpc.default.id
  availability_zone = "${var.aws_region}a"
}

# ECS タスク定義
resource "aws_ecs_task_definition" "app" {
  family                = "${var.project_name}-server-task"
  network_mode          = "bridge"
  requires_compatibilities = ["EC2"]
  cpu                   = 256
  memory                = 512

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-server"
      image = var.container_image
      memory = 512
      essential = true

      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ECS サービス
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "EC2"

  depends_on = [aws_autoscaling_group.ecs]
}
```

### outputs.tf

```hcl
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}
```

### terraform.tfvars.example

```hcl
aws_region     = "ap-northeast-1"
project_name   = "postcard"
environment    = "dev"
container_image = "your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com/postcard-server:latest"
```

## 3. Terraform デプロイ手順

### 1. 初期化

```bash
# terraform ディレクトリを作成
mkdir terraform
cd terraform

# 上記の設定ファイルを作成
# terraform.tfvars.example を terraform.tfvars にコピーして設定
cp terraform.tfvars.example terraform.tfvars

# Terraform を初期化
terraform init
```

### 2. Docker イメージのビルドとプッシュ

```bash
# ECR リポジトリを先に作成してURLを取得
terraform apply -target=aws_ecr_repository.app

# ECR へログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)

# Docker イメージをビルド
docker build -t postcard-server .

# タグを付与
docker tag postcard-server:latest $(terraform output -raw ecr_repository_url):latest

# ECR にプッシュ
docker push $(terraform output -raw ecr_repository_url):latest

# terraform.tfvars を更新してcontainer_imageを設定
echo "container_image = \"$(terraform output -raw ecr_repository_url):latest\"" >> terraform.tfvars
```

デプロイ手順

1. terraform.tfvarsを作成:
   cd infra/environments/dev
   cp terraform.tfvars.example terraform.tfvars

# container_imageを適切な値に更新

2. ECRリポジトリを先に作成:
   terraform init
   terraform apply -target=module.ecr

3. Dockerイメージをビルド・プッシュ:

# ECRにログイン

aws ecr get-login-password --region ap-northeast-1 |
docker login --username AWS --password-stdin
$(terraform output -raw ecr_repository_url)

# server/ディレクトリでイメージをビルド（マルチプラットフォーム対応）

cd ../../../server

# 方法1: buildx使用（推奨）

ECR_REPO=$(cd ../infra/environments/dev && terraform output -raw ecr_repository_url)
docker buildx build --platform linux/amd64 --push -t ${ECR_REPO}:latest .

# 方法2: 従来の方法（buildxが使用できない場合）

# docker build -t postcard-server .

# docker tag postcard-server:latest ${ECR_REPO}:latest

# docker push ${ECR_REPO}:latest

4. 残りのリソースをデプロイ:
   cd ../infra/environments/dev
   terraform apply

アプリケーションは terraform output application_url
で取得できるALBのURLでアクセス可能です。

### 3. 残りのリソースをデプロイ

```bash
# 実行計画を確認
terraform plan

# リソースをデプロイ
terraform apply
```

## 4. アプリケーションの確認

```bash
# EC2 インスタンスのIPアドレスを取得（AWS CLIまたはAWSコンソール）
aws ec2 describe-instances --filters "Name=tag:AmazonECSManaged,Values=true" --query 'Reservations[*].Instances[*].PublicIpAddress' --output text

# アプリケーションをテスト
curl http://<ec2-public-ip>:8000
```

期待される応答：

```json
{ "message": "Hello from FastAPI!" }
```

## 5. リソースの削除

```bash
# リソースを削除（ECRのイメージも一緒に削除される）
terraform destroy
```

## 6. トラブルシューティング

### Terraform 関連

```bash
# 現在の状態を確認
terraform show

# 特定のリソースの詳細を確認
terraform state show aws_ecs_service.app
```

### AWS リソースの確認

```bash
# ECS サービスの状態を確認
aws ecs describe-services --cluster $(terraform output -raw ecs_cluster_name) --services postcard-service

# ECS タスクのログを確認
aws logs get-log-events --log-group-name "/ecs/postcard-server" --log-stream-name "ecs/postcard-server/<task-id>"
```

### よくある問題

- **Terraform apply 失敗**: AWS認証情報の設定を確認
- **コンテナ起動失敗**: ECRイメージのプッシュが正しく完了しているか確認
- **ECS サービス起動失敗**: Auto Scaling GroupのEC2インスタンスが正しく起動しているか確認

## 7. 追加の .gitignore エントリ

```gitignore
# Terraform
terraform/
*.tfstate
*.tfstate.backup
*.tfvars
.terraform/
.terraform.lock.hcl
```

## 注意事項

- `terraform.tfvars` にはAWSアカウント情報が含まれるため、必ず `.gitignore` に追加してください
- 本番環境では、Terraform state の管理にS3 + DynamoDBを使用することを推奨します
- セキュリティグループの設定は最小権限の原則に従って調整してください
- EC2インスタンスタイプやリソース設定は要件に応じて変更してください
