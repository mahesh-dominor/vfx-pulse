"use server";

import { authService } from "@/services/auth.service";
import { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password.schema";

export type ForgotPasswordState = {
  success: boolean;
  message: string;
  error?: string;
  resetUrl?: string;
};

const initialMessage =
  "If that email exists in our system, a password reset link has been generated.";

function resolveBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

export async function forgotPassword(
  _: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: initialMessage,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const resetToken = await authService.createPasswordResetToken(parsed.data.email);

  if (!resetToken) {
    return {
      success: true,
      message: initialMessage,
    };
  }

  const resetUrl = `${resolveBaseUrl()}/reset-password/${resetToken.token}`;

  return {
    success: true,
    message: initialMessage,
    resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
  };
}
