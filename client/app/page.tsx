import { Button, Flex } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <Flex direction="column" gap="md">
      Home page
      <Link href="/settings" passHref>
        <Button leftSection={<IconSettings size={16} />} variant="light">
          Settings
        </Button>
      </Link>
    </Flex>
  );
}
