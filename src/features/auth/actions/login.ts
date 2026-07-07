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
    email: formData.get("email"),
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
      email: parsed.data.email,
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
        error: "Invalid email or password",
      };
    }

    throw error;
  }
}