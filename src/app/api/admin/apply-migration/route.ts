import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Admin-only endpoint to apply pending database migrations
 * This is a temporary debugging endpoint for managing Vercel Postgres migrations
 * Applies the Episode table and Sequence updates using raw SQL
 */
export async function POST() {
  const session = await auth();

  // Only allow ADMIN role
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if Episode table exists
    const episodeCount = await prisma.episode.count();
    return NextResponse.json(
      {
        status: "success",
        message: "Episode table already exists",
        recordCount: episodeCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // Table doesn't exist, apply migration via raw SQL
    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
      try {
        // Apply the Episode table migration using raw SQL
        const migrationSQL = `
          CREATE TABLE "Episode" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "code" TEXT NOT NULL,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "projectId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "deletedAt" TIMESTAMP(3),
            CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
          );

          CREATE UNIQUE INDEX "Episode_projectId_code_key" ON "Episode"("projectId", "code");
          CREATE INDEX "Episode_projectId_idx" ON "Episode"("projectId");

          ALTER TABLE "Sequence" ADD COLUMN "description" TEXT;
          ALTER TABLE "Sequence" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
          ALTER TABLE "Sequence" ADD COLUMN "episodeId" TEXT;

          ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL;

          CREATE UNIQUE INDEX "Sequence_projectId_code_key" ON "Sequence"("projectId", "code");
          CREATE INDEX "Sequence_episodeId_idx" ON "Sequence"("episodeId");
        `;

        await prisma.$executeRawUnsafe(migrationSQL);

        return NextResponse.json(
          {
            status: "success",
            message: "Migration applied successfully",
            migrationApplied: true,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } catch (sqlError) {
        const sqlErrorMessage =
          sqlError instanceof Error ? sqlError.message : String(sqlError);

        // Check if this is just a duplicate index/constraint error (safe to ignore)
        if (sqlErrorMessage.includes("already exists")) {
          return NextResponse.json(
            {
              status: "warning",
              message:
                "Migration components already exist (partial migration detected)",
              migrationApplied: true,
              details: sqlErrorMessage,
              timestamp: new Date().toISOString(),
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            status: "error",
            message: "Migration SQL execution failed",
            error: sqlErrorMessage,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // Some other error occurred
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check migration status",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
