import { Button, Flex } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <Flex direction="column" gap="md">
      ホームページ
      <Link href="/settings" passHref>
        <Button leftSection={<IconSettings size={16} />} variant="light">
          設定
        </Button>
      </Link>
    </Flex>
  );
}
