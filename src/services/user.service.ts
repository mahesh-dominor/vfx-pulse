import bcrypt from "bcryptjs";

import { Prisma } from "@prisma/client";
import type { UserPermission, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CreateUserSchema } from "@/features/users/schemas/create-user.schema";
import type { UpdateUserSchema } from "@/features/users/schemas/update-user.schema";
import type { UsersQuerySchema } from "@/features/users/schemas/users-query.schema";
import type { UserListItem, TeamListItem, UserPermissionItem } from "@/types/users";

class UserServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserServiceError";
    this.status = status;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function mapPrismaUserError(error: unknown): never {
  if (error instanceof UserServiceError) {
    throw error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

      if (target.includes("email")) {
        throw new UserServiceError("Email is already in use", 409);
      }

      if (target.includes("username")) {
        throw new UserServiceError("Username is already in use", 409);
      }

      throw new UserServiceError("A unique value is already in use", 409);
    }

    if (error.code === "P2025") {
      throw new UserServiceError("User not found", 404);
    }
  }

  throw error;
}

async function assertUniqueUserFields(
  tx: Prisma.TransactionClient,
  input: { email: string; username: string },
  excludeUserId?: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedUsername = normalizeUsername(input.username);

  const existing = await tx.user.findFirst({
    where: {
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
    select: {
      email: true,
      username: true,
      deletedAt: true,
    },
  });

  if (!existing) {
    return;
  }

  if (existing.email === normalizedEmail) {
    throw new UserServiceError(
      existing.deletedAt
        ? "Email belongs to a deleted user and cannot be reused yet"
        : "Email is already in use",
      409
    );
  }

  if (existing.username === normalizedUsername) {
    throw new UserServiceError(
      existing.deletedAt
        ? "Username belongs to a deleted user and cannot be reused yet"
        : "Username is already in use",
      409
    );
  }
}

function normalizePermissionRows(
  permissions: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>
): UserPermissionItem[] {
  return permissions.map((permission) => ({
    module: permission.module as UserPermissionItem["module"],
    canView: permission.canView,
    canCreate: permission.canCreate,
    canUpdate: permission.canUpdate,
    canDelete: permission.canDelete,
  }));
}

function mapUserToListItem(user: {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRole;
  designation: UserListItem["designation"];
  department: UserListItem["department"];
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  permissions: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
  teamMemberships: Array<{
    isPrimary: boolean;
    team: {
      id: string;
      name: string;
    };
  }>;
}): UserListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    designation: user.designation,
    department: user.department,
    isActive: user.isActive,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    permissions: normalizePermissionRows(user.permissions),
    teams: user.teamMemberships.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
      isPrimary: membership.isPrimary,
    })),
  };
}

export const userService = {
  async listUsers(query: UsersQuerySchema): Promise<UserListItem[]> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role } : {}),
    };

    try {
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          designation: true,
          department: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          permissions: {
            where: { deletedAt: null },
            select: {
              module: true,
              canView: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            },
            orderBy: { module: "asc" },
          },
          teamMemberships: {
            where: { deletedAt: null, team: { deletedAt: null } },
            select: {
              isPrimary: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });

      return users.map(mapUserToListItem);
    } catch {
      // Fallback keeps /users page available even when relation tables are out of sync.
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          designation: true,
          department: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          permissions: {
            where: { deletedAt: null },
            select: {
              module: true,
              canView: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            },
            orderBy: { module: "asc" },
          },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        designation: user.designation,
        department: user.department,
        isActive: user.isActive,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        permissions: normalizePermissionRows(user.permissions),
        teams: [],
      }));
    }
  },

  async listTeams(): Promise<TeamListItem[]> {
    try {
      return await prisma.team.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: "asc" },
      });
    } catch {
      return [];
    }
  },

  async createUser(input: CreateUserSchema): Promise<UserListItem> {
    const hashedPassword = await bcrypt.hash(input.password, 12);
    try {
      const user = await prisma.$transaction(async (tx) => {
        await assertUniqueUserFields(tx, {
          email: input.email,
          username: input.username,
        });

        const created = await tx.user.create({
          data: {
            name: input.name,
            email: normalizeEmail(input.email),
            username: normalizeUsername(input.username),
            password: hashedPassword,
            role: input.role,
            designation: input.designation,
            department: input.department,
            isActive: input.isActive,
          },
          select: {
            id: true,
          },
        });

        if (input.teamIds.length > 0) {
          await tx.userTeam.createMany({
            data: input.teamIds.map((teamId, index) => ({
              userId: created.id,
              teamId,
              isPrimary: index === 0,
            })),
          });
        }

        if (input.permissionOverrides.length > 0) {
          await tx.userPermission.createMany({
            data: input.permissionOverrides.map((permission) => ({
              userId: created.id,
              module: permission.module,
              canView: permission.canView,
              canCreate: permission.canCreate,
              canUpdate: permission.canUpdate,
              canDelete: permission.canDelete,
            })),
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: created.id },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            designation: true,
            department: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            permissions: {
              where: { deletedAt: null },
              select: {
                module: true,
                canView: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              },
              orderBy: { module: "asc" },
            },
            teamMemberships: {
              where: { deletedAt: null, team: { deletedAt: null } },
              select: {
                isPrimary: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      });

      return mapUserToListItem(user);
    } catch (error) {
      mapPrismaUserError(error);
    }
  },

  async updateUser(id: string, input: UpdateUserSchema): Promise<UserListItem> {
    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        await assertUniqueUserFields(
          tx,
          {
            email: input.email,
            username: input.username,
          },
          id
        );

        await tx.user.update({
          where: { id },
          data: {
            name: input.name,
            email: normalizeEmail(input.email),
            username: normalizeUsername(input.username),
            role: input.role,
            designation: input.designation,
            department: input.department,
            isActive: input.isActive,
          },
        });

        await tx.userTeam.deleteMany({
          where: { userId: id },
        });

        if (input.teamIds.length > 0) {
          await tx.userTeam.createMany({
            data: input.teamIds.map((teamId, index) => ({
              userId: id,
              teamId,
              isPrimary: index === 0,
            })),
          });
        }

        await tx.userPermission.deleteMany({
          where: { userId: id },
        });

        if (input.permissionOverrides.length > 0) {
          await tx.userPermission.createMany({
            data: input.permissionOverrides.map((permission) => ({
              userId: id,
              module: permission.module,
              canView: permission.canView,
              canCreate: permission.canCreate,
              canUpdate: permission.canUpdate,
              canDelete: permission.canDelete,
            })),
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            designation: true,
            department: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            permissions: {
              where: { deletedAt: null },
              select: {
                module: true,
                canView: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              },
              orderBy: { module: "asc" },
            },
            teamMemberships: {
              where: { deletedAt: null, team: { deletedAt: null } },
              select: {
                isPrimary: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      });

      return mapUserToListItem(updatedUser);
    } catch (error) {
      mapPrismaUserError(error);
    }
  },

  async softDeleteUser(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      await prisma.userTeam.deleteMany({
        where: { userId: id },
      });

      await prisma.userPermission.deleteMany({
        where: { userId: id },
      });
    } catch (error) {
      mapPrismaUserError(error);
    }
  },

  async listUserPermissions(userId: string): Promise<UserPermission[]> {
    return prisma.userPermission.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { module: "asc" },
    });
  },
};
