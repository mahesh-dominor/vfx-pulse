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
        status: input.status,
        priority: input.priority,
        version: input.version,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
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
        status: input.status,
        priority: input.priority,
        version: input.version,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
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
