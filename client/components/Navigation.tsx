"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Settings, Key, LogIn, User } from "lucide-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { AppShell, Title, Button, Group, Menu } from "@mantine/core";
import { getAccessToken } from "@/src/utils/auth";

Amplify.configure(outputs);

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      setAuthStatus(token ? "authenticated" : "unauthenticated");
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthStatus("unauthenticated");
    }
  };

  // Initial auth check and route change monitoring
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  // Background auth monitoring
  useEffect(() => {
    const handleWindowFocus = () => checkAuthStatus();

    // Check auth when window gains focus or on route changes
    window.addEventListener("focus", handleWindowFocus);

    // Periodic check as fallback
    const interval = setInterval(checkAuthStatus, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      clearInterval(interval);
    };
  }, []);

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
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                size="xs"
                onClick={() => navigateTo("/auth")}
                leftSection={<LogIn size={14} />}
              >
                ログイン
              </Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
