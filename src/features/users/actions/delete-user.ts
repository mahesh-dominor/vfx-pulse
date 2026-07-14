"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteUsers } from "@/features/users/permissions";
import { userService } from "@/services/user.service";

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.role || !session.user.id || !(await canDeleteUsers(session.user.id, session.user.role))) {
    return {
      success: false,
      error: "You do not have permission to delete users",
    };
  }

  try {
    await userService.softDeleteUser(userId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete user",
    };
  }

  revalidatePath("/users");

  return {
    success: true,
  };
}
