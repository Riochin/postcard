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

interface ConfirmCodeFormProps {
  email: string;
  onSuccess: () => void;
  onResend: () => void;
  mode?: "signup" | "reset";
}

export function ConfirmCodeForm({
  email,
  onSuccess,
  onResend,
  mode = "signup",
}: ConfirmCodeFormProps) {
  const {
    confirmSignUp,
    confirmPasswordReset,
    isLoading,
    error,
    isSubmitting,
  } = useAuth();
  const [resendMessage, setResendMessage] = useState<string | undefined>(
    undefined,
  );
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );

  const form = useForm({
    initialValues: {
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validate: {
      code: codeValidator,
      newPassword: mode === "reset" ? passwordValidator : undefined,
      confirmNewPassword:
        mode === "reset" ? confirmNewPasswordValidator : undefined,
    },
  });

  const handleSubmit = async (values: {
    code: string;
    newPassword?: string;
  }) => {
    try {
      setSuccessMessage(undefined);

      if (mode === "signup") {
        await confirmSignUp(email, values.code);
        setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.REGISTER_COMPLETED);
      } else {
        await confirmPasswordReset(email, values.code, values.newPassword!);
        setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS);
      }

      onSuccess();
    } catch (err) {
      console.error("確認コードエラー:", err);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="md">
        {mode === "signup" ? "確認コード入力" : "新しいパスワード設定"}
      </Title>

      <Text size="sm" c="dimmed" ta="center" mb="md">
        {mode === "signup"
          ? `${email} に送信された確認コードを入力してください`
          : `${email} に送信された確認コードを入力し、新しいパスワードを設定してください`}
      </Text>

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
            label="確認コード"
            placeholder="6桁の確認コードを入力"
            required
            maxLength={6}
            {...form.getInputProps("code")}
          />

          {mode === "reset" && (
            <>
              <PasswordInput
                label="新しいパスワード"
                placeholder="新しいパスワードを入力"
                required
                {...form.getInputProps("newPassword")}
              />

              <PasswordInput
                label="新しいパスワード確認"
                placeholder="新しいパスワードを再入力"
                required
                {...form.getInputProps("confirmNewPassword")}
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting
              ? mode === "signup"
                ? "確認中..."
                : "設定中..."
              : mode === "signup"
                ? "確認"
                : "パスワードを設定"}
          </Button>

          {resendMessage && (
            <Alert color="blue" title="情報">
              {resendMessage}
            </Alert>
          )}

          <Group justify="center" mt="md">
            <Text size="sm">
              確認コードが届かない場合は{" "}
              <Anchor
                onClick={() => {
                  onResend();
                  setResendMessage(
                    AUTH_ERROR_MESSAGES.SUCCESS.RESEND_CONFIRMATION_CODE,
                  );
                }}
                size="sm"
              >
                再送信
              </Anchor>
            </Text>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
