import React from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Image,
  Badge,
  TextInput,
  Textarea,
  Button,
  Loader,
} from "@mantine/core";
import { MapPin, Calendar, User, Plus, Edit, Save, X } from "lucide-react";
import type { PostcardDetail, UserPublicProfile } from "@/src/api/types.gen";

interface PostcardDetailModalProps {
  opened: boolean;
  onClose: () => void;
  selectedPostcard: PostcardDetail | null;
  selectedAuthor: UserPublicProfile | null;
  isEditMode: boolean;
  isLoadingAuthor: boolean;
  isUpdating: boolean;
  isCollecting: boolean;
  editText: string;
  editImageUrl: string;
  setEditText: (v: string) => void;
  setEditImageUrl: (v: string) => void;
  handleEditPostcard: () => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => void;
  handleCollectPostcard: () => void;
  setSelectedAuthor: (v: UserPublicProfile | null) => void;
  setIsEditMode: (v: boolean) => void;
  closeDetail: () => void;
}

const PostcardDetailModal: React.FC<PostcardDetailModalProps> = ({
  opened,
  onClose,
  selectedPostcard,
  selectedAuthor,
  isEditMode,
  isLoadingAuthor,
  isUpdating,
  isCollecting,
  editText,
  editImageUrl,
  setEditText,
  setEditImageUrl,
  handleEditPostcard,
  handleCancelEdit,
  handleSaveEdit,
  handleCollectPostcard,
  setSelectedAuthor,
  setIsEditMode,
  closeDetail,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        setSelectedAuthor(null);
        setIsEditMode(false);
      }}
      title={isEditMode ? "絵葉書の編集" : "絵葉書の詳細"}
      size="md"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {selectedPostcard && (
        <Stack gap="md">
          {/* Postcard Image */}
          {isEditMode ? (
            <TextInput
              label="画像URL"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.currentTarget.value)}
              placeholder="https://example.com/image.jpg"
            />
          ) : (
            <Image
              src={selectedPostcard.image_url}
              alt="絵葉書"
              radius={4}
              style={{
                width: "100%",
                height: "350px",
                objectFit: "cover",
                borderRadius: 8,
              }}
              fallbackSrc="https://via.placeholder.com/350x250?text=No+Image"
            />
          )}

          {/* Postcard Text */}
          {isEditMode ? (
            <Textarea
              label="テキスト"
              value={editText}
              onChange={(e) => setEditText(e.currentTarget.value)}
              placeholder="絵葉書のメッセージを入力..."
              rows={3}
            />
          ) : (
            <Text size="lg" fw={500}>
              {selectedPostcard.text}
            </Text>
          )}

          {/* Location Info */}
          <Group gap="xs">
            <MapPin size={16} color="#868e96" />
            <Text size="sm" c="dimmed">
              {typeof selectedPostcard.current_position?.lat === "string"
                ? parseFloat(selectedPostcard.current_position.lat).toFixed(4)
                : selectedPostcard.current_position?.lat?.toFixed(4)}
              ,{" "}
              {typeof selectedPostcard.current_position?.lon === "string"
                ? parseFloat(selectedPostcard.current_position.lon).toFixed(4)
                : selectedPostcard.current_position?.lon?.toFixed(4)}
            </Text>
          </Group>

          {/* Created Date */}
          <Group gap="xs">
            <Calendar size={16} color="#868e96" />
            <Text size="sm" c="dimmed">
              {new Date(selectedPostcard.created_at).toLocaleDateString(
                "ja-JP",
              )}
            </Text>
          </Group>

          {/* Author Info */}
          <Group gap="xs">
            <User size={16} color="#868e96" />
            {isLoadingAuthor ? (
              <Text size="sm" c="dimmed">
                作者情報を読み込み中...
              </Text>
            ) : selectedAuthor ? (
              <Text size="sm" c="dimmed">
                作者: {selectedAuthor.username}
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                作者: 不明
              </Text>
            )}
          </Group>

          {/* Owner Badge */}
          <Badge
            color={selectedPostcard.is_own ? "green" : "blue"}
            variant="light"
            leftSection={<User size={12} />}
          >
            {selectedPostcard.is_own ? "あなたの投稿" : "他のユーザーの投稿"}
          </Badge>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              color="gray"
              onClick={() => {
                onClose();
                setSelectedAuthor(null);
                setIsEditMode(false);
              }}
            >
              {isEditMode ? "キャンセル" : "閉じる"}
            </Button>

            {selectedPostcard.is_own ? (
              // Own postcard - show edit buttons
              isEditMode ? (
                <>
                  <Button
                    variant="light"
                    onClick={handleCancelEdit}
                    leftSection={<X size={16} />}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    loading={isUpdating}
                    disabled={isUpdating}
                    leftSection={!isUpdating ? <Save size={16} /> : null}
                  >
                    保存
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditPostcard}
                  leftSection={<Edit size={16} />}
                  variant="light"
                >
                  編集
                </Button>
              )
            ) : (
              // Other's postcard - show collect button
              <Button
                onClick={handleCollectPostcard}
                loading={isCollecting}
                disabled={isCollecting}
                leftSection={!isCollecting ? <Plus size={16} /> : null}
              >
                キャッチする
              </Button>
            )}
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

export default PostcardDetailModal;
