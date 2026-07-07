import type { ReviewSchema } from "@/features/reviews/schemas/review.schema";
import { prisma } from "@/lib/prisma";

export const reviewService = {
  async listReviews(shotId?: string) {
    return prisma.review.findMany({
      where: {
        deletedAt: null,
        ...(shotId ? { shotId } : {}),
      },
      include: {
        shot: {
          select: { id: true, code: true, shotName: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          where: { deletedAt: null },
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
