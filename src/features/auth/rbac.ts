import type { UserRole } from "@prisma/client";

import type { UserPermissionModule } from "@/constants/users";
import { prisma } from "@/lib/prisma";
import { getDefaultPermissionMatrix, getModuleForPath, mergePermissionMatrix } from "@/features/auth/rbac-config";
import type { UserPermissionItem } from "@/types/users";

type PermissionAction = "view" | "create" | "update" | "delete";

export async function getResolvedPermissions(userId: string, role: UserRole) {
  const permissionRows = await prisma.userPermission.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      module: true,
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
  });

  const normalizedRows: UserPermissionItem[] = permissionRows.map((permission) => ({
    module: permission.module as UserPermissionModule,
    canView: permission.canView,
    canCreate: permission.canCreate,
    canUpdate: permission.canUpdate,
    canDelete: permission.canDelete,
  }));

  return mergePermissionMatrix(role, normalizedRows);
}

export function getDefaultPermissions(role: UserRole) {
  return getDefaultPermissionMatrix(role);
}

export async function canAccessModuleAction(
  userId: string,
  role: UserRole,
  module: UserPermissionModule,
  action: PermissionAction
) {
  const permissions = await getResolvedPermissions(userId, role);
  const permission = permissions.find((item) => item.module === module);

  if (!permission) {
    return false;
  }

  switch (action) {
    case "view":
      return permission.canView;
    case "create":
      return permission.canCreate;
    case "update":
      return permission.canUpdate;
    case "delete":
      return permission.canDelete;
  }
}

export async function canAccessMultipleModuleActions(
  userId: string,
  role: UserRole,
  checks: Array<{ module: UserPermissionModule; action: PermissionAction }>
) {
  // Fetch permissions once and reuse for all checks to avoid connection pool exhaustion
  const permissions = await getResolvedPermissions(userId, role);

  return checks.map(({ module, action }) => {
    const permission = permissions.find((item) => item.module === module);

    if (!permission) {
      return false;
    }

    switch (action) {
      case "view":
        return permission.canView;
      case "create":
        return permission.canCreate;
      case "update":
        return permission.canUpdate;
      case "delete":
        return permission.canDelete;
    }
  });
}

export async function canAccessPath(userId: string, role: UserRole, pathname: string) {
  const permissionModule = getModuleForPath(pathname);

  if (!permissionModule) {
    return true;
  }

  return canAccessModuleAction(userId, role, permissionModule, "view");
}