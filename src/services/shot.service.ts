import { prisma } from "@/lib/prisma";
import type { ShotSchema } from "@/features/shots/schemas/shot.schema";
import type { ShotStatus } from "@prisma/client";

export const shotService = {
  async listShots(projectId?: string) {
    return prisma.shot.findMany({
      where: {
        deletedAt: null,
        project: {
          deletedAt: null,
        },
        sequence: {
          deletedAt: null,
          project: {
            deletedAt: null,
          },
        },
        OR: [{ artistId: null }, { artist: { deletedAt: null } }],
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: true,
        sequence: true,
        artist: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async getShotStats() {
    const where = {
      deletedAt: null as Date | null,
      project: { deletedAt: null as Date | null },
      sequence: {
        deletedAt: null as Date | null,
        project: { deletedAt: null as Date | null },
      },
    };

    const totalShots = await prisma.shot.count({ where });
    const completedShots = await prisma.shot.count({
      where: { ...where, status: "APPROVED" },
    });
    
    return {
      total: totalShots,
      completed: completedShots,
      inProgress: await prisma.shot.count({
        where: { ...where, status: "WIP" },
      }),
      inReview: await prisma.shot.count({
        where: { ...where, status: { in: ["INTERNAL_REVIEW", "CLIENT_REVIEW"] } },
      }),
    };
  },

  async getShotsByProject(projectId: string) {
    return prisma.shot.findMany({
      where: {
        projectId,
        deletedAt: null,
        project: { deletedAt: null },
        sequence: {
          deletedAt: null,
          project: { deletedAt: null },
        },
        OR: [{ artistId: null }, { artist: { deletedAt: null } }],
      },
      include: {
        project: true,
        sequence: true,
        artist: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getShotById(id: string) {
    return prisma.shot.findFirst({
      where: {
        id,
        deletedAt: null,
        project: { deletedAt: null },
        sequence: {
          deletedAt: null,
          project: { deletedAt: null },
        },
        OR: [{ artistId: null }, { artist: { deletedAt: null } }],
      },
      include: {
        sequence: {
          include: { project: true },
        },
        artist: true,
      },
    });
  },

  async updateShotStatus(id: string, status: ShotStatus) {
    return prisma.shot.update({
      where: { id },
      data: { status },
    });
  },

  async createShot(input: ShotSchema) {
    return prisma.shot.create({
      data: {
        projectId: input.projectId,
        sequenceId: input.sequenceId,
        artistId: input.artistId,
        code: input.code,
        shotName: input.shotName,
        description: input.description,
        episode: input.episode,
        clientShotName: input.clientShotName,
        clientDeliveryName: input.clientDeliveryName,
        scopeOfWork: input.scopeOfWork,
        taskTemplate: input.taskTemplate,
        status: input.status,
        priority: input.priority,
        version: input.version,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        vendorETA: input.vendorETA ? new Date(input.vendorETA) : null,
        deliverNextFor: input.deliverNextFor,
        assignedVendors: input.assignedVendors,
        prodTeamComments: input.prodTeamComments,
        vendorProdComments: input.vendorProdComments,
        clientAdditionalNotes: input.clientAdditionalNotes,
        latestClientNote: input.latestClientNote,
        flag: input.flag,
        complexity: input.complexity,
        clientPriority: input.clientPriority,
        cgComplete: input.cgComplete || false,
        cgSupervisorComments: input.cgSupervisorComments,
        cameraInfo: input.cameraInfo,
        character: input.character,
        compositor: input.compositor,
        cleanupVendor: input.cleanupVendor,
        additionalFX: input.additionalFX,
        ascSAT: input.ascSAT,
        ascSopOffset: input.ascSopOffset,
        ascSopPower: input.ascSopPower,
        ascSopSlope: input.ascSopSlope,
        allColor: input.allColor || false,
        bidId: input.bidId,
        bidNotes: input.bidNotes,
        bidProjId: input.bidProjId,
        bidTotal: input.bidTotal,
        biddingShotCount: input.biddingShotCount,
        deliveryDateFirstLooks: input.deliveryDateFirstLooks ? new Date(input.deliveryDateFirstLooks) : null,
        clientWIPDate: input.clientWIPDate ? new Date(input.clientWIPDate) : null,
        clientVersionsToFinal: input.clientVersionsToFinal,
        afterJune2: input.afterJune2 || false,
        allowTotal: input.allowTotal || false,
        clientSGId: input.clientSGId,
        clientSGStatus: input.clientSGStatus,
        clientProdNotes: input.clientProdNotes,
        clientReportNotes: input.clientReportNotes,
        clientAdditionalSOW: input.clientAdditionalSOW,
        clientAdditionalSOWDate: input.clientAdditionalSOWDate ? new Date(input.clientAdditionalSOWDate) : null,
        contentHubScheduledDelivery: input.contentHubScheduledDelivery ? new Date(input.contentHubScheduledDelivery) : null,
        contentHubPipelineLink: input.contentHubPipelineLink,
        assumptions: input.assumptions,
        bidDays: input.bidDays,
        actualDays: input.actualDays,
        frameStart: input.frameStart,
        frameEnd: input.frameEnd,
      },
    });
  },

  async updateShot(id: string, input: ShotSchema) {
    return prisma.shot.update({
      where: { id },
      data: {
        projectId: input.projectId,
        sequenceId: input.sequenceId,
        artistId: input.artistId,
        code: input.code,
        shotName: input.shotName,
        description: input.description,
        episode: input.episode,
        clientShotName: input.clientShotName,
        clientDeliveryName: input.clientDeliveryName,
        scopeOfWork: input.scopeOfWork,
        taskTemplate: input.taskTemplate,
        status: input.status,
        priority: input.priority,
        version: input.version,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        vendorETA: input.vendorETA ? new Date(input.vendorETA) : null,
        deliverNextFor: input.deliverNextFor,
        assignedVendors: input.assignedVendors,
        prodTeamComments: input.prodTeamComments,
        vendorProdComments: input.vendorProdComments,
        clientAdditionalNotes: input.clientAdditionalNotes,
        latestClientNote: input.latestClientNote,
        flag: input.flag,
        complexity: input.complexity,
        clientPriority: input.clientPriority,
        cgComplete: input.cgComplete || false,
        cgSupervisorComments: input.cgSupervisorComments,
        cameraInfo: input.cameraInfo,
        character: input.character,
        compositor: input.compositor,
        cleanupVendor: input.cleanupVendor,
        additionalFX: input.additionalFX,
        ascSAT: input.ascSAT,
        ascSopOffset: input.ascSopOffset,
        ascSopPower: input.ascSopPower,
        ascSopSlope: input.ascSopSlope,
        allColor: input.allColor || false,
        bidId: input.bidId,
        bidNotes: input.bidNotes,
        bidProjId: input.bidProjId,
        bidTotal: input.bidTotal,
        biddingShotCount: input.biddingShotCount,
        deliveryDateFirstLooks: input.deliveryDateFirstLooks ? new Date(input.deliveryDateFirstLooks) : null,
        clientWIPDate: input.clientWIPDate ? new Date(input.clientWIPDate) : null,
        clientVersionsToFinal: input.clientVersionsToFinal,
        afterJune2: input.afterJune2 || false,
        allowTotal: input.allowTotal || false,
        clientSGId: input.clientSGId,
        clientSGStatus: input.clientSGStatus,
        clientProdNotes: input.clientProdNotes,
        clientReportNotes: input.clientReportNotes,
        clientAdditionalSOW: input.clientAdditionalSOW,
        clientAdditionalSOWDate: input.clientAdditionalSOWDate ? new Date(input.clientAdditionalSOWDate) : null,
        contentHubScheduledDelivery: input.contentHubScheduledDelivery ? new Date(input.contentHubScheduledDelivery) : null,
        contentHubPipelineLink: input.contentHubPipelineLink,
        assumptions: input.assumptions,
        bidDays: input.bidDays,
        actualDays: input.actualDays,
        frameStart: input.frameStart,
        frameEnd: input.frameEnd,
      },
    });
  },

  async softDeleteShot(id: string) {
    return prisma.shot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
