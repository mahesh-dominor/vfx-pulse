"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import { DEFAULT_AFTER_LOGIN } from "@/constants/auth";
import { loginSchema } from "@/features/auth/schemas/login.schema";

export type LoginState = {
  success: boolean;
  error?: string;
};

export async function login(
  _: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: DEFAULT_AFTER_LOGIN,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Invalid email/username or password",
      };
    }

    throw error;
  }
}