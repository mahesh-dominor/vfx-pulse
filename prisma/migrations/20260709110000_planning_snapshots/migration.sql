CREATE TABLE "ProjectPlanSnapshot" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "finalDeliveryDate" TIMESTAMP(3) NOT NULL,
  "pipelineStartDate" TIMESTAMP(3) NOT NULL,
  "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
  "holidays" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectPlanSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectPlanMilestone" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "sequenceOrder" INTEGER NOT NULL,
  "stepCode" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "bufferDays" INTEGER NOT NULL,
  "parallelGroup" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectPlanMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectPlanSnapshot_projectId_idx" ON "ProjectPlanSnapshot"("projectId");
CREATE INDEX "ProjectPlanSnapshot_createdById_idx" ON "ProjectPlanSnapshot"("createdById");
CREATE INDEX "ProjectPlanSnapshot_createdAt_idx" ON "ProjectPlanSnapshot"("createdAt");

CREATE INDEX "ProjectPlanMilestone_snapshotId_idx" ON "ProjectPlanMilestone"("snapshotId");
CREATE INDEX "ProjectPlanMilestone_sequenceOrder_idx" ON "ProjectPlanMilestone"("sequenceOrder");
CREATE INDEX "ProjectPlanMilestone_stepCode_idx" ON "ProjectPlanMilestone"("stepCode");

ALTER TABLE "ProjectPlanSnapshot"
ADD CONSTRAINT "ProjectPlanSnapshot_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectPlanSnapshot"
ADD CONSTRAINT "ProjectPlanSnapshot_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectPlanMilestone"
ADD CONSTRAINT "ProjectPlanMilestone_snapshotId_fkey"
FOREIGN KEY ("snapshotId") REFERENCES "ProjectPlanSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
