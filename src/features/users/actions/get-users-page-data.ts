"use server";

import { auth } from "@/auth";
import { usersQuerySchema } from "@/features/users/schemas/users-query.schema";
import { canViewUsers } from "@/features/users/permissions";
import { userService } from "@/services/user.service";
import type { UsersPageData } from "@/types/users";

export async function getUsersPageData(
  input?: Partial<{ search: string; role: string; includeInactive: boolean }>
): Promise<UsersPageData> {
  const session = await auth();

  if (!session?.user?.role || !canViewUsers(session.user.role)) {
    throw new Error("Forbidden");
  }

  const parsed = usersQuerySchema.safeParse(input ?? {});

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user query");
  }

  const [users, teams] = await Promise.all([
    userService.listUsers(parsed.data),
    userService.listTeams(),
  ]);

  return {
    users,
    teams,
  };
}
