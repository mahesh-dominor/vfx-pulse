import type { EpisodeSchema } from "@/features/episodes/schemas/episode.schema";
import { prisma } from "@/lib/prisma";

export const episodeService = {
  async listEpisodes(projectId: string) {
    return prisma.episode.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { sequences: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createEpisode(input: EpisodeSchema) {
    // Check for duplicate
    const existing = await prisma.episode.findUnique({
      where: {
        projectId_code: {
          projectId: input.projectId,
          code: input.code.toUpperCase().trim(),
        },
      },
    });

    if (existing) {
      throw new Error("Episode code already exists for this project");
    }

    return prisma.episode.create({
      data: {
        projectId: input.projectId,
        code: input.code.toUpperCase().trim(),
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },

  async updateEpisode(id: string, input: Partial<EpisodeSchema>) {
    return prisma.episode.update({
      where: { id },
      data: {
        ...(input.code && { code: input.code.toUpperCase().trim() }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });
  },

  async reorderEpisodes(projectId: string, episodeIds: string[]) {
    const updates = episodeIds.map((id, index) =>
      prisma.episode.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    return Promise.all(updates);
  },

  async softDeleteEpisode(id: string) {
    return prisma.episode.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async bulkCreateEpisodes(projectId: string, codes: string[]) {
    // Filter out duplicates and empty codes
    const validCodes = [...new Set(codes.map(c => c.toUpperCase().trim()))].filter(c => c.length > 0);

    // Check existing codes
    const existing = await prisma.episode.findMany({
      where: {
        projectId,
        code: { in: validCodes },
      },
    });

    const existingCodes = existing.map(e => e.code);
    const newCodes = validCodes.filter(code => !existingCodes.includes(code));

    if (newCodes.length === 0) {
      throw new Error("All episodes already exist for this project");
    }

    const episodes = await Promise.all(
      newCodes.map((code, index) =>
        prisma.episode.create({
          data: {
            projectId,
            code,
            sortOrder: index,
          },
        })
      )
    );

    return episodes;
  },
};
