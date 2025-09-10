# Postcard Client

日本全国を舞台に絵葉書が移動する様子を楽しめる SNS サービスの PWA クライアント

## プッシュ通知の設定

### 1. VAPID キーの生成

```bash
npx web-push generate-vapid-keys
```

### 2. 環境変数の設定

`.env` ファイルを作成し、生成されたキーを追加：

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### 3. メールアドレスの設定（一旦不要）

`app/actions.ts` のメールアドレスを更新：

```typescript
webpush.setVapidDetails(
  "mailto:your-email@example.com", // 実際のメールアドレスに変更
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);
```

## 開発

```bash
yarn install
yarn dev
```
