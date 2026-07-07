"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  resetPassword,
  type ResetPasswordState,
} from "@/features/auth/actions/reset-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResetPasswordFormProps = {
  token: string;
};

const initialState: ResetPasswordState = {
  success: false,
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const resetPasswordAction = resetPassword.bind(null, token);
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D17] px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#101827] p-8 shadow-2xl shadow-black/35">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-slate-100">
          Set New Password
        </h1>

        <p className="mb-8 text-center text-sm text-slate-400">
          Choose a strong password for your account
        </p>

        <form action={formAction} className="space-y-4">
          <Input
            name="password"
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            className="border-slate-700 bg-[#0B1321] text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
            required
          />

          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            className="border-slate-700 bg-[#0B1321] text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
            required
          />

          {state.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          {state.success ? (
            <p className="text-sm text-emerald-400">
              Password updated successfully. You can now sign in.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            className="bg-blue-600 py-3 hover:bg-blue-500"
          >
            {pending ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          <Link href="/login" className="text-blue-400 transition hover:text-blue-300">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
