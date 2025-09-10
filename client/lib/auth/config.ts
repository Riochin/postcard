// AWS Cognito設定
export const authConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "",
  userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || "",
  userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || "",
  userPoolClientSecret:
    process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_SECRET || "",
};

// 環境変数の検証
import { AUTH_ERROR_MESSAGES } from "./errorMessages";

// SECRET_HASH計算関数（ブラウザ対応）
export const calculateSecretHash = async (
  username: string,
): Promise<string> => {
  if (!authConfig.userPoolClientSecret) {
    return "";
  }

  const message = username + authConfig.userPoolClientId;

  // Web Crypto APIを使用
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authConfig.userPoolClientSecret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = new Uint8Array(signature);
  const hashBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(hashArray)),
  );

  return hashBase64;
};

export const validateAuthConfig = () => {
  if (!authConfig.region) {
    throw new Error(AUTH_ERROR_MESSAGES.CONFIG.AWS_REGION_REQUIRED);
  }
  if (!authConfig.userPoolId) {
    throw new Error(AUTH_ERROR_MESSAGES.CONFIG.AWS_USER_POOL_ID_REQUIRED);
  }
  if (!authConfig.userPoolClientId) {
    throw new Error(AUTH_ERROR_MESSAGES.CONFIG.AWS_CLIENT_ID_REQUIRED);
  }
  if (!authConfig.userPoolClientSecret) {
    throw new Error(AUTH_ERROR_MESSAGES.CONFIG.AWS_CLIENT_SECRET_REQUIRED);
  }
  return true;
};
