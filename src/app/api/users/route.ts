import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { canEditUsers, canViewUsers } from "@/features/users/permissions";
import { createUserSchema } from "@/features/users/schemas/create-user.schema";
import { usersQuerySchema } from "@/features/users/schemas/users-query.schema";
import { userService } from "@/services/user.service";

function parsePermissionOverrides(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.role || !canViewUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const parsed = usersQuerySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      includeInactive: searchParams.get("includeInactive") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const users = await userService.listUsers(parsed.data);

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.role || !canEditUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = createUserSchema.safeParse({
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
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
    const user = await userService.createUser(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create user" },
      { status: 500 }
    );
  }
}