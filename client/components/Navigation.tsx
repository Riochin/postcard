"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Settings, LogIn, User, Heart } from "lucide-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { AppShell, Title, Button, Group, Menu } from "@mantine/core";
import { getAccessToken } from "@/src/utils/auth";
import { checkUserExists, invalidateUserCache } from "@/src/utils/user";
import { isUserDataCached } from "@/src/utils/userCache";
import PostCreator from "./PostCreator";

Amplify.configure(outputs);

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated" | "needs-profile-setup"
  >("loading");
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const checkAuthStatus = async (forceRefresh: boolean = false) => {
    try {
      const token = await getAccessToken();

      if (token) {
        // Check if user profile exists
        try {
          const result = await checkUserExists(forceRefresh);

          if (result.exists) {
            setAuthStatus("authenticated");
          } else {
            setAuthStatus("needs-profile-setup");
            // Only redirect if not already on setup page or auth page
            if (pathname !== "/profile/setup" && pathname !== "/auth") {
              router.push("/profile/setup");
            }
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
          setAuthStatus("needs-profile-setup");
          if (pathname !== "/profile/setup" && pathname !== "/auth") {
            router.push("/profile/setup");
          }
        }
      } else {
        setAuthStatus("unauthenticated");
        // Only clear cache when transitioning from authenticated to unauthenticated
        // to avoid unnecessary cache clears that can cause CSS reloads
        if (authStatus === "authenticated") {
          invalidateUserCache();
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
      // Only clear cache on actual authentication errors, not network issues
      if (error instanceof Error && error.message.includes("401")) {
        invalidateUserCache();
      }
    }
  };

  // Initial auth check
  useEffect(() => {
    const performInitialCheck = async () => {
      await checkAuthStatus();
      setInitialCheckDone(true);
    };

    performInitialCheck();
  }, []);

  // Route change monitoring - only check if user data is not cached
  useEffect(() => {
    if (initialCheckDone) {
      (async () => {
        const token = await getAccessToken();
        if (token && !isUserDataCached()) {
          // Only check if we don't have cached data
          checkAuthStatus();
        }
      })();
    }
  }, [pathname, initialCheckDone]);

  // Optimized background auth monitoring
  useEffect(() => {
    if (!initialCheckDone) return;

    const handleWindowFocus = async () => {
      // Only force refresh on window focus if we haven't checked recently
      const token = await getAccessToken();
      if (token && !isUserDataCached()) {
        checkAuthStatus(true);
      }
    };

    // Check auth when window gains focus
    window.addEventListener("focus", handleWindowFocus);

    // Much less frequent periodic check - only as a fallback
    // and only if no cached data exists
    const interval = setInterval(async () => {
      const token = await getAccessToken();
      if (token && !isUserDataCached()) {
        checkAuthStatus();
      }
    }, 300000); // Check every 5 minutes instead of 10 seconds

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(interval);
    };
  }, [initialCheckDone]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group
            gap="sm"
            onClick={() => navigateTo("/")}
            style={{ cursor: "pointer" }}
          >
            <Image
              src="/icon-192x192.png"
              alt="Postcard"
              width={32}
              height={32}
              style={{ borderRadius: "4px" }}
            />
            <Title order={3}>Postcard</Title>
          </Group>

          <Group>
            {authStatus === "authenticated" ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" size="xs">
                    <User size={16} />
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    onClick={() => navigateTo("/profile")}
                    leftSection={<Settings size={16} />}
                  >
                    プロフィール
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => navigateTo("/collection")}
                    leftSection={<Heart size={16} />}
                  >
                    キャッチした絵葉書
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : authStatus === "needs-profile-setup" ? (
              <Button
                size="xs"
                color="orange"
                onClick={() => navigateTo("/profile/setup")}
                leftSection={<User size={14} />}
              >
                プロフィール設定
              </Button>
            ) : authStatus === "unauthenticated" ? (
              <Button
                size="xs"
                onClick={() => navigateTo("/auth")}
                leftSection={<LogIn size={14} />}
              >
                ログイン
              </Button>
            ) : null}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "calc(100vh - 64px)",
          padding: "60px 0 0 0",
        }}
      >
        {children}
        {authStatus === "authenticated" && <PostCreator />}
      </AppShell.Main>
    </AppShell>
  );
}
