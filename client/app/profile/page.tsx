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
      <Alert color="orange" title="認証が必要です">
        プロフィールページを表示するには、ログインが必要です。
        <Group mt="md">
          <Button onClick={() => navigateTo("/auth")}>ログインページへ</Button>
          <Button variant="light" onClick={() => navigateTo("/")}>
            ホームへ戻る
          </Button>
        </Group>
      </Alert>
    );
  }

  if (!userProfile) {
    return (
      <Stack gap="xl" align="center" mt="xl">
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
    );
  }

  return (
    <Stack gap="xl" align="center" mt="xl">
      <Group>
        <Avatar size="xl" color="blue" src={userProfile.profile_image_url}>
          {userProfile.username.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap="xs">
          <Title order={2}>{userProfile.username}</Title>
          <Text c="dimmed">{userEmail}</Text>
          <Text size="sm" c="dimmed">
            ID: {userProfile.user_id}
          </Text>
        </Stack>
      </Group>

      <Button
        color="red"
        size="lg"
        onClick={handleSignOut}
        loading={loggingOut}
        w={200}
      >
        {loggingOut ? "ログアウト中..." : "ログアウト"}
      </Button>
    </Stack>
  );
}
