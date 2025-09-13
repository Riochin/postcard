"use client";

import { useState, useRef } from "react";
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Stack,
  Group,
  ActionIcon,
  Text,
  Center,
  Image,
  Alert,
  Box,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Plus, Upload, X, AlertCircle } from "lucide-react";
import { createPostcardApiPostcardsPost } from "@/src/api/sdk.gen";
import type { PostcardCreateRequest } from "@/src/api/types.gen";

interface LocationData {
  lat: number;
  lon: number;
}

export default function PostCreator() {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("位置情報がサポートされていません"));
        return;
      }

      setLocationLoading(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false);
          const locationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          setLocationLoading(false);
          let errorMessage = "位置情報の取得に失敗しました";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "位置情報へのアクセスが拒否されました";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "位置情報が利用できません";
              break;
            case error.TIMEOUT:
              errorMessage = "位置情報の取得がタイムアウトしました";
              break;
          }

          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  };

  const handleSubmit = async () => {
    if (!selectedImage || !text.trim()) {
      notifications.show({
        title: "エラー",
        message: "画像とテキストの両方が必要です",
        color: "red",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get location if not already available
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      // Note: S3 upload is not implemented yet, so we'll use a placeholder URL
      // In the future, this should upload the image to S3 first
      const imageUrl = "https://example.com/placeholder-image.jpg"; // Placeholder

      const postData: PostcardCreateRequest = {
        image_url: imageUrl,
        text: text.trim(),
        lat: currentLocation.lat,
        lon: currentLocation.lon,
      };

      const response = await createPostcardApiPostcardsPost({
        body: postData,
        throwOnError: true,
      });

      notifications.show({
        title: "投稿完了",
        message: "ポストカードが正常に投稿されました",
        color: "green",
      });

      // Reset form and close modal
      handleClose();
    } catch (error: any) {
      console.error("投稿エラー:", error);

      let errorMessage = "投稿に失敗しました";
      if (error.status === 401) {
        errorMessage = "認証に失敗しました。再度ログインしてください";
      } else if (error.status === 400) {
        errorMessage = "投稿データに問題があります";
      } else if (error.message) {
        errorMessage = error.message;
      }

      notifications.show({
        title: "投稿エラー",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview("");
    setText("");
    setLocation(null);
    setLocationError("");
    close();
  };

  const isFormValid = selectedImage && text.trim().length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <ActionIcon
        size={56}
        radius="xl"
        variant="filled"
        color="blue"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        onClick={open}
      >
        <Plus size={24} />
      </ActionIcon>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title="新しいポストカードを投稿"
        size="md"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack gap="md">
          {/* Image Upload Section */}
          <Box>
            <Text size="sm" mb="xs" fw={500}>
              画像をアップロード
            </Text>

            {imagePreview ? (
              <Box pos="relative">
                <Image
                  src={imagePreview}
                  alt="プレビュー"
                  radius="md"
                  style={{ maxHeight: 200, objectFit: "contain" }}
                />
                <ActionIcon
                  size="sm"
                  variant="filled"
                  color="red"
                  pos="absolute"
                  top={8}
                  right={8}
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X size={14} />
                </ActionIcon>
              </Box>
            ) : (
              <Center
                style={{
                  border: "2px dashed #ced4da",
                  borderRadius: "8px",
                  minHeight: 120,
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Stack align="center" gap="xs">
                  <Upload size={32} color="#868e96" />
                  <Text size="sm" c="dimmed">
                    クリックして画像を選択
                  </Text>
                </Stack>
              </Center>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
          </Box>

          {/* Text Input */}
          <Box>
            <Text size="sm" mb="xs" fw={500}>
              メッセージ
            </Text>
            <Textarea
              placeholder="ポストカードに添えるメッセージを入力してください..."
              minRows={3}
              maxRows={6}
              value={text}
              onChange={(event) => setText(event.currentTarget.value)}
              autosize
            />
          </Box>

          {/* Location Status */}
          {locationError && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="位置情報エラー"
              color="orange"
            >
              {locationError}
              <Button
                size="xs"
                variant="light"
                color="orange"
                mt="xs"
                onClick={getCurrentLocation}
              >
                再試行
              </Button>
            </Alert>
          )}

          {locationLoading && (
            <Alert icon={<Loader size={16} />} color="blue">
              位置情報を取得中...
            </Alert>
          )}

          {location && !locationError && (
            <Alert color="green" variant="light">
              位置情報を取得しました
            </Alert>
          )}

          {/* Action Buttons */}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              color="gray"
              onClick={handleClose}
              disabled={isLoading}
            >
              キャンセル
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              leftSection={!isLoading ? <Upload size={16} /> : null}
            >
              投稿する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
