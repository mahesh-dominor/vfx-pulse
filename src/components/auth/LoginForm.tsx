"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type LoginState } from "@/features/auth/actions/login";
import { pendingLabel } from "@/components/ui/async-action-label";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {
  success: false,
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D17] px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#101827] p-8 shadow-2xl shadow-black/35">
        <h1 className="mb-1 text-center text-3xl font-semibold tracking-tight text-slate-100">
          VFX Pulse
        </h1>

        <p className="mb-8 text-center text-sm text-slate-400">
          Sign in to continue to production control
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

          <Input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="border-slate-700 bg-[#0B1321] text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
            required
          />

          {state.error ? (
            <FeedbackMessage variant="error" message={state.error} className="rounded-lg" />
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            className="bg-blue-600 py-3 hover:bg-blue-500"
          >
            {pendingLabel({ pending, pendingLabel: "Signing in...", idleLabel: "Sign In" })}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <span>Need help with access?</span>

          <Link
            href="/forgot-password"
            className="text-blue-400 transition hover:text-blue-300"
          >
            Forgot password
          </Link>
        </div>
      </div>
    </div>
  );
}