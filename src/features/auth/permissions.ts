import { PUBLIC_AUTH_ROUTES } from "@/constants/auth";

function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

export function isPublicAuthRoute(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);

  return PUBLIC_AUTH_ROUTES.some((route) =>
    normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );
}

export function normalizeProtectedPath(pathname: string): string {
  return normalizePath(pathname);
}
