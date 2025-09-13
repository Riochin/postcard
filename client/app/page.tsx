"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { Title, Text, Button, Stack, Loader, Center } from "@mantine/core";
import { getAccessToken, getIdToken } from "@/src/utils/auth";
import { client } from "@/src/api/client.gen";
import { getMyProfileApiUsersMeGet } from "@/src/api/sdk.gen";

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
  const [apiResult, setApiResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  const testApiCall = async () => {
    setIsLoading(true);
    setApiResult(null);

    try {
      // This will automatically include the auth token
      const response = await getMyProfileApiUsersMeGet();
      setApiResult({
        success: true,
        data: response.data,
      });
    } catch (error) {
      console.error("API call failed:", error);
      setApiResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
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
        <div>
          <Title order={2} mb="md">
            🎉 Welcome!
          </Title>
          <Stack gap="md">
            <Button
              size="lg"
              onClick={testApiCall}
              loading={isLoading}
              disabled={isLoading}
            >
              Test API Call (Get My Profile)
            </Button>

            {apiResult && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <Text fw={500} mb="xs">
                  API Response:
                </Text>
                <pre
                  style={{
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}
          </Stack>
        </div>
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
