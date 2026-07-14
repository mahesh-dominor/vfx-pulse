"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canUpdateUsers } from "@/features/users/permissions";
import { updateUserSchema } from "@/features/users/schemas/update-user.schema";
import { userService } from "@/services/user.service";

export type UpdateUserState = {
  success: boolean;
  error?: string;
};

function parsePermissionOverrides(rawValue: FormDataEntryValue | null) {
  if (!rawValue || typeof rawValue !== "string") {
    return [];
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return [];
  }
}

function getAllTeamIds(formData: FormData): string[] {
  const values = formData.getAll("teamIds");

  return values
    .filter((item): item is string => typeof item === "string")
    .filter((item) => item.length > 0);
}

export async function updateUserAction(
  userId: string,
  _: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  const session = await auth();

  if (!session?.user?.role || !session.user.id || !(await canUpdateUsers(session.user.id, session.user.role))) {
    return {
      success: false,
      error: "You do not have permission to update users",
    };
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    role: formData.get("role"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    isActive: formData.get("isActive") === "on",
    teamIds: getAllTeamIds(formData),
    permissionOverrides: parsePermissionOverrides(formData.get("permissionOverrides")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await userService.updateUser(userId, parsed.data);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update user",
    };
  }

  revalidatePath("/users");

  return {
    success: true,
  };
}
