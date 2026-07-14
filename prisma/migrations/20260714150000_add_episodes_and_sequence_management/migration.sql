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
ALTER TABLE "Sequence" ADD COLUMN "description" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "episodeId" TEXT;

-- Add foreign key constraint for Episode
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL;

-- Add indexes to Sequence
CREATE UNIQUE INDEX "Sequence_projectId_code_key" ON "Sequence"("projectId", "code");
CREATE INDEX "Sequence_episodeId_idx" ON "Sequence"("episodeId");
