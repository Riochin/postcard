import { ForgotPasswordForm } from "../../../components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
