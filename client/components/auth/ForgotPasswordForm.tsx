"use client";

import React, { useState } from "react";
import {
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Group,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "../../lib/auth/providers";
import { emailValidator } from "../../lib/auth/validators";

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading, error, isSubmitting } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: emailValidator,
    },
  });

  const handleSubmit = async (values: { email: string }) => {
    try {
      setSuccessMessage(undefined);
      await forgotPassword(values.email);
      setSuccessMessage(
        "パスワードリセットメールを送信しました。メールをご確認ください。",
      );
      form.reset();
    } catch (err) {
      console.error("パスワードリセット要求エラー:", err);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="md">
        パスワードリセット
      </Title>

      <Text size="sm" c="dimmed" ta="center" mb="xl">
        登録されているメールアドレスを入力してください。
        パスワードリセット用のメールをお送りします。
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert color="green" variant="light">
              {successMessage}
            </Alert>
          )}

          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            {...form.getInputProps("email")}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? "送信中..." : "パスワードリセットメールを送信"}
          </Button>

          <Group justify="center">
            <Anchor href="/auth/login" size="sm">
              ログインページに戻る
            </Anchor>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
