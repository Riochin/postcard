"use client";

import { Button, Group, Text, Stack, Container } from "@mantine/core";
import { useAuth } from "../lib/auth/providers";

export default function HomePage() {
  const { logout, user, isAuthenticated, isLoading } = useAuth();
  const userEmail = user?.getUsername() || undefined;

  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Text>読み込み中...</Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Text size="xl" fw={700}>
          ホームページ
        </Text>

        {isAuthenticated ? (
          <Stack>
            <Text>ようこそ、{userEmail}さん！</Text>
            <Group>
              <Button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error("ログアウトエラー:", error);
                  }
                }}
                variant="outline"
              >
                ログアウト
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack>
            <Text>ログインしてください</Text>
            <Group>
              <Button component="a" href="/auth/login">
                ログイン
              </Button>
              <Button component="a" href="/auth/register" variant="outline">
                新規登録
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
