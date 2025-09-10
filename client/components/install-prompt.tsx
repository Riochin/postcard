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
        Install App
      </Title>
      {isIOS && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="iOS Installation"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            To install this app on your iOS device, tap the share button and
            then &quot;Add to Home Screen&quot;.
          </Text>
        </Alert>
      )}
    </div>
  );
}
