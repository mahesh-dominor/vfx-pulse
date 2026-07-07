import bcrypt from "bcryptjs";

import type { Prisma, UserPermission, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CreateUserSchema } from "@/features/users/schemas/create-user.schema";
import type { UpdateUserSchema } from "@/features/users/schemas/update-user.schema";
import type { UsersQuerySchema } from "@/features/users/schemas/users-query.schema";
import type { UserListItem, TeamListItem } from "@/types/users";

function mapUserToListItem(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
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
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
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
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
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
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
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

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          role: input.role,
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
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
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
  },

  async updateUser(id: string, input: UpdateUserSchema): Promise<UserListItem> {
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          role: input.role,
          isActive: input.isActive,
        },
      });

      await tx.userTeam.updateMany({
        where: { userId: id, deletedAt: null },
        data: { deletedAt: new Date() },
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

      await tx.userPermission.updateMany({
        where: { userId: id, deletedAt: null },
        data: { deletedAt: new Date() },
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
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
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
  },

  async softDeleteUser(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await prisma.userTeam.updateMany({
      where: { userId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await prisma.userPermission.updateMany({
      where: { userId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
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
