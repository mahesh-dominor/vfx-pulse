import type { ReviewSchema } from "@/features/reviews/schemas/review.schema";
import { prisma } from "@/lib/prisma";

type ReviewFilters = {
  shotId?: string;
  projectId?: string;
  artistId?: string;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "APPROVED" | "REJECTED";
  fromDate?: Date;
  toDate?: Date;
  search?: string;
};

export const reviewService = {
  async listReviews(filters?: ReviewFilters) {
    const shotFilter = {
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.artistId ? { artistId: filters.artistId } : {}),
    };

    return prisma.review.findMany({
      where: {
        deletedAt: null,
        ...(filters?.shotId ? { shotId: filters.shotId } : {}),
        ...(Object.keys(shotFilter).length > 0 ? { shot: shotFilter } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.fromDate || filters?.toDate
          ? {
              createdAt: {
                ...(filters.fromDate ? { gte: filters.fromDate } : {}),
                ...(filters.toDate ? { lte: filters.toDate } : {}),
              },
            }
          : {}),
        ...(filters?.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
                { shot: { code: { contains: filters.search, mode: "insensitive" } } },
                { shot: { shotName: { contains: filters.search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        shot: {
          select: {
            id: true,
            code: true,
            shotName: true,
            version: true,
            project: {
              select: { id: true, code: true, name: true },
            },
            artist: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          where: { deletedAt: null },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createReview(userId: string, input: ReviewSchema) {
    return prisma.review.create({
      data: {
        shotId: input.shotId,
        createdById: userId,
        reviewType: input.reviewType,
        status: input.status,
        title: input.title,
        description: input.description,
      },
    });
  },

  async updateReview(id: string, input: ReviewSchema) {
    return prisma.review.update({
      where: { id },
      data: {
        shotId: input.shotId,
        reviewType: input.reviewType,
        status: input.status,
        title: input.title,
        description: input.description,
      },
    });
  },

  async updateReviewStatus(
    id: string,
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "APPROVED" | "REJECTED"
  ) {
    return prisma.review.update({
      where: { id },
      data: { status },
    });
  },

  async addNote(reviewId: string, userId: string, content: string) {
    return prisma.reviewNote.create({
      data: {
        reviewId,
        userId,
        content,
      },
    });
  },

  async softDeleteReview(id: string) {
    return prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
