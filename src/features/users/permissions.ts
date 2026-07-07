import type { UserRole } from "@prisma/client";

import {
  USER_DELETE_ROLES,
  USER_EDIT_ROLES,
  USER_MANAGEMENT_ROLES,
} from "@/constants/users";

const viewRoles = new Set<UserRole>(USER_MANAGEMENT_ROLES);
const editRoles = new Set<UserRole>(USER_EDIT_ROLES);
const deleteRoles = new Set<UserRole>(USER_DELETE_ROLES);

export function canViewUsers(role: UserRole): boolean {
  return viewRoles.has(role);
}

export function canEditUsers(role: UserRole): boolean {
  return editRoles.has(role);
}

export function canDeleteUsers(role: UserRole): boolean {
  return deleteRoles.has(role);
}
