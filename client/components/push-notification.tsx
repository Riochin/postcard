"use client";

import { useEffect, useState } from "react";
import { Button, Text, Title, TextInput, Group, Alert } from "@mantine/core";
import { IconBell, IconBellOff, IconSend } from "@tabler/icons-react";
import { urlBase64ToUint8Array } from "@/utils/base64";
import {
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from "@/app/actions";

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    });
    setSubscription(sub);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeUser(serializedSub);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message);
      setMessage("");
    }
  }

  if (!isSupported) {
    return (
      <Alert color="red" variant="light">
        <Text>このブラウザではプッシュ通知がサポートされていません。</Text>
      </Alert>
    );
  }

  return (
    <div>
      <Title order={3} mb="md">
        プッシュ通知
      </Title>
      {subscription ? (
        <>
          <Text mb="md">プッシュ通知が有効になっています。</Text>
          <Button
            leftSection={<IconBellOff size={16} />}
            onClick={unsubscribeFromPush}
            variant="outline"
            mb="md"
          >
            通知を無効にする
          </Button>
          <Group mb="md">
            <TextInput
              placeholder="通知メッセージを入力"
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              flex={1}
            />
            <Button
              leftSection={<IconSend size={16} />}
              onClick={sendTestNotification}
            >
              テスト送信
            </Button>
          </Group>
        </>
      ) : (
        <>
          <Text mb="md">プッシュ通知が無効になっています。</Text>
          <Button
            leftSection={<IconBell size={16} />}
            onClick={subscribeToPush}
          >
            通知を有効にする
          </Button>
        </>
      )}
    </div>
  );
}
