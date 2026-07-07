"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canEditUsers } from "@/features/users/permissions";
import { createUserSchema } from "@/features/users/schemas/create-user.schema";
import { userService } from "@/services/user.service";

export type CreateUserState = {
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

export async function createUserAction(
  _: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth();

  if (!session?.user?.role || !canEditUsers(session.user.role)) {
    return {
      success: false,
      error: "You do not have permission to create users",
    };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
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
    await userService.createUser(parsed.data);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create user",
    };
  }

  revalidatePath("/users");

  return {
    success: true,
  };
}
