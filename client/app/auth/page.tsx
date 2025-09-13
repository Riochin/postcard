"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Title, Text, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

Amplify.configure(outputs);

// Styles
const pageStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "400px",
  },
  redirecting: {
    textAlign: "center" as const,
    padding: "2rem",
    fontSize: "1.1rem",
  },
  headerCenter: {
    textAlign: "center" as const,
    marginBottom: "2rem",
  },
};

// Form field configurations
const formFields = {
  signIn: {
    username: {
      label: "メールアドレス",
      placeholder: "メールアドレスを入力してください",
    },
    password: {
      label: "パスワード",
      placeholder: "パスワードを入力してください",
    },
  },
  signUp: {
    email: {
      order: 1,
      isRequired: true,
      label: "メールアドレス",
      placeholder: "メールアドレスを入力してください",
    },
    password: {
      order: 2,
      isRequired: true,
      label: "パスワード",
      placeholder: "パスワードを入力してください",
    },
    confirm_password: {
      order: 3,
      isRequired: true,
      label: "パスワード確認",
      placeholder: "パスワードを再入力してください",
    },
  },
};

// Custom components
const AppHeader = () => (
  <div style={pageStyles.headerCenter}>
    <Group justify="center" gap="sm" mb="sm">
      <Image
        src="/icon-192x192.png"
        alt="Postcard"
        width={40}
        height={40}
        style={{ borderRadius: "8px" }}
      />
      <Title order={2}>Postcard</Title>
    </Group>
  </div>
);

const AppFooter = () => (
  <div style={{ textAlign: "center" as const, marginTop: "2rem" }}>
    <Text size="sm" c="dimmed">
      アカウントをお持ちでない場合は、サインアップしてください
    </Text>
  </div>
);

const SignInHeader = () => (
  <div style={pageStyles.headerCenter}>
    <Title order={3} mb="sm">
      ログイン
    </Title>
    <Text c="dimmed">メールアドレスとパスワードを入力してください</Text>
  </div>
);

const SignUpHeader = () => (
  <div style={pageStyles.headerCenter}>
    <Title order={3} mb="sm">
      アカウント作成
    </Title>
    <Text c="dimmed">新しいアカウントを作成してください</Text>
  </div>
);

function AuthenticatedContent({ user }: { user: any }) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkUserAndRedirect();
    }
  }, [user, router]);

  const checkUserAndRedirect = async () => {
    try {
      const { checkUserExists } = await import("@/src/utils/user");
      const result = await checkUserExists();

      if (result.exists) {
        router.push("/");
      } else {
        router.push("/profile/setup");
      }
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/profile/setup");
    }
  };

  return <div style={pageStyles.redirecting}>リダイレクト中...</div>;
}

export default function AuthPage() {
  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.formWrapper}>
        <Authenticator
          loginMechanisms={["email"]}
          signUpAttributes={["email"]}
          formFields={formFields}
          components={{
            Header: AppHeader,
            Footer: AppFooter,
            SignIn: { Header: SignInHeader },
            SignUp: { Header: SignUpHeader },
          }}
        >
          {({ user }) => <AuthenticatedContent user={user} />}
        </Authenticator>
      </div>
    </div>
  );
}
