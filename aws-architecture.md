# AWS Architecture Diagram

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

## Architecture Overview

このプロジェクトは以下の主要コンポーネントで構成されています：

### Frontend Layer

- **React Client**: メインのフロントエンドアプリケーション
- **AWS Amplify**: 認証、データ、ストレージ、位置情報サービスの統合

### Core Infrastructure (Terraform)

- **ECS Fargate**: コンテナ化されたアプリケーションの実行
- **Application Load Balancer**: SSL終端とトラフィック分散
- **EC2 Auto Scaling**: 自動スケーリング機能付きインスタンス管理
- **DynamoDB**: NoSQLデータベース
- **S3**: 静的ファイルと画像の保存
- **Lambda**: 定期実行関数（5分間隔で位置情報更新）

### Additional Services

- **Amazon Cognito**: ユーザー認証とアクセス管理
- **Amazon SNS**: Firebaseと連携したプッシュ通知
- **Amazon Location Service**: 地図APIキーの管理
- **CloudWatch**: ログとモニタリング

### CI/CD Pipeline

- **GitHub Actions**: 自動デプロイメント
- **OIDC Provider**: セキュアなAWSアクセス
- **ECR**: Dockerイメージのレジストリ
