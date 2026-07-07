-- AlterTable
ALTER TABLE "Shot" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "DailyUpdate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shotId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyUpdate_userId_idx" ON "DailyUpdate"("userId");

-- CreateIndex
CREATE INDEX "DailyUpdate_projectId_idx" ON "DailyUpdate"("projectId");

-- CreateIndex
CREATE INDEX "DailyUpdate_shotId_idx" ON "DailyUpdate"("shotId");

-- CreateIndex
CREATE INDEX "DailyUpdate_createdAt_idx" ON "DailyUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
