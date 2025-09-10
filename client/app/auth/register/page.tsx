import { RegisterForm } from "../../../components/auth/RegisterForm";

export default function RegisterPage() {
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
        <RegisterForm />
      </div>
    </div>
  );
}
