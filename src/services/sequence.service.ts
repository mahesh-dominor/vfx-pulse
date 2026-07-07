import type { SequenceSchema } from "@/features/sequences/schemas/sequence.schema";
import { prisma } from "@/lib/prisma";

export const sequenceService = {
  async listSequences(projectId?: string) {
    return prisma.sequence.findMany({
      where: {
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { shots: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createSequence(input: SequenceSchema) {
    return prisma.sequence.create({
      data: {
        projectId: input.projectId,
        code: input.code,
        name: input.name,
      },
    });
  },

  async updateSequence(id: string, input: SequenceSchema) {
    return prisma.sequence.update({
      where: { id },
      data: {
        projectId: input.projectId,
        code: input.code,
        name: input.name,
      },
    });
  },

  async softDeleteSequence(id: string) {
    return prisma.sequence.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
