"use server";

import { authService } from "@/services/auth.service";
import { resetPasswordSchema } from "@/features/auth/schemas/reset-password.schema";

export type ResetPasswordState = {
  success: boolean;
  error?: string;
};

export async function resetPassword(
  token: string,
  _: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const didReset = await authService.resetPasswordWithToken(
    token,
    parsed.data.password
  );

  if (!didReset) {
    return {
      success: false,
      error: "Reset link is invalid or expired",
    };
  }

  return {
    success: true,
  };
}
