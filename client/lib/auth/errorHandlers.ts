import { AUTH_ERROR_MESSAGES } from "./errorMessages";

// ログインエラーメッセージ取得関数
export const getLoginErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    UserNotFoundException: AUTH_ERROR_MESSAGES.LOGIN.USER_NOT_FOUND,
    NotAuthorizedException: AUTH_ERROR_MESSAGES.LOGIN.NOT_AUTHORIZED,
    UserNotConfirmedException: AUTH_ERROR_MESSAGES.LOGIN.USER_NOT_CONFIRMED,
  };
  return errorMap[code] || AUTH_ERROR_MESSAGES.LOGIN.DEFAULT;
};

// 登録エラーメッセージ取得関数
export const getRegisterErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    UsernameExistsException: AUTH_ERROR_MESSAGES.REGISTER.USERNAME_EXISTS,
    InvalidPasswordException: AUTH_ERROR_MESSAGES.REGISTER.INVALID_PASSWORD,
    InvalidParameterException: AUTH_ERROR_MESSAGES.REGISTER.INVALID_PARAMETER,
  };
  return errorMap[code] || AUTH_ERROR_MESSAGES.REGISTER.DEFAULT;
};

// パスワードリセット要求エラーメッセージ取得関数
export const getForgotPasswordErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    UserNotFoundException: AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.USER_NOT_FOUND,
    InvalidParameterException:
      AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.INVALID_PARAMETER,
  };
  return errorMap[code] || AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.DEFAULT;
};

// パスワードリセット確認エラーメッセージ取得関数
export const getResetPasswordErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    CodeMismatchException: AUTH_ERROR_MESSAGES.RESET_PASSWORD.CODE_MISMATCH,
    ExpiredCodeException: AUTH_ERROR_MESSAGES.RESET_PASSWORD.EXPIRED_CODE,
    NotAuthorizedException: AUTH_ERROR_MESSAGES.RESET_PASSWORD.NOT_AUTHORIZED,
    InvalidPasswordException:
      AUTH_ERROR_MESSAGES.RESET_PASSWORD.INVALID_PASSWORD,
  };
  return errorMap[code] || AUTH_ERROR_MESSAGES.RESET_PASSWORD.DEFAULT;
};
