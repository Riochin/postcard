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
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/providers";
import { emailValidator } from "../../lib/auth/validators";
import { ConfirmCodeForm } from "./ConfirmCodeForm";
import { AUTH_ERROR_MESSAGES } from "../../lib/auth/errorMessages";

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading, error, isSubmitting } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState<string>("");

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
      setResetEmail(values.email);
      setShowResetPassword(true);
      form.reset();
    } catch (err) {
      console.error("パスワードリセット要求エラー:", err);
    }
  };

  const handleResetSuccess = () => {
    setShowResetPassword(false);
    setResetEmail("");
    // 成功メッセージと一緒にログインページに遷移
    router.push("/auth/login?message=password-reset-success");
  };

  const handleResendCode = async () => {
    try {
      await forgotPassword(resetEmail);
      setSuccessMessage(AUTH_ERROR_MESSAGES.SUCCESS.RESEND_CONFIRMATION_CODE);
    } catch (err) {
      console.error("再送信エラー:", err);
    }
  };

  // パスワードリセット画面を表示
  if (showResetPassword) {
    return (
      <ConfirmCodeForm
        email={resetEmail}
        onSuccess={handleResetSuccess}
        onResend={handleResendCode}
        mode="reset"
      />
    );
  }

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
