import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-8", className)}>
      {children}
    </div>
  );
}