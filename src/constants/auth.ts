import type { UserRole } from "@prisma/client";

export const DEFAULT_AFTER_LOGIN = "/dashboard";
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

export const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
] as const;

export type RoleRouteAccessRule = {
  prefix: string;
  allowedRoles: readonly UserRole[];
};

export const ROLE_ROUTE_ACCESS: readonly RoleRouteAccessRule[] = [
  {
    prefix: "/dashboard",
    allowedRoles: [
      "ADMIN",
      "PRODUCER",
      "COORDINATOR",
      "SUPERVISOR",
      "LEAD",
      "ARTIST",
      "CLIENT",
    ],
  },
  {
    prefix: "/users",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR"],
  },
  {
    prefix: "/settings",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR"],
  },
  {
    prefix: "/projects",
    allowedRoles: [
      "ADMIN",
      "PRODUCER",
      "COORDINATOR",
      "SUPERVISOR",
      "LEAD",
      "CLIENT",
    ],
  },
  {
    prefix: "/reports",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD"],
  },
  {
    prefix: "/sequences",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD"],
  },
  {
    prefix: "/shots",
    allowedRoles: [
      "ADMIN",
      "PRODUCER",
      "COORDINATOR",
      "SUPERVISOR",
      "LEAD",
      "ARTIST",
      "CLIENT",
    ],
  },
  {
    prefix: "/reviews",
    allowedRoles: [
      "ADMIN",
      "PRODUCER",
      "COORDINATOR",
      "SUPERVISOR",
      "LEAD",
      "ARTIST",
      "CLIENT",
    ],
  },
  {
    prefix: "/assets",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD", "ARTIST"],
  },
  {
    prefix: "/notifications",
    allowedRoles: [
      "ADMIN",
      "PRODUCER",
      "COORDINATOR",
      "SUPERVISOR",
      "LEAD",
      "ARTIST",
      "CLIENT",
    ],
  },
  {
    prefix: "/daily-update",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD", "ARTIST"],
  },
  {
    prefix: "/artists",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD"],
  },
  {
    prefix: "/time-logs",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD", "ARTIST"],
  },
  {
    prefix: "/shot-tasks",
    allowedRoles: ["ADMIN", "PRODUCER", "COORDINATOR", "SUPERVISOR", "LEAD", "ARTIST"],
  },
] as const;
