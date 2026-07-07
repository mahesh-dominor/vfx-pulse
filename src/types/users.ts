import type { UserRole } from "@prisma/client";

import type { UserPermissionModule } from "@/constants/users";

export type UserPermissionItem = {
  module: UserPermissionModule;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  teams: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
};

export type TeamListItem = {
  id: string;
  name: string;
  code: string;
};

export type UsersPageData = {
  users: UserListItem[];
  teams: TeamListItem[];
};
