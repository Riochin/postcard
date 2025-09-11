// AWS Cognito設定
export const authConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "",
  userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || "",
  userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || "",
};

// 環境変数の検証
import { AUTH_ERROR_MESSAGES } from "./errorMessages";

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
  return true;
};
