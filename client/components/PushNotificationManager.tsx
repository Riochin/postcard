"use client";

import { useEffect } from "react";
import { Button, Text, Group, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBell, IconBellOff, IconAlertCircle } from "@tabler/icons-react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { client } from "@/src/api/client.gen";
import { getIdToken } from "@/src/utils/auth";

interface PushNotificationManagerProps {
  isAuthenticated?: boolean;
}

export function PushNotificationManager({
  isAuthenticated = false,
}: PushNotificationManagerProps) {
  const {
    isSupported,
    subscription,
    isLoading,
    error,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  } = usePushNotification();

  const sendSubscriptionToServer = async (
    pushSubscription: PushSubscription,
  ) => {
    try {
      // Convert PushSubscription to the format expected by the server
      const subscriptionData = {
        fcm_token: JSON.stringify({
          endpoint: pushSubscription.endpoint,
          keys: {
            auth: pushSubscription.getKey("auth")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(pushSubscription.getKey("auth")!),
                  ),
                )
              : null,
            p256dh: pushSubscription.getKey("p256dh")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(pushSubscription.getKey("p256dh")!),
                  ),
                )
              : null,
          },
        }),
      };

      // Get auth token
      const authToken = await getIdToken();

      // Use fetch API directly since the endpoint is not in the generated SDK yet
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/users/me/push-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(subscriptionData),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      notifications.show({
        title: "成功",
        message: "プッシュ通知が有効になりました！",
        color: "green",
        icon: <IconBell size={16} />,
      });
    } catch (err) {
      console.error("Failed to send subscription to server:", err);
      notifications.show({
        title: "エラー",
        message: "プッシュ通知の設定に失敗しました",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      const pushSubscription = await subscribeToPushNotifications();
      await sendSubscriptionToServer(pushSubscription);
    } catch (err) {
      notifications.show({
        title: "エラー",
        message:
          err instanceof Error
            ? err.message
            : "プッシュ通知の有効化に失敗しました",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeFromPushNotifications();
      notifications.show({
        title: "無効化",
        message: "プッシュ通知が無効になりました",
        color: "blue",
        icon: <IconBellOff size={16} />,
      });
    } catch (err) {
      notifications.show({
        title: "エラー",
        message:
          err instanceof Error
            ? err.message
            : "プッシュ通知の無効化に失敗しました",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  // Auto-enable push notifications when user is authenticated and not already subscribed
  useEffect(() => {
    if (
      isAuthenticated &&
      isSupported &&
      !subscription &&
      !isLoading &&
      !error
    ) {
      // Auto-subscribe silently on first login
      handleSubscribe();
    }
  }, [isAuthenticated, isSupported, subscription, isLoading, error]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isSupported) {
    return (
      <Alert
        variant="light"
        color="yellow"
        icon={<IconAlertCircle size={16} />}
      >
        <Text size="sm">このブラウザはプッシュ通知をサポートしていません</Text>
      </Alert>
    );
  }

  return (
    <Group gap="md" align="center">
      <Text size="sm" c="dimmed">
        絵葉書が拾われた時の通知:
      </Text>

      {error && (
        <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {subscription ? (
        <Button
          variant="outline"
          color="red"
          size="sm"
          leftSection={<IconBellOff size={16} />}
          onClick={handleUnsubscribe}
          loading={isLoading}
        >
          通知を無効にする
        </Button>
      ) : (
        <Button
          variant="filled"
          color="blue"
          size="sm"
          leftSection={<IconBell size={16} />}
          onClick={handleSubscribe}
          loading={isLoading}
        >
          通知を有効にする
        </Button>
      )}
    </Group>
  );
}
