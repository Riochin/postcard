"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  PasswordInput,
} from "@mantine/core";

Amplify.configure(outputs);

export default function AuthPage() {
  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Authenticator
          loginMechanisms={["email"]}
          signUpAttributes={["email"]}
          formFields={{
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
          }}
          components={{
            Header() {
              return (
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <Title order={2} mb="sm">
                    ポストカードアプリ
                  </Title>
                </div>
              );
            },
            Footer() {
              return (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <Text size="sm" c="dimmed">
                    アカウントをお持ちでない場合は、サインアップしてください
                  </Text>
                </div>
              );
            },
            SignIn: {
              Header() {
                return (
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <Title order={3} mb="sm">
                      ログイン
                    </Title>
                    <Text c="dimmed">
                      メールアドレスとパスワードを入力してください
                    </Text>
                  </div>
                );
              },
            },
            SignUp: {
              Header() {
                return (
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <Title order={3} mb="sm">
                      アカウント作成
                    </Title>
                    <Text c="dimmed">新しいアカウントを作成してください</Text>
                  </div>
                );
              },
            },
          }}
        >
          {({ signOut, user }) => (
            <>
              <Group justify="space-between" mb="xl">
                <Title order={1}>ようこそ、{user?.username}さん！</Title>
                <Button color="red" onClick={signOut}>
                  ログアウト
                </Button>
              </Group>

              <Paper p="lg" radius="md" bg="green.0">
                <Title order={2} c="green.7" mb="md">
                  🎉 認証成功！
                </Title>
                <Text c="dimmed">
                  ログインが完了しました。保護されたコンテンツにアクセスできます。
                </Text>
              </Paper>
            </>
          )}
        </Authenticator>
      </Paper>
    </Container>
  );
}
