"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Paper,
  TextInput,
  PasswordInput,
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
import { emailValidator, passwordValidator } from "../../lib/auth/validators";
import { AUTH_ERROR_MESSAGES } from "../../lib/auth/errorMessages";

export function LoginForm() {
  const { login, isLoading, error, isAuthenticated, isSubmitting } = useAuth();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-reset-success") {
      setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS);
    } else if (message === "register-success") {
      setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.REGISTER_COMPLETED);
    }
  }, [searchParams]);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: emailValidator,
      password: passwordValidator,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await login(values.email, values.password);
    } catch (err) {
      console.error("ログインエラー:", err);
    }
  };

  // 認証済みの場合は何も表示しない
  if (isAuthenticated) {
    return null;
  }

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="md">
        ログイン
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && (
            <Alert color="red" title="エラー">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert color="green" title="成功">
              {successMessage}
            </Alert>
          )}

          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            {...form.getInputProps("email")}
          />

          <PasswordInput
            label="パスワード"
            placeholder="パスワードを入力"
            required
            {...form.getInputProps("password")}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>

          <Group justify="center" mt="md">
            <Anchor href="/auth/forgot-password" size="sm">
              パスワードを忘れた方
            </Anchor>
          </Group>

          <Group justify="center" mt="md">
            <Text size="sm">
              アカウントをお持ちでない方は{" "}
              <Anchor href="/auth/register" size="sm">
                新規登録
              </Anchor>
            </Text>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
