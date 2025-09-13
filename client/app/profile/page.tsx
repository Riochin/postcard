"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import { signOut } from "aws-amplify/auth";
import outputs from "@/amplify_outputs.json";
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Avatar,
  Alert,
  Container,
} from "@mantine/core";
import { getAuthToken, getAccessToken } from "@/src/utils/auth";
import { checkUserExists } from "@/src/utils/user";
import type { UserProfile } from "@/src/api/types.gen";

Amplify.configure(outputs);

export default function ProfilePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAuthStatus("authenticated");
        await loadUserProfile();
      } else {
        setAuthStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
    }
  };

  const loadUserProfile = async () => {
    try {
      const result = await checkUserExists();

      if (result.exists && result.profile) {
        setUserProfile(result.profile);

        // Also get email from token for display
        const authTokens = await getAuthToken();
        if (authTokens?.idToken) {
          try {
            const payload = JSON.parse(atob(authTokens.idToken.split(".")[1]));
            setUserEmail(payload.email || "Unknown");
          } catch (err) {
            console.error("Error decoding token:", err);
            setUserEmail("Unknown");
          }
        }
      } else {
        // User profile doesn't exist, show error message instead of redirect
        setUserEmail("プロフィール未設定");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setUserEmail("エラーが発生しました");
    }
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      setLoggingOut(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (authStatus === "loading") {
    return (
      <Center h="60vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>プロフィールを読み込み中...</Text>
        </Stack>
      </Center>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <Container size="sm" mt="xl">
        <Alert color="orange" title="認証が必要です">
          プロフィールページを表示するには、ログインが必要です。
          <Group mt="md">
            <Button onClick={() => navigateTo("/auth")}>
              ログインページへ
            </Button>
            <Button variant="light" onClick={() => navigateTo("/")}>
              ホームへ戻る
            </Button>
          </Group>
        </Alert>
      </Container>
    );
  }

  if (!userProfile) {
    return (
      <Container size="sm" mt="xl">
        <Stack gap="xl" align="center">
          <Alert color="orange" title="プロフィール未設定">
            プロフィール情報が設定されていません。
            <Group mt="md">
              <Button onClick={() => navigateTo("/profile/setup")}>
                プロフィールを設定
              </Button>
            </Group>
          </Alert>
          <Button
            color="red"
            variant="light"
            onClick={handleSignOut}
            loading={loggingOut}
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs" mt="xl">
      <Stack gap="xl" align="center">
        {/* Profile Header */}
        <Stack gap="md" align="center">
          <Avatar
            size={100}
            src={userProfile.profile_image_url}
            style={{
              border: "2px solid var(--mantine-color-gray-3)",
            }}
          >
            {userProfile.username.charAt(0).toUpperCase()}
          </Avatar>

          <Stack gap={4} align="center">
            <Title order={2} fw={600} c="dark.8">
              {userProfile.username}
            </Title>
            <Text size="sm" c="dimmed">
              {userEmail}
            </Text>
          </Stack>
        </Stack>

        {/* Actions */}
        <Stack gap="xs" w="100%" maw={280}>
          <Button
            variant="default"
            fullWidth
            onClick={() => navigateTo("/profile/setup")}
            h={44}
          >
            プロフィールを編集
          </Button>

          <Button
            variant="subtle"
            color="red"
            fullWidth
            onClick={handleSignOut}
            loading={loggingOut}
            h={44}
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
