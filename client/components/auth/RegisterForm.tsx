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
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/providers";
import {
  emailValidator,
  passwordValidator,
  confirmPasswordValidator,
} from "../../lib/auth/validators";
import { AUTH_ERROR_MESSAGES } from "../../lib/auth/errorMessages";
import { ConfirmCodeForm } from "./ConfirmCodeForm";

export function RegisterForm() {
  const {
    register,
    resendConfirmationCode,
    isLoading,
    error,
    isAuthenticated,
    isSubmitting,
  } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [showConfirmCode, setShowConfirmCode] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: emailValidator,
      password: passwordValidator,
      confirmPassword: confirmPasswordValidator,
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setSuccessMessage(undefined);
      await register(values.email, values.password);
      setRegisteredEmail(values.email);
      setShowConfirmCode(true);
      form.reset();
    } catch (err) {
      console.error("登録エラー:", err);
    }
  };

  const handleConfirmSuccess = () => {
    setShowConfirmCode(false);
    setRegisteredEmail("");
    // 成功メッセージと一緒にログインページに遷移
    router.push("/auth/login?message=register-success");
  };

  const handleResendCode = async () => {
    try {
      await resendConfirmationCode(registeredEmail);
      setSuccessMessage("確認コードを再送信しました。");
    } catch (err) {
      console.error("再送信エラー:", err);
    }
  };

  // 認証済みの場合は何も表示しない
  if (isAuthenticated) {
    return null;
  }

  // 確認コード入力画面を表示
  if (showConfirmCode) {
    return (
      <ConfirmCodeForm
        email={registeredEmail}
        onSuccess={handleConfirmSuccess}
        onResend={handleResendCode}
      />
    );
  }

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mb="md">
        新規登録
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

          <PasswordInput
            label="パスワード確認"
            placeholder="パスワードを再入力"
            required
            {...form.getInputProps("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? "登録中..." : "新規登録"}
          </Button>

          <Group justify="center" mt="md">
            <Text size="sm">
              既にアカウントをお持ちの方は{" "}
              <Anchor href="/auth/login" size="sm">
                ログイン
              </Anchor>
            </Text>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
