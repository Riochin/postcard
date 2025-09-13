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
import { MapPin, Calendar, ArrowLeft, User } from "lucide-react";
import { getAccessToken } from "@/src/utils/auth";
import {
  getMyCollectionApiUsersMeCollectionGet,
  getUserProfileApiUsersUserIdGet,
} from "@/src/api/sdk.gen";
import type {
  PostcardInCollection,
  UserPublicProfile,
} from "@/src/api/types.gen";
import { notifications } from "@mantine/notifications";

interface PostcardWithAuthor extends PostcardInCollection {
  author?: UserPublicProfile;
}

export default function CollectionPage() {
  const router = useRouter();
  const [collectedPostcards, setCollectedPostcards] = useState<
    PostcardWithAuthor[]
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
        // Load author information for each postcard
        const postcardsWithAuthors = await Promise.allSettled(
          response.data.map(async (postcard) => {
            try {
              const authorResponse = await getUserProfileApiUsersUserIdGet({
                path: { user_id: postcard.author_id },
              });
              return {
                ...postcard,
                author: authorResponse.data || undefined,
              } as PostcardWithAuthor;
            } catch (error) {
              console.error(
                `Error loading author for postcard ${postcard.postcard_id}:`,
                error,
              );
              return {
                ...postcard,
                author: undefined,
              } as PostcardWithAuthor;
            }
          }),
        );

        const results = postcardsWithAuthors
          .filter((result) => result.status === "fulfilled")
          .map(
            (result) =>
              (result as PromiseFulfilledResult<PostcardWithAuthor>).value,
          );

        setCollectedPostcards(results);
      }
    } catch (error) {
      console.error("Error loading collection:", error);
      notifications.show({
        title: "エラー",
        message: "キャッチした絵葉書の読み込みに失敗しました",
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
            キャッチした絵葉書を表示するにはログインが必要です。
          </Text>
          <Button onClick={() => router.push("/auth")} size="lg">
            ログインページへ
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <div style={{ width: "100%", padding: "0 1rem" }}>
      <Stack gap="lg">
        {/* Header */}
        <Group gap="lg" wrap="nowrap" px="md">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            戻る
          </Button>
          <div>
            <Title order={1} size="h2">
              📚 コレクション
            </Title>
            <Text c="dimmed" size="sm">
              あなたがキャッチした絵葉書
            </Text>
          </div>
        </Group>

        {/* Collection Grid */}
        {collectedPostcards.length > 0 ? (
          <Grid gutter="lg" px="md">
            {collectedPostcards.map((postcard) => (
              <Grid.Col
                key={postcard.postcard_id}
                span={{ base: 12, xs: 6, sm: 4, md: 4, lg: 3, xl: 2.4 }}
              >
                <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
                  <Card.Section>
                    <Image
                      src={postcard.image_url}
                      height={180}
                      alt="絵葉書"
                      fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
                    />
                  </Card.Section>

                  <Stack
                    gap="xs"
                    mt="sm"
                    justify="space-between"
                    style={{ flexGrow: 1 }}
                  >
                    <Text fw={500} lineClamp={2} size="sm">
                      {postcard.text}
                    </Text>

                    <Stack gap="xs">
                      <Group gap="xs">
                        <Calendar size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">
                          {new Date(postcard.created_at).toLocaleDateString(
                            "ja-JP",
                          )}
                        </Text>
                      </Group>

                      <Group gap="xs">
                        <User size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">
                          {postcard.author?.username || "不明"}
                        </Text>
                      </Group>

                      <Badge color="green" variant="light" size="xs">
                        キャッチ済み
                      </Badge>
                    </Stack>
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
                  まだキャッチした絵葉書がありません
                </Title>
                <Text c="dimmed" mb="lg">
                  マップで絵葉書を見つけて、キャッチしましょう！
                </Text>
                <Button onClick={() => router.push("/")} size="lg">
                  マップに戻る
                </Button>
              </div>
            </Stack>
          </Center>
        )}
      </Stack>
    </div>
  );
}
