"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker is not supported");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  };

  const subscribeToPushNotifications = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Push notifications are not supported");
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error("VAPID public key is not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to subscribe to push notifications";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!subscription) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to unsubscribe from push notifications";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  const checkExistingSubscription = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (err) {
      console.error("Failed to check existing subscription:", err);
    }
  }, [isSupported]);

  useEffect(() => {
    checkExistingSubscription();
  }, [checkExistingSubscription]);

  return {
    isSupported,
    subscription,
    isLoading,
    error,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  };
}
