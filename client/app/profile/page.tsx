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

Amplify.configure(outputs);

export default function ProfilePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
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
    } catch (error) {
      console.error("Error loading profile:", error);
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

  return (
    <Stack gap="xl" align="center" mt="xl">
      <Group>
        <Avatar size="xl" color="blue">
          {userEmail.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap="xs">
          <Title order={2}>プロフィール</Title>
          <Text c="dimmed">{userEmail}</Text>
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
