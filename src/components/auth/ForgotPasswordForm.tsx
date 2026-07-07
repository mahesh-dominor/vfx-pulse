"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPassword,
  type ForgotPasswordState,
} from "@/features/auth/actions/forgot-password";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";

const initialState: ForgotPasswordState = {
  success: false,
  message: "",
};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D17] px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#101827] p-8 shadow-2xl shadow-black/35">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-slate-100">
          Reset Password
        </h1>

        <p className="mb-8 text-center text-sm text-slate-400">
          Enter your account email to generate a reset link
        </p>

        <form action={formAction} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="border-slate-700 bg-[#0B1321] text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
            required
          />

          {state.error ? (
            <FeedbackMessage variant="error" message={state.error} className="rounded-lg" />
          ) : null}

          {state.success ? (
            <FeedbackMessage variant="success" message={state.message} className="rounded-lg" />
          ) : null}

          {state.resetUrl ? (
            <FeedbackMessage
              variant="warning"
              className="rounded-lg"
              message={
                <>
                  Development reset link: <a href={state.resetUrl}>{state.resetUrl}</a>
                </>
              }
            />
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            className="bg-blue-600 py-3 hover:bg-blue-500"
          >
            {pending ? "Generating link..." : "Generate Reset Link"}
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
