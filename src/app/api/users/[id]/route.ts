import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  canDeleteUsers,
  canUpdateUsers,
  canViewUsers,
} from "@/features/users/permissions";
import { updateUserSchema } from "@/features/users/schemas/update-user.schema";
import { userService } from "@/services/user.service";

function parsePermissionOverrides(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.role || !session.user.id || !(await canViewUsers(session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const users = await userService.listUsers({ includeInactive: true, search: undefined, role: undefined });
  const user = users.find((item) => item.id === id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.role || !session.user.id || !(await canUpdateUsers(session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const parsed = updateUserSchema.safeParse({
    name: body.name,
    email: body.email,
    username: body.username,
    role: body.role,
    designation: body.designation,
    department: body.department,
    isActive: body.isActive,
    teamIds: Array.isArray(body.teamIds) ? body.teamIds : [],
    permissionOverrides: parsePermissionOverrides(body.permissionOverrides),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const user = await userService.updateUser(id, parsed.data);
    return NextResponse.json(user);
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update user" },
      { status }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.role || !session.user.id || !(await canDeleteUsers(session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await userService.softDeleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete user" },
      { status }
    );
  }
}
