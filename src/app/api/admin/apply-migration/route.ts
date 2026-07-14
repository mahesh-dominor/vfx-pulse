import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * Admin-only endpoint to apply pending database migrations
 * This is a temporary debugging endpoint for managing Vercel Postgres migrations
 */
export async function POST() {
  const session = await auth();

  // Only allow ADMIN role
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run Prisma migration deploy
    const result = execSync("npx prisma migrate deploy", {
      encoding: "utf-8",
      stdio: "pipe",
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Migrations applied successfully",
        output: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "error",
        message: "Migration failed",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
