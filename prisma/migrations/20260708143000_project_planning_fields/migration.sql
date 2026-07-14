-- AlterTable
ALTER TABLE "Project"
ADD COLUMN "productionHouse" TEXT,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';