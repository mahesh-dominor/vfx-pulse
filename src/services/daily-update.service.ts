import { prisma } from "@/lib/prisma";

export interface CreateDailyUpdateInput {
  userId: string;
  projectId: string;
  shotId: string;
  hoursWorked: number;
  taskType: string;
  status: string;
  comments: string;
}

export const dailyUpdateService = {
  async createUpdate(data: CreateDailyUpdateInput) {
    // Check if update already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingUpdate = await prisma.dailyUpdate.findFirst({
      where: {
        deletedAt: null,
        userId: data.userId,
        shotId: data.shotId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingUpdate) {
      // Update existing record
      return prisma.dailyUpdate.update({
        where: { id: existingUpdate.id },
        data: {
          hoursWorked: data.hoursWorked,
          taskType: data.taskType,
          status: data.status,
          comments: data.comments,
        },
      });
    }

    return prisma.dailyUpdate.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        shotId: data.shotId,
        hoursWorked: data.hoursWorked,
        taskType: data.taskType,
        status: data.status,
        comments: data.comments,
      },
    });
  },

  async getUpdatesByUser(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.dailyUpdate.findMany({
      where: {
        deletedAt: null,
        userId,
        createdAt: { gte: startDate },
      },
      include: {
        shot: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getMissingUpdates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
    });

    const usersWithUpdates = await prisma.dailyUpdate.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: today },
      },
      distinct: ["userId"],
    });

    const usersWithUpdateIds = usersWithUpdates.map((u) => u.userId);
    const missingUpdates = activeUsers.filter(
      (u) => !usersWithUpdateIds.includes(u.id)
    );

    return missingUpdates;
  },

  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updates = await prisma.dailyUpdate.findMany({
      where: { deletedAt: null, createdAt: { gte: today } },
    });

    const totalHours = updates.reduce((sum, u) => sum + u.hoursWorked, 0);
    const uniqueUsers = new Set(updates.map((u) => u.userId));

    return {
      updatesSubmitted: updates.length,
      totalHours,
      artistsSubmitted: uniqueUsers.size,
    };
  },
};
