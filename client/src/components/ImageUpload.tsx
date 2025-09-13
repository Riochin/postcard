import React, { useState, useRef } from "react";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import {
  Group,
  Text,
  Button,
  Stack,
  Image,
  ActionIcon,
  Card,
  SimpleGrid,
  rem,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE, FileWithPath } from "@mantine/dropzone";
import { IconUpload, IconX, IconPhoto, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface ImageUploadProps {
  onImageUploaded?: (key: string, url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ key: string; url: string }>
  >([]);
  const openRef = useRef<() => void>(null);

  const handleFileUpload = async (files: FileWithPath[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileKey = `images/${Date.now()}-${file.name}`;

      // Upload file to S3
      const result = await uploadData({
        path: fileKey,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      // Get the URL for the uploaded file
      const urlResult = await getUrl({
        path: fileKey,
      });

      const newImage = {
        key: fileKey,
        url: urlResult.url.toString(),
      };

      setUploadedImages((prev) => [...prev, newImage]);
      onImageUploaded?.(fileKey, urlResult.url.toString());

      notifications.show({
        title: "Success",
        message: "Image uploaded successfully!",
        color: "green",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      notifications.show({
        title: "Error",
        message: "Failed to upload image. Please try again.",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await remove({ path: key });
      setUploadedImages((prev) => prev.filter((img) => img.key !== key));

      notifications.show({
        title: "Success",
        message: "Image deleted successfully!",
        color: "blue",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete image. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="md">
      <Dropzone
        openRef={openRef}
        onDrop={handleFileUpload}
        onReject={() => {
          notifications.show({
            title: "Invalid file",
            message: "Please select a valid image file.",
            color: "red",
          });
        }}
        maxSize={5 * 1024 ** 2} // 5MB
        accept={IMAGE_MIME_TYPE}
        loading={uploading}
      >
        <Group
          justify="center"
          gap="md"
          mih={120}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              style={{
                width: rem(32),
                height: rem(32),
                color: "var(--mantine-color-blue-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{
                width: rem(32),
                height: rem(32),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              style={{
                width: rem(32),
                height: rem(32),
                color: "var(--mantine-color-dimmed)",
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="sm" inline>
              画像をドラッグまたはクリック
            </Text>
            <Text size="xs" c="dimmed" inline mt={4}>
              最大5MB
            </Text>
          </div>
        </Group>
      </Dropzone>

      {uploadedImages.length > 0 && (
        <>
          <Text size="sm" fw={500}>
            アップロード済み画像
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {uploadedImages.map((image) => (
              <Card key={image.key} padding="xs" radius="md" withBorder>
                <Card.Section>
                  <Image
                    src={image.url}
                    height={120}
                    alt="Uploaded image"
                    fit="cover"
                  />
                </Card.Section>

                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed" truncate style={{ flex: 1 }}>
                    {image.key.split("/").pop()}
                  </Text>
                  <ActionIcon
                    color="red"
                    variant="light"
                    size="sm"
                    onClick={() => handleDelete(image.key)}
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
};
