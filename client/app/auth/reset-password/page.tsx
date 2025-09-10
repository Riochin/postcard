"use client";

import { ResetPasswordForm } from "../../../components/auth/ResetPasswordForm";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  if (!email) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <h2>エラー</h2>
            <p>メールアドレスが指定されていません。</p>
            <a href="/auth/forgot-password">
              パスワードリセット要求ページに戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <ResetPasswordForm email={email} />
      </div>
    </div>
  );
}
