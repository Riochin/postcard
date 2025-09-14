"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { Title, Text, Button, Stack, Loader, Center } from "@mantine/core";
import { getAccessToken, getIdToken } from "@/src/utils/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import { client } from "@/src/api/client.gen";
import PostcardMap from "@/components/PostcardMap";

client.setConfig({
  auth: async () => {
    const token = await getIdToken();
    return token || undefined;
  },
});

Amplify.configure(outputs);

export default function HomePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  // 地図関連の状態
  const [mapStatus, setMapStatus] = useState<"error" | "success" | undefined>(
    undefined,
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const region = "us-east-1";
  const mapName = "PostCardMap";
  const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${API_KEY}`;

  useEffect(() => {
    checkAuthStatus();
    initializeMap();
    getCurrentLocation();
  }, []);

  // 位置情報を取得する関数
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
          // デフォルト位置（東京）を設定
          setUserLocation({ lat: 35.6762, lng: 139.6503 });
        },
      );
    } else {
      // デフォルト位置（東京）を設定
      setUserLocation({ lat: 35.6762, lng: 139.6503 });
    }
  };

  // 地図の初期化
  const initializeMap = async () => {
    try {
      const session = await fetchAuthSession();
      console.log("Amplify認証セッション:", session);

      if (session.credentials && API_KEY) {
        setMapStatus("success");
      } else {
        console.error("認証情報またはAPIキーが不足しています");
        setMapStatus("error");
      }
    } catch (error) {
      console.error("地図の初期化に失敗しました:", error);
      setMapStatus("error");
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Configure the client with auth when user is authenticated
        client.setConfig({
          auth: async () => {
            const currentToken = await getIdToken();
            return currentToken || undefined;
          },
        });

        // Check if user profile exists
        await checkUserProfileAndRedirect();
      } else {
        setAuthStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
    }
  };

  const checkUserProfileAndRedirect = async () => {
    try {
      const { checkUserExists } = await import("@/src/utils/user");
      const result = await checkUserExists();

      if (result.exists) {
        setAuthStatus("authenticated");
      } else {
        // User profile doesn't exist, redirect to setup
        router.push("/profile/setup");
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      // If there's an error checking the profile, redirect to setup
      router.push("/profile/setup");
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (authStatus === "loading") {
    return (
      <Center h="60vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>認証状態を確認中...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      {authStatus === "authenticated" ? (
        <>
          {mapStatus === undefined && (
            <div
              style={{
                width: "100vw",
                height: "calc(100vh - 60px)",
                marginTop: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🗺️</div>
                <div style={{ fontSize: "1.2rem" }}>地図を読み込み中...</div>
              </div>
            </div>
          )}

          {mapStatus === "error" && (
            <div
              style={{
                width: "100vw",
                height: "calc(100vh - 60px)",
                marginTop: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffebee",
              }}
            >
              <div style={{ textAlign: "center", color: "#d32f2f" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
                <div style={{ fontSize: "1.2rem" }}>
                  AWS Location Serviceの認証に失敗しました
                </div>
              </div>
            </div>
          )}

          {mapStatus === "success" && !userLocation && (
            <div
              style={{
                width: "100vw",
                height: "calc(100vh - 60px)",
                marginTop: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📍</div>
                <div style={{ fontSize: "1.2rem" }}>位置情報を取得中...</div>
              </div>
            </div>
          )}

          {mapStatus === "success" && userLocation && (
            <div style={{ marginTop: "0px" }}>
              <PostcardMap userLocation={userLocation} styleUrl={styleUrl} />
            </div>
          )}
        </>
      ) : (
        <Stack gap="xl" align="center" mt="xl">
          <div style={{ textAlign: "center" }}>
            <Title order={2} mb="md">
              🔐 Authentication Required
            </Title>
            <Text mb="md" size="lg">
              Please log in to use the POSTCARD app.
            </Text>
            <Button size="lg" onClick={() => navigateTo("/auth")}>
              Go to Login
            </Button>
          </div>

          <div style={{ maxWidth: "600px" }}>
            <Title order={3} mb="md">
              📱 About POSTCARD
            </Title>
            <Stack gap="md">
              <div>
                <Text fw={500} mb="xs">
                  🎴 Create & Share Postcards
                </Text>
                <Text size="sm" c="dimmed">
                  Create postcards at specific locations and share them with
                  other users.
                </Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  📍 Location-Based Features
                </Text>
                <Text size="sm" c="dimmed">
                  Use GPS to discover and collect postcards around your current
                  location.
                </Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  👤 User Profile
                </Text>
                <Text size="sm" c="dimmed">
                  Set up your profile and manage your collected postcards.
                </Text>
              </div>
            </Stack>
          </div>
        </Stack>
      )}
    </>
  );
}
