// AWS Cognito認証エラーメッセージの定数

export const AUTH_ERROR_MESSAGES = {
  // ログインエラー
  LOGIN: {
    USER_NOT_FOUND: "ユーザーが見つかりません",
    NOT_AUTHORIZED: "メールアドレスまたはパスワードが正しくありません",
    USER_NOT_CONFIRMED:
      "アカウントが確認されていません。メールを確認してください",
    DEFAULT: "ログインに失敗しました",
  },

  // 登録エラー
  REGISTER: {
    USERNAME_EXISTS: "このメールアドレスは既に登録されています",
    INVALID_PASSWORD: "パスワードが要件を満たしていません",
    INVALID_PARAMETER: "入力内容に問題があります",
    DEFAULT: "登録に失敗しました",
  },

  // パスワードリセット要求エラー
  FORGOT_PASSWORD: {
    USER_NOT_FOUND: "このメールアドレスは登録されていません",
    INVALID_PARAMETER: "メールアドレスが正しくありません",
    DEFAULT: "パスワードリセット要求に失敗しました",
  },

  // パスワードリセット確認エラー
  RESET_PASSWORD: {
    CODE_MISMATCH: "確認コードが正しくありません",
    EXPIRED_CODE: "確認コードの有効期限が切れています",
    NOT_AUTHORIZED: "確認コードが無効です",
    INVALID_PASSWORD: "新しいパスワードが要件を満たしていません",
    DEFAULT: "パスワードリセットに失敗しました",
  },

  // その他のエラー
  GENERAL: {
    LOGIN_ERROR: "ログイン中にエラーが発生しました",
    REGISTER_ERROR: "登録中にエラーが発生しました",
    FORGOT_PASSWORD_ERROR: "パスワードリセット中にエラーが発生しました",
    RESET_PASSWORD_ERROR: "パスワードリセット確認中にエラーが発生しました",
    LOGOUT_ERROR: "ログアウトに失敗しました",
    CONFIG_ERROR: "認証設定が正しくありません",
  },

  // システムエラー
  SYSTEM: {
    AUTH_PROVIDER_NOT_FOUND: "AuthProviderが見つかりません",
    USE_AUTH_OUTSIDE_PROVIDER:
      "useAuthはAuthProvider内で使用する必要があります",
  },

  // 設定エラー
  CONFIG: {
    AWS_REGION_REQUIRED: "AWSリージョンの設定が必要です",
    AWS_USER_POOL_ID_REQUIRED: "AWSユーザープールIDの設定が必要です",
    AWS_CLIENT_ID_REQUIRED: "AWSクライアントIDの設定が必要です",
    AWS_CLIENT_SECRET_REQUIRED: "AWSクライアントシークレットの設定が必要です",
  },

  // バリデーションエラー
  VALIDATION: {
    EMAIL_REQUIRED: "メールアドレスを入力してください",
    EMAIL_INVALID: "有効なメールアドレスを入力してください",
    PASSWORD_REQUIRED: "パスワードを入力してください",
    PASSWORD_MIN_LENGTH: "パスワードは8文字以上で入力してください",
    PASSWORD_COMPLEXITY:
      "パスワードは大文字、小文字、数字、特殊文字を含む必要があります",
    PASSWORD_CONFIRM_REQUIRED: "パスワード確認を入力してください",
    PASSWORD_MISMATCH: "パスワードが一致しません",
    CODE_REQUIRED: "確認コードを入力してください",
  },

  // 成功メッセージ
  SUCCESS: {
    LOGIN: "ログイン成功",
    LOGOUT: "ログアウト成功",
    REGISTER: "登録成功",
    REGISTER_COMPLETED:
      "登録が完了しました。メールアドレスを確認してください。",
    PASSWORD_RESET_SENT: "パスワードリセットメールを送信しました",
    PASSWORD_RESET_COMPLETED: "パスワードリセットが完了しました",
    PASSWORD_RESET_SUCCESS:
      "パスワードリセットが完了しました。新しいパスワードでログインしてください。",
    RESEND_CONFIRMATION_CODE: "確認コードを再送信しました",
  },
} as const;
