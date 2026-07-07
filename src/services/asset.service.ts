import type { AssetSchema } from "@/features/assets/schemas/asset.schema";
import { prisma } from "@/lib/prisma";

export const assetService = {
  async listAssets(projectId?: string) {
    return prisma.asset.findMany({
      where: {
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
        shot: {
          select: { id: true, code: true, shotName: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async createAsset(input: AssetSchema) {
    return prisma.asset.create({
      data: {
        projectId: input.projectId,
        shotId: input.shotId,
        name: input.name,
        assetType: input.assetType,
        fileUrl: input.fileUrl,
        version: input.version,
      },
    });
  },

  async updateAsset(id: string, input: AssetSchema) {
    return prisma.asset.update({
      where: { id },
      data: {
        projectId: input.projectId,
        shotId: input.shotId,
        name: input.name,
        assetType: input.assetType,
        fileUrl: input.fileUrl,
        version: input.version,
      },
    });
  },

  async softDeleteAsset(id: string) {
    return prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
