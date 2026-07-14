import type { UserRole } from "@prisma/client";

import { USER_PERMISSION_MODULES, type UserPermissionModule } from "@/constants/users";
import type { UserPermissionItem } from "@/types/users";

type PermissionAccess = Pick<
  UserPermissionItem,
  "canView" | "canCreate" | "canUpdate" | "canDelete"
>;

function fullAccess(): PermissionAccess {
  return { canView: true, canCreate: true, canUpdate: true, canDelete: true };
}

function viewOnly(): PermissionAccess {
  return { canView: true, canCreate: false, canUpdate: false, canDelete: false };
}

function editAccess(): PermissionAccess {
  return { canView: true, canCreate: true, canUpdate: true, canDelete: false };
}

function noAccess(): PermissionAccess {
  return { canView: false, canCreate: false, canUpdate: false, canDelete: false };
}

function buildModuleRecord(defaultAccess: PermissionAccess) {
  return USER_PERMISSION_MODULES.reduce<Record<UserPermissionModule, PermissionAccess>>(
    (accumulator, module) => {
      accumulator[module] = { ...defaultAccess };
      return accumulator;
    },
    {} as Record<UserPermissionModule, PermissionAccess>
  );
}

export const ROLE_PERMISSION_DEFAULTS: Record<
  UserRole,
  Record<UserPermissionModule, PermissionAccess>
> = {
  ADMIN: buildModuleRecord(fullAccess()),
  PRODUCER: {
    ...buildModuleRecord(editAccess()),
    settings: fullAccess(),
    users: fullAccess(),
    reports: fullAccess(),
  },
  COORDINATOR: {
    ...buildModuleRecord(editAccess()),
    settings: viewOnly(),
    users: editAccess(),
  },
  SUPERVISOR: {
    ...buildModuleRecord(viewOnly()),
    projects: editAccess(),
    sequences: editAccess(),
    shots: editAccess(),
    tasks: editAccess(),
    reviews: editAccess(),
    reports: viewOnly(),
    "daily-updates": editAccess(),
    assets: editAccess(),
    artists: editAccess(),
    "time-logs": editAccess(),
  },
  LEAD: {
    ...buildModuleRecord(noAccess()),
    dashboard: viewOnly(),
    projects: viewOnly(),
    sequences: viewOnly(),
    shots: editAccess(),
    tasks: editAccess(),
    reviews: editAccess(),
    notifications: viewOnly(),
    "daily-updates": editAccess(),
    assets: editAccess(),
    "time-logs": editAccess(),
  },
  ARTIST: {
    ...buildModuleRecord(noAccess()),
    dashboard: viewOnly(),
    projects: viewOnly(),
    shots: viewOnly(),
    tasks: editAccess(),
    reviews: editAccess(),
    notifications: viewOnly(),
    "daily-updates": editAccess(),
    assets: editAccess(),
    "time-logs": editAccess(),
  },
  CLIENT: {
    ...buildModuleRecord(noAccess()),
    dashboard: viewOnly(),
    projects: viewOnly(),
    shots: viewOnly(),
    reviews: viewOnly(),
    notifications: viewOnly(),
  },
};

export const PATH_MODULE_MAP: Array<{ prefixes: string[]; module: UserPermissionModule }> = [
  { prefixes: ["/dashboard"], module: "dashboard" },
  { prefixes: ["/users"], module: "users" },
  { prefixes: ["/projects"], module: "projects" },
  { prefixes: ["/sequences"], module: "sequences" },
  { prefixes: ["/shots"], module: "shots" },
  { prefixes: ["/shot-tasks"], module: "tasks" },
  { prefixes: ["/reviews"], module: "reviews" },
  { prefixes: ["/reports"], module: "reports" },
  { prefixes: ["/settings"], module: "settings" },
  { prefixes: ["/assets"], module: "assets" },
  { prefixes: ["/notifications"], module: "notifications" },
  { prefixes: ["/daily-update"], module: "daily-updates" },
  { prefixes: ["/artists"], module: "artists" },
  { prefixes: ["/time-logs"], module: "time-logs" },
];

export function getDefaultPermissionMatrix(role: UserRole): UserPermissionItem[] {
  return USER_PERMISSION_MODULES.map((module) => ({
    module,
    ...ROLE_PERMISSION_DEFAULTS[role][module],
  }));
}

export function mergePermissionMatrix(
  role: UserRole,
  overrides: UserPermissionItem[] = []
): UserPermissionItem[] {
  const overrideMap = new Map(overrides.map((permission) => [permission.module, permission]));

  return USER_PERMISSION_MODULES.map((module) => ({
    module,
    ...(overrideMap.get(module) ?? ROLE_PERMISSION_DEFAULTS[role][module]),
  }));
}

export function getModuleForPath(pathname: string): UserPermissionModule | null {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const match = PATH_MODULE_MAP.find((entry) =>
    entry.prefixes.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    )
  );

  return match?.module ?? null;
}