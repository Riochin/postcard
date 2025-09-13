"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

export default function AuthPage() {
  return (
    <Authenticator
      loginMechanisms={["email"]}
      signUpAttributes={["email"]}
      formFields={{
        signUp: {
          email: {
            order: 1,
            isRequired: true,
          },
          password: {
            order: 2,
            isRequired: true,
          },
          confirm_password: {
            order: 3,
            isRequired: true,
          },
        },
      }}
    >
      {({ signOut, user }) => (
        <main style={{ padding: "2rem" }}>
          <header
            style={{
              padding: "1rem",
              borderBottom: "1px solid #ccc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h1>Welcome, {user?.username}!</h1>
            <button
              onClick={signOut}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </header>
          <div>
            <h2>🎉 Authentication successful!</h2>
            <p>You are now logged in and can access the protected content.</p>
          </div>
        </main>
      )}
    </Authenticator>
  );
}
