#!/usr/bin/env tsx
/**
 * Manual migration script for Episode table
 * Run locally with: npx tsx scripts/apply-migration-manual.ts
 * This connects to the Vercel Postgres database and applies pending migrations
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking migration status...");

  try {
    // Try to count episodes - this will fail if table doesn't exist
    const count = await prisma.episode.count();
    console.log(`✅ Episode table exists with ${count} records`);
    return;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
      console.log(
        "❌ Episode table does not exist. Applying migration via raw SQL..."
      );

      // Apply the migration manually using raw SQL
      const migration = `
        -- Create Episode table
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

        -- Add indexes to Episode
        CREATE UNIQUE INDEX "Episode_projectId_code_key" ON "Episode"("projectId", "code");
        CREATE INDEX "Episode_projectId_idx" ON "Episode"("projectId");

        -- Alter Sequence table to add new columns and foreign key to Episode
        ALTER TABLE "Sequence" ADD COLUMN "description" TEXT;
        ALTER TABLE "Sequence" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "Sequence" ADD COLUMN "episodeId" TEXT;

        -- Add foreign key constraint for Episode
        ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL;

        -- Add indexes to Sequence  
        CREATE UNIQUE INDEX "Sequence_projectId_code_key" ON "Sequence"("projectId", "code");
        CREATE INDEX "Sequence_episodeId_idx" ON "Sequence"("episodeId");
      `;

      try {
        // Execute the raw SQL
        const result = await prisma.$executeRawUnsafe(migration);
        console.log("✅ Migration applied successfully");
        console.log(result);
      } catch (sqlError) {
        if (
          sqlError instanceof Error &&
          sqlError.message.includes("already exists")
        ) {
          console.log(
            "ℹ️  Indexes or constraints already exist. This is normal if migration was partially applied."
          );
        } else {
          throw sqlError;
        }
      }
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
