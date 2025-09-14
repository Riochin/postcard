import React, { useState, useRef } from "react";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Group, Text, Stack, Button, rem } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE, FileWithPath } from "@mantine/dropzone";
import { IconUpload, IconX, IconPhoto, IconRefresh } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface ImageUploadProps {
  onImageUploaded?: (key: string, url: string) => void;
  hasImage?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  hasImage = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const openRef = useRef<() => void>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Get a long-lived signed URL (7 days) for the uploaded file
      const urlResult = await getUrl({
        path: fileKey,
        options: {
          validateObjectExistence: false,
          expiresIn: 604800, // 7 days in seconds
        },
      });

      onImageUploaded?.(fileKey, urlResult.url.href);

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

  return (
    <Stack gap="md">
      {hasImage ? (
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          disabled={uploading}
        >
          {uploading ? "アップロード中..." : "画像を変更"}
        </Button>
      ) : (
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
      )}

      {/* Hidden file input for button click */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept={IMAGE_MIME_TYPE.join(",")}
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFileUpload(Array.from(files) as FileWithPath[]);
          }
        }}
      />
    </Stack>
  );
};
