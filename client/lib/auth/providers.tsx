"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CognitoUser,
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { authConfig, validateAuthConfig } from "./config";
import { AUTH_ERROR_MESSAGES } from "./errorMessages";
import {
  getLoginErrorMessage,
  getRegisterErrorMessage,
  getForgotPasswordErrorMessage,
  getResetPasswordErrorMessage,
} from "./errorHandlers";

// 認証コンテキストの型定義
interface AuthContextType {
  user?: CognitoUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isDefault: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  error?: string;
}

// デフォルトの認証コンテキスト
const defaultAuthContext: AuthContextType = {
  user: undefined,
  isAuthenticated: false,
  isLoading: false,
  isSubmitting: false,
  isDefault: true,
  login: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  register: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  confirmSignUp: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  resendConfirmationCode: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  logout: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  forgotPassword: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  confirmPasswordReset: async () => {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.AUTH_PROVIDER_NOT_FOUND);
  },
  error: undefined,
};

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Cognito User Poolの初期化
  const userPool = new CognitoUserPool({
    UserPoolId: authConfig.userPoolId,
    ClientId: authConfig.userPoolClientId,
  });

  // 認証状態の確認
  useEffect(() => {
    try {
      validateAuthConfig();
      setIsLoading(true);
      // 現在のユーザーを取得
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession((err: any) => {
          if (err) {
            console.error("セッション取得エラー:", err);
            setUser(undefined);
          } else {
            setUser(currentUser);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("認証設定エラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.CONFIG_ERROR);
      setIsLoading(false);
      setUser(undefined);
    }
  }, []);

  // ログイン機能
  const login = async (email: string, password: string) => {
    try {
      setError(undefined);
      setIsSubmitting(true);

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: () => {
          console.log(AUTH_ERROR_MESSAGES.SUCCESS.LOGIN);
          setUser(cognitoUser);
          setIsSubmitting(false);
        },
        onFailure: (err: any) => {
          console.error("ログイン失敗:", err);
          const errorMessage = getLoginErrorMessage(err.code);
          setError(errorMessage);
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("ログインエラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.LOGIN_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  // 新規登録機能
  const register = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        setError(undefined);
        setIsSubmitting(true);

        // ユーザー属性を設定
        const attributeList = [
          new CognitoUserAttribute({
            Name: "email",
            Value: email,
          }),
        ];

        userPool.signUp(email, password, attributeList, [], (err: any) => {
          if (err) {
            console.error("登録エラー:", err);
            const errorMessage = getRegisterErrorMessage(err.code);
            setError(errorMessage);
            setIsSubmitting(false);
            reject(new Error(errorMessage));
            return;
          }

          console.log(AUTH_ERROR_MESSAGES.SUCCESS.REGISTER);
          setError(undefined);
          setIsSubmitting(false);
          resolve();
        });
      } catch (err: any) {
        console.error("登録エラー:", err);
        setError(AUTH_ERROR_MESSAGES.GENERAL.REGISTER_ERROR);
        setIsSubmitting(false);
        setUser(undefined);
        reject(err);
      }
    });
  };

  // 確認コード機能
  const confirmSignUp = async (email: string, code: string) => {
    try {
      setError(undefined);
      setIsSubmitting(true);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err: any) => {
        if (err) {
          console.error("確認コードエラー:", err);
          const errorMessage = getRegisterErrorMessage(err.code);
          setError(errorMessage);
          setIsSubmitting(false);
          return;
        }

        console.log(AUTH_ERROR_MESSAGES.SUCCESS.REGISTER_COMPLETED);
        setError(undefined);
        setIsSubmitting(false);
      });
    } catch (err: any) {
      console.error("確認コードエラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.REGISTER_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  // 確認コード再送信機能
  const resendConfirmationCode = async (email: string) => {
    try {
      setError(undefined);
      setIsSubmitting(true);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err: any) => {
        if (err) {
          console.error("確認コード再送信エラー:", err);
          const errorMessage = getRegisterErrorMessage(err.code);
          setError(errorMessage);
          setIsSubmitting(false);
          return;
        }

        console.log(AUTH_ERROR_MESSAGES.SUCCESS.RESEND_CONFIRMATION_CODE);
        setError(undefined);
        setIsSubmitting(false);
      });
    } catch (err: any) {
      console.error("確認コード再送信エラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.REGISTER_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  // ログアウト機能
  const logout = async () => {
    try {
      setIsSubmitting(true);
      if (user) {
        console.log(AUTH_ERROR_MESSAGES.SUCCESS.LOGOUT);
        user.signOut();
        setUser(undefined);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("ログアウトエラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.LOGOUT_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  // パスワードリセット要求機能
  const forgotPassword = async (email: string) => {
    try {
      setError(undefined);
      setIsSubmitting(true);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          console.log(AUTH_ERROR_MESSAGES.SUCCESS.PASSWORD_RESET_SENT);
          setError(undefined);
          setIsSubmitting(false);
        },
        onFailure: (err: any) => {
          console.error("パスワードリセット要求失敗:", err);
          const errorMessage = getForgotPasswordErrorMessage(err.code);
          setError(errorMessage);
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("パスワードリセットエラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.FORGOT_PASSWORD_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  // パスワードリセット確認機能
  const confirmPasswordReset = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    try {
      setError(undefined);
      setIsSubmitting(true);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          console.log(AUTH_ERROR_MESSAGES.SUCCESS.PASSWORD_RESET_COMPLETED);
          setError(undefined);
          setIsSubmitting(false);
        },
        onFailure: (err: any) => {
          console.error("パスワードリセット確認失敗:", err);
          const errorMessage = getResetPasswordErrorMessage(err.code);
          setError(errorMessage);
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("パスワードリセット確認エラー:", err);
      setError(AUTH_ERROR_MESSAGES.GENERAL.RESET_PASSWORD_ERROR);
      setIsSubmitting(false);
      setUser(undefined);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== undefined,
    isLoading,
    isSubmitting,
    isDefault: false,
    login,
    register,
    confirmSignUp,
    resendConfirmationCode,
    logout,
    forgotPassword,
    confirmPasswordReset,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 認証フック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context.isDefault) {
    throw new Error(AUTH_ERROR_MESSAGES.SYSTEM.USE_AUTH_OUTSIDE_PROVIDER);
  }
  return context;
}
