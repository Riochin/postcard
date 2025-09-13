"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Alert,
  TextInput,
  Container,
  Paper,
  Avatar,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { getAccessToken } from "@/src/utils/auth";
import { createUserProfile } from "@/src/utils/user";
import { ImageUpload } from "@/src/components/ImageUpload";

Amplify.configure(outputs);

export default function ProfileSetupPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      username: "",
      profile_image_url: "",
    },
    validate: {
      username: (value: string) => {
        if (!value) return "ユーザー名を入力してください";
        if (value.length < 2) return "ユーザー名は2文字以上で入力してください";
        if (value.length > 50)
          return "ユーザー名は50文字以内で入力してください";
        return null;
      },
    },
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
    }
  };

  const handleImageUploaded = (key: string, url: string) => {
    form.setFieldValue("profile_image_url", url);
  };

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const result = await createUserProfile({
        username: values.username,
        profile_image_url:
          values.profile_image_url || "https://example.com/default-avatar.jpg",
      });

      if (result.success) {
        notifications.show({
          title: "プロフィール作成完了",
          message: "プロフィールが正常に作成されました",
          color: "green",
        });
        // Force page reload to update Navigation state
        window.location.href = "/";
      } else {
        notifications.show({
          title: "エラー",
          message: result.error || "プロフィール作成に失敗しました",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Profile creation error:", error);
      notifications.show({
        title: "エラー",
        message: "プロフィール作成に失敗しました",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
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
          <Text>認証状態を確認中...</Text>
        </Stack>
      </Center>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <Container size="sm" mt="xl">
        <Alert color="orange" title="認証が必要です">
          プロフィール設定を行うには、ログインが必要です。
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

  return (
    <Container size="sm" mt="xl">
      <Paper shadow="md" radius="lg" p="xl" withBorder>
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <Title order={2}>プロフィール設定</Title>
            <Text c="dimmed" ta="center">
              アプリを利用するために、プロフィール情報を設定してください
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="ユーザー名"
                placeholder="ユーザー名を入力してください"
                required
                {...form.getInputProps("username")}
              />

              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  プロフィール画像
                </Text>
                <Text size="xs" c="dimmed">
                  プロフィール画像をアップロードしてください（オプション）
                </Text>

                {form.values.profile_image_url && (
                  <Box ta="center" mb="md">
                    <Avatar
                      src={form.values.profile_image_url}
                      size={100}
                      radius="md"
                      style={{ margin: "0 auto" }}
                    />
                  </Box>
                )}

                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  hasImage={!!form.values.profile_image_url}
                />
              </Stack>

              <Group justify="end" mt="xl">
                <Button
                  variant="light"
                  onClick={() => navigateTo("/")}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "作成中..." : "プロフィールを作成"}
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
