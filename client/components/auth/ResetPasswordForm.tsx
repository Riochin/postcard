"use client";

import React, { useState } from "react";
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
import {
  codeValidator,
  passwordValidator,
  confirmNewPasswordValidator,
} from "../../lib/auth/validators";
import { AUTH_ERROR_MESSAGES } from "../../lib/auth/errorMessages";

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const { confirmPasswordReset, isLoading, error, isSubmitting } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );

  const form = useForm({
    initialValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      code: codeValidator,
      newPassword: passwordValidator,
      confirmPassword: confirmNewPasswordValidator,
    },
  });

  const handleSubmit = async (values: {
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setSuccessMessage(undefined);
      await confirmPasswordReset(email, values.code, values.newPassword);
      setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS);
      form.reset();
    } catch (err) {
      console.error("パスワードリセット確認エラー:", err);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="md">
        新しいパスワードの設定
      </Title>

      <Text size="sm" c="dimmed" ta="center" mb="xl">
        {email} に送信された確認コードと新しいパスワードを入力してください。
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
            label="確認コード"
            placeholder="123456"
            required
            {...form.getInputProps("code")}
          />

          <PasswordInput
            label="新しいパスワード"
            placeholder="新しいパスワード"
            required
            {...form.getInputProps("newPassword")}
          />

          <PasswordInput
            label="パスワード確認"
            placeholder="パスワード確認"
            required
            {...form.getInputProps("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? "設定中..." : "パスワードを設定"}
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
