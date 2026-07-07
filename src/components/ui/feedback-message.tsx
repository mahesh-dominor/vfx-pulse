import type { ReactNode } from "react";

type FeedbackVariant = "error" | "success" | "info" | "warning";

type FeedbackMessageProps = {
  variant: FeedbackVariant;
  message: ReactNode;
  className?: string;
};

const variantClass: Record<FeedbackVariant, string> = {
  error: "border-red-800 bg-red-900/20 text-red-300",
  success: "border-emerald-800 bg-emerald-900/20 text-emerald-300",
  info: "border-blue-800 bg-blue-900/20 text-blue-300",
  warning: "border-amber-700 bg-amber-900/20 text-amber-200",
};

export function FeedbackMessage({ variant, message, className }: FeedbackMessageProps) {
  return (
    <p
      className={`rounded border px-3 py-2 text-sm ${variantClass[variant]} ${className ?? ""}`.trim()}
      role={variant === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
