import type { UserRole } from "@prisma/client";

export const USER_ROLES = [
  "ADMIN",
  "PRODUCER",
  "COORDINATOR",
  "SUPERVISOR",
  "LEAD",
  "ARTIST",
  "CLIENT",
] as const satisfies readonly UserRole[];

export const USER_DESIGNATIONS = [
  "JUNIOR_ARTIST",
  "MID_ARTIST",
  "SENIOR_ARTIST",
  "LEAD",
  "SUPERVISOR",
] as const;

export const USER_DEPARTMENTS = [
  "PREP",
  "MATCHMOVE",
  "LAYOUT",
  "ANIMATION",
  "FX",
  "LIGHTING",
  "COMPOSITING",
  "ROTO",
  "PAINT",
  "QC",
  "PRODUCTION",
] as const;

export const USER_PERMISSION_MODULES = [
  "dashboard",
  "users",
  "projects",
  "sequences",
  "shots",
  "tasks",
  "daily-updates",
  "reviews",
  "assets",
  "reports",
  "notifications",
  "settings",
  "artists",
  "time-logs",
] as const;

export type UserPermissionModule = (typeof USER_PERMISSION_MODULES)[number];

export const USER_MANAGEMENT_ROLES = [
  "ADMIN",
  "PRODUCER",
  "COORDINATOR",
  "SUPERVISOR",
] as const satisfies readonly UserRole[];

export const USER_EDIT_ROLES = ["ADMIN", "PRODUCER", "COORDINATOR"] as const satisfies readonly UserRole[];

export const USER_DELETE_ROLES = ["ADMIN", "PRODUCER"] as const satisfies readonly UserRole[];
