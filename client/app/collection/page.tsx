"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Title,
  Text,
  Container,
  Grid,
  Card,
  Image,
  Group,
  Badge,
  Stack,
  Loader,
  Center,
  Button,
} from "@mantine/core";
import { Heart, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { getAccessToken } from "@/src/utils/auth";
import { getMyCollectionApiUsersMeCollectionGet } from "@/src/api/sdk.gen";
import type { PostcardInCollection } from "@/src/api/types.gen";
import { notifications } from "@mantine/notifications";

export default function CollectionPage() {
  const router = useRouter();
  const [collectedPostcards, setCollectedPostcards] = useState<
    PostcardInCollection[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    checkAuthAndLoadCollection();
  }, []);

  const checkAuthAndLoadCollection = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setAuthStatus("unauthenticated");
        setIsLoading(false);
        return;
      }

      setAuthStatus("authenticated");
      await loadCollection();
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
      setIsLoading(false);
    }
  };

  const loadCollection = async () => {
    try {
      setIsLoading(true);

      const response = await getMyCollectionApiUsersMeCollectionGet();
      if (response.data) {
        setCollectedPostcards(response.data);
      }
    } catch (error) {
      console.error("Error loading collection:", error);
      notifications.show({
        title: "エラー",
        message: "コレクションの読み込みに失敗しました",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <Center h="60vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>コレクションを読み込み中...</Text>
        </Stack>
      </Center>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <Container size="sm" mt="xl">
        <Stack align="center" gap="xl">
          <Title order={2}>🔐 ログインが必要です</Title>
          <Text size="lg" ta="center">
            コレクションを表示するにはログインが必要です。
          </Text>
          <Button onClick={() => router.push("/auth")} size="lg">
            ログインページへ
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            戻る
          </Button>
          <div>
            <Title order={1}>📚 コレクション</Title>
            <Text c="dimmed">あなたが収集した絵葉書</Text>
          </div>
        </Group>

        {/* Collection Grid */}
        {collectedPostcards.length > 0 ? (
          <Grid>
            {collectedPostcards.map((postcard) => (
              <Grid.Col
                key={postcard.postcard_id}
                span={{ base: 12, sm: 6, md: 4 }}
              >
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Image
                      src={postcard.image_url}
                      height={200}
                      alt="絵葉書"
                      fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
                    />
                  </Card.Section>

                  <Stack gap="sm" mt="md">
                    <Text fw={500} lineClamp={2}>
                      {postcard.text}
                    </Text>

                    <Group gap="xs">
                      <Calendar size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">
                        {new Date(postcard.created_at).toLocaleDateString(
                          "ja-JP",
                        )}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      <Heart size={14} color="#868e96" />
                      <Text size="sm" c="dimmed">
                        {postcard.likes_count} いいね
                      </Text>
                    </Group>

                    <Badge color="green" variant="light" size="sm">
                      コレクション済み
                    </Badge>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Center py="xl">
            <Stack align="center" gap="lg">
              <div style={{ fontSize: "4rem" }}>📭</div>
              <div style={{ textAlign: "center" }}>
                <Title order={3} mb="sm">
                  まだコレクションがありません
                </Title>
                <Text c="dimmed" mb="lg">
                  マップで絵葉書を見つけて、コレクションに追加しましょう！
                </Text>
                <Button onClick={() => router.push("/")} size="lg">
                  マップに戻る
                </Button>
              </div>
            </Stack>
          </Center>
        )}
      </Stack>
    </Container>
  );
}
