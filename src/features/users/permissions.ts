import type { UserRole } from "@prisma/client";

import { canAccessModuleAction } from "@/features/auth/rbac";

export async function canViewUsers(userId: string, role: UserRole): Promise<boolean> {
  return canAccessModuleAction(userId, role, "users", "view");
}

export async function canCreateUsers(userId: string, role: UserRole): Promise<boolean> {
  return canAccessModuleAction(userId, role, "users", "create");
}

export async function canUpdateUsers(userId: string, role: UserRole): Promise<boolean> {
  return canAccessModuleAction(userId, role, "users", "update");
}

export async function canDeleteUsers(userId: string, role: UserRole): Promise<boolean> {
  return canAccessModuleAction(userId, role, "users", "delete");
}
