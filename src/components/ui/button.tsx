import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium transition hover:bg-blue-700 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}