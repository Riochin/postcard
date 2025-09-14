# postcard

## プロジェクト概要

本プロジェクトは、Project LINKS が提供する「モーダルシフト関連データ 自動車輸送統計調査」（[データセットはこちら](https://www.geospatial.jp/ckan/dataset/links-modalshift-2024)）を活用し、
日本全国を舞台に"絵葉書"が移動する様子を楽しめる SNS サービスです。
ユーザーは、移動アルゴリズムによって絵葉書がどのように旅をするかを可視化し、他のユーザーと共有できます。

- Progate ハッカソン powered by AWS で作成
- バックエンド: FastAPI
- フロントエンド: Next.js（PWA 対応）

## Tech Stack

### Backend

<img alt="backend tech stack" src="https://skillicons.dev/icons?theme=dark&perline=6&i=python,fastapi,docker,dynamodb,aws,lambda" />

### Frontend

<img alt="frontend tech stack" src="https://skillicons.dev/icons?theme=dark&perline=7&i=typescript,nextjs,react,aws,bun" />

### Infrastructure

<img alt="infrastructure tech stack" src="https://skillicons.dev/icons?theme=dark&perline=7&i=aws,docker,terraform,githubactions" />

```mermaid
graph TB
    %% Users and External Services
    User[👤 User]
    GitHub[📚 GitHub Repository]

    %% Frontend/Client
    subgraph "Frontend (Client)"
        Client[📱 React Client App]
        Amplify[🚀 AWS Amplify]
    end

    %% Core Infrastructure (Terraform)
    subgraph "Core Infrastructure (Terraform)"
        %% Authentication
        Cognito[🔐 Amazon Cognito<br/>User Authentication]

        %% Compute Layer
        subgraph "Compute Layer"
            ALB[⚖️ Application Load Balancer<br/>with SSL Certificate]
            ECS[🐳 ECS Fargate Cluster<br/>Container Service]
            EC2[🖥️ EC2 Auto Scaling Group<br/>with IAM Instance Profile]
            ECR[📦 ECR Repository<br/>Container Images]
        end

        %% Data Layer
        subgraph "Data Storage"
            DynamoDB[🗄️ DynamoDB<br/>NoSQL Database]
            S3[🪣 S3 Bucket<br/>Static Files & Images]
        end

        %% Lambda Functions
        Lambda[⚡ Lambda Function<br/>update-location<br/>Cron: Every 5 minutes]

        %% Notification Services
        SNS[📧 Amazon SNS<br/>Push Notifications<br/>with Firebase Integration]

        %% Location Services
        Location[🗺️ Amazon Location Service<br/>API Key for Maps]

        %% Monitoring & Logs
        CloudWatch[📊 CloudWatch<br/>Logs & Monitoring]
    end

    %% CI/CD
    subgraph "CI/CD Pipeline"
        GitHubActions[🔄 GitHub Actions]
        OIDC[🔑 OIDC Provider<br/>for GitHub Actions]
    end

    %% User Interactions
    User --> Client
    Client --> Amplify

    %% Amplify Services
    Amplify --> Cognito
    Amplify --> S3
    Amplify --> Location
    Amplify -.-> DynamoDB

    %% Main Application Flow
    Client --> ALB
    ALB --> ECS
    ECS --> DynamoDB
    ECS --> S3
    ECS --> SNS
    ECS --> CloudWatch

    %% Lambda Integration
    Lambda --> DynamoDB
    Lambda --> CloudWatch
    CloudWatch -.->|Cron Trigger| Lambda

    %% Container Management
    ECR --> ECS
    EC2 --> ECS

    %% CI/CD Flow
    GitHub --> GitHubActions
    GitHubActions --> OIDC
    OIDC --> ECR
    GitHubActions --> ECS

    %% Styling
    classDef user fill:#e1f5fe
    classDef frontend fill:#f3e5f5
    classDef compute fill:#fff3e0
    classDef storage fill:#e8f5e8
    classDef serverless fill:#fff8e1
    classDef auth fill:#fce4ec
    classDef cicd fill:#f1f8e9

    class User user
    class Client,Amplify frontend
    class ALB,ECS,EC2,ECR compute
    class DynamoDB,S3 storage
    class Lambda,SNS,Location,CloudWatch serverless
    class Cognito,OIDC auth
    class GitHub,GitHubActions cicd
```

## セットアップ手順

### 前提条件

- Node.js（v18 以上推奨）
- Python（3.10 以上推奨）
- `git` コマンド

### クローン

```sh
git clone https://github.com/Riochin/postcard.git
cd postcard
```

### Pre-commit フックの設定

```sh
pre-commit install
```

### フロントエンド（Next.js）

```sh
# https://bun.com/docs/installation

cd client
bun install
# 開発サーバー起動
bun dev
```

### バックエンド（FastAPI + uv）

```sh
cd server
# uvのインストール（未導入の場合のみ）
curl -LsSf https://astral.sh/uv/install.sh | sh
# ~/.local/bin をPATHに追加（zshの場合）
export PATH="$HOME/.local/bin:$PATH"

# 依存パッケージのインストール
uv sync

# サーバー起動
uv run uvicorn main:app --reload
```

## ブランチ命名規則

以下の命名規則に従ってブランチを作成してください。

- 機能追加: `feature/<内容>`
- バグ修正: `fix/<内容>`
- ドキュメント: `docs/<内容>`
- リファクタリング: `refactor/<内容>`
- その他: `chore/<内容>`

例:

- `feature/login-page`
- `fix/typo-in-header`
- `docs/update-readme`
- `refactor/user-service`
- `chore/update-dependencies`

## コミットメッセージ命名規則

コミットメッセージは、以下のフォーマットに従って記載してください。

```
<type>: <簡単な説明>

<詳細（任意、必要に応じて）>
```

### type 一覧

- feat: 新機能の追加
- fix: バグ修正
- docs: ドキュメントのみの変更
- style: フォーマット（スペースやセミコロンなど）、コードの意味に影響しない変更
- refactor: リファクタリング（機能追加・バグ修正を含まない変更）
- test: テストコードの追加・修正
- chore: ビルドタスクや依存関係などの変更

### 例

- feat: ログイン画面を作成
- fix: ユーザー登録時のバリデーション不具合を修正
- docs: README にセットアップ手順を追記
