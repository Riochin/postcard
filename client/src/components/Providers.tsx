"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Navigation from "@/components/Navigation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MantineProvider>
      <Notifications />
      <Navigation>{children}</Navigation>
    </MantineProvider>
  );
}
