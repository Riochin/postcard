import { PushNotificationManager } from "@/components/push-notification";
import { InstallPrompt } from "@/components/install-prompt";
import { Flex } from "@mantine/core";

export default function SettingsPage() {
  return (
    <Flex direction="column" gap="md">
      <PushNotificationManager />
      <InstallPrompt />
    </Flex>
  );
}
