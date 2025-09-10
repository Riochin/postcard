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
        <Text>Push notifications are not supported in this browser.</Text>
      </Alert>
    );
  }

  return (
    <div>
      <Title order={3} mb="md">
        Push Notifications
      </Title>
      {subscription ? (
        <>
          <Text mb="md">You are subscribed to push notifications.</Text>
          <Button
            leftSection={<IconBellOff size={16} />}
            onClick={unsubscribeFromPush}
            variant="outline"
            mb="md"
          >
            Unsubscribe
          </Button>
          <Group mb="md">
            <TextInput
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              flex={1}
            />
            <Button
              leftSection={<IconSend size={16} />}
              onClick={sendTestNotification}
            >
              Send Test
            </Button>
          </Group>
        </>
      ) : (
        <>
          <Text mb="md">You are not subscribed to push notifications.</Text>
          <Button
            leftSection={<IconBell size={16} />}
            onClick={subscribeToPush}
          >
            Subscribe
          </Button>
        </>
      )}
    </div>
  );
}
