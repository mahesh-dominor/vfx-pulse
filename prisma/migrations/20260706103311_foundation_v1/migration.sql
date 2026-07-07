/*
  Warnings:

  - You are about to drop the `DailyUpdate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequenceId` to the `Shot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Shot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShotStatus" AS ENUM ('NOT_STARTED', 'WIP', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'APPROVED', 'DELIVERED', 'HOLD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'PRODUCER';
ALTER TYPE "UserRole" ADD VALUE 'COORDINATOR';
ALTER TYPE "UserRole" ADD VALUE 'CLIENT';

-- DropForeignKey
ALTER TABLE "DailyUpdate" DROP CONSTRAINT "DailyUpdate_shotId_fkey";

-- DropForeignKey
ALTER TABLE "DailyUpdate" DROP CONSTRAINT "DailyUpdate_userId_fkey";

-- DropForeignKey
ALTER TABLE "Shot" DROP CONSTRAINT "Shot_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "producerId" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Shot" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "sequenceId" TEXT NOT NULL,
ADD COLUMN     "status" "ShotStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'ARTIST';

-- DropTable
DROP TABLE "DailyUpdate";

-- DropEnum
DROP TYPE "UpdateStatus";

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
