-- Extend Shot model with VFX production metadata

ALTER TABLE "Shot" ADD COLUMN "clientShotName" TEXT;
ALTER TABLE "Shot" ADD COLUMN "episode" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientDeliveryName" TEXT;
ALTER TABLE "Shot" ADD COLUMN "scopeOfWork" TEXT;
ALTER TABLE "Shot" ADD COLUMN "taskTemplate" TEXT;

-- Vendor and delivery tracking
ALTER TABLE "Shot" ADD COLUMN "vendorETA" TIMESTAMP(3);
ALTER TABLE "Shot" ADD COLUMN "deliverNextFor" TEXT;
ALTER TABLE "Shot" ADD COLUMN "assignedVendors" TEXT;

-- Production team comments
ALTER TABLE "Shot" ADD COLUMN "prodTeamComments" TEXT;
ALTER TABLE "Shot" ADD COLUMN "vendorProdComments" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientAdditionalNotes" TEXT;
ALTER TABLE "Shot" ADD COLUMN "latestClientNote" TEXT;

-- Status flags and tracking
ALTER TABLE "Shot" ADD COLUMN "flag" TEXT;
ALTER TABLE "Shot" ADD COLUMN "complexity" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientPriority" INTEGER;

-- CG and technical metadata
ALTER TABLE "Shot" ADD COLUMN "cgComplete" BOOLEAN DEFAULT false;
ALTER TABLE "Shot" ADD COLUMN "cgSupervisorComments" TEXT;
ALTER TABLE "Shot" ADD COLUMN "cameraInfo" TEXT;
ALTER TABLE "Shot" ADD COLUMN "character" TEXT;
ALTER TABLE "Shot" ADD COLUMN "compositor" TEXT;
ALTER TABLE "Shot" ADD COLUMN "cleanupVendor" TEXT;

-- VFX specifications
ALTER TABLE "Shot" ADD COLUMN "additionalFX" TEXT;
ALTER TABLE "Shot" ADD COLUMN "ascSAT" DECIMAL(10, 2);
ALTER TABLE "Shot" ADD COLUMN "ascSopOffset" DECIMAL(10, 2);
ALTER TABLE "Shot" ADD COLUMN "ascSopPower" DECIMAL(10, 2);
ALTER TABLE "Shot" ADD COLUMN "ascSopSlope" DECIMAL(10, 2);
ALTER TABLE "Shot" ADD COLUMN "allColor" BOOLEAN DEFAULT false;

-- Bidding and estimation
ALTER TABLE "Shot" ADD COLUMN "bidId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "bidNotes" TEXT;
ALTER TABLE "Shot" ADD COLUMN "bidProjId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "bidTotal" DECIMAL(10, 2);
ALTER TABLE "Shot" ADD COLUMN "biddingShotCount" INTEGER;

-- Delivery dates and milestones
ALTER TABLE "Shot" ADD COLUMN "deliveryDateFirstLooks" TIMESTAMP(3);
ALTER TABLE "Shot" ADD COLUMN "clientWIPDate" TIMESTAMP(3);
ALTER TABLE "Shot" ADD COLUMN "clientVersionsToFinal" INTEGER;
ALTER TABLE "Shot" ADD COLUMN "afterJune2" BOOLEAN DEFAULT false;
ALTER TABLE "Shot" ADD COLUMN "allowTotal" BOOLEAN DEFAULT false;

-- Client metadata
ALTER TABLE "Shot" ADD COLUMN "clientSGId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientSGStatus" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientProdNotes" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientReportNotes" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientAdditionalSOW" TEXT;
ALTER TABLE "Shot" ADD COLUMN "clientAdditionalSOWDate" TIMESTAMP(3);

-- Content Hub integration
ALTER TABLE "Shot" ADD COLUMN "contentHubScheduledDelivery" TIMESTAMP(3);
ALTER TABLE "Shot" ADD COLUMN "contentHubPipelineLink" TEXT;

-- Assets and assumptions
ALTER TABLE "Shot" ADD COLUMN "assumptions" TEXT;

-- Create index for common queries
CREATE INDEX "Shot_projectId_sequenceId_idx" ON "Shot"("projectId", "sequenceId");
CREATE INDEX "Shot_status_idx" ON "Shot"("status");
CREATE INDEX "Shot_dueDate_idx" ON "Shot"("dueDate");
CREATE INDEX "Shot_flag_idx" ON "Shot"("flag");
