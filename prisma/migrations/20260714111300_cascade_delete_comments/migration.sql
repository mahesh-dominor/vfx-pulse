-- AlterTable: Modify Comment table to use CASCADE delete instead of SET NULL for parent relationships
-- This ensures when a project, sequence, shot, review, or asset is deleted, all related comments are cascade deleted

-- Drop existing foreign key constraints that use SET NULL
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_projectId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_sequenceId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_shotId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_reviewId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_assetId_fkey";

-- Add new foreign key constraints with CASCADE delete
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
