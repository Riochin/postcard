"use client";

import { useEffect, useState } from "react";
import { Text, Title, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <div>
      <Title order={3} mb="xs">
        アプリをインストール
      </Title>
      {isIOS && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="iOS でのインストール"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            このアプリをインストールするには、共有ボタンをタップして
            &quot;ホーム画面に追加&quot;を選択してください。
          </Text>
        </Alert>
      )}
    </div>
  );
}
