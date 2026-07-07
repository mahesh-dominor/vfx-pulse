import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600",
        className
      )}
      {...props}
    />
  );
}