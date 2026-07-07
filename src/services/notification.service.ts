import type { NotificationSchema } from "@/features/notifications/schemas/notification.schema";
import { prisma } from "@/lib/prisma";

export const notificationService = {
  async listByUser(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  async createNotification(input: NotificationSchema) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        channel: input.channel,
      },
    });
  },

  async markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async softDeleteNotification(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
