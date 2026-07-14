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
        episode: {
          select: { id: true, code: true },
        },
        _count: {
          select: { shots: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createSequence(input: SequenceSchema) {
    // Check for duplicate code within project
    const existing = await prisma.sequence.findUnique({
      where: {
        projectId_code: {
          projectId: input.projectId,
          code: input.code.toUpperCase().trim(),
        },
      },
    });

    if (existing) {
      throw new Error("Sequence code already exists for this project");
    }

    return prisma.sequence.create({
      data: {
        projectId: input.projectId,
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        episodeId: input.episodeId,
        description: input.description?.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
      include: {
        episode: {
          select: { id: true, code: true },
        },
      },
    });
  },

  async updateSequence(id: string, input: Partial<SequenceSchema>) {
    return prisma.sequence.update({
      where: { id },
      data: {
        ...(input.code && { code: input.code.toUpperCase().trim() }),
        ...(input.name && { name: input.name.trim() }),
        ...(input.episodeId !== undefined && { episodeId: input.episodeId }),
        ...(input.description !== undefined && { description: input.description?.trim() }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
      include: {
        episode: {
          select: { id: true, code: true },
        },
      },
    });
  },

  async reorderSequences(projectId: string, sequenceIds: string[]) {
    const updates = sequenceIds.map((id, index) =>
      prisma.sequence.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    return Promise.all(updates);
  },

  async softDeleteSequence(id: string) {
    return prisma.sequence.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async bulkCreateSequences(projectId: string, sequences: Array<{ code: string; name: string; episodeId?: string }>) {
    const createdSequences: Array<any> = [];

    for (const seq of sequences) {
      const code = seq.code.toUpperCase().trim();
      const name = seq.name.trim();

      if (!code || !name) continue;

      const existing = await prisma.sequence.findUnique({
        where: {
          projectId_code: {
            projectId,
            code,
          },
        },
      });

      if (existing) continue;

      const created = await prisma.sequence.create({
        data: {
          projectId,
          code,
          name,
          episodeId: seq.episodeId,
          sortOrder: createdSequences.length,
        },
        include: {
          episode: {
            select: { id: true, code: true },
          },
        },
      });

      createdSequences.push(created);
    }

    return createdSequences;
  },
};
