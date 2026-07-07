import type { UserRole } from "@prisma/client";

import { PUBLIC_AUTH_ROUTES, ROLE_ROUTE_ACCESS } from "@/constants/auth";

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

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);

  const matchedRule = ROLE_ROUTE_ACCESS.find((rule) =>
    normalizedPath === rule.prefix || normalizedPath.startsWith(`${rule.prefix}/`)
  );

  if (!matchedRule) {
    return true;
  }

  return matchedRule.allowedRoles.includes(role);
}
