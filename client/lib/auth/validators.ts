// 認証フォーム用のバリデーション関数

import { AUTH_ERROR_MESSAGES } from "./errorMessages";

export const emailValidator = (value: string) => {
  if (!value) return AUTH_ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED;
  if (!/^\S+@\S+\.\S+$/.test(value))
    return AUTH_ERROR_MESSAGES.VALIDATION.EMAIL_INVALID;
  return undefined;
};

export const passwordValidator = (value: string) => {
  if (!value) return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED;
  if (value.length < 8)
    return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_COMPLEXITY;
  }
  return undefined;
};

export const confirmPasswordValidator = (value: string, values: any) => {
  if (!value) return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_CONFIRM_REQUIRED;
  if (value !== values?.password)
    return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_MISMATCH;
  return undefined;
};

export const confirmNewPasswordValidator = (value: string, values: any) => {
  if (!value) return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_CONFIRM_REQUIRED;
  if (value !== values?.newPassword)
    return AUTH_ERROR_MESSAGES.VALIDATION.PASSWORD_MISMATCH;
  return undefined;
};

export const codeValidator = (value: string) => {
  if (!value) return AUTH_ERROR_MESSAGES.VALIDATION.CODE_REQUIRED;
  return undefined;
};
