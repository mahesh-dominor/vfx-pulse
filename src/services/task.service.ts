import type { TaskSchema } from "@/features/tasks/schemas/task.schema";
import { prisma } from "@/lib/prisma";

export const taskService = {
  async listTasks(filters?: { projectId?: string; shotId?: string; artistId?: string }) {
    return prisma.shotTask.findMany({
      where: {
        deletedAt: null,
        ...(filters?.projectId ? { projectId: filters.projectId } : {}),
        ...(filters?.shotId ? { shotId: filters.shotId } : {}),
        ...(filters?.artistId ? { artistId: filters.artistId } : {}),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        shot: { select: { id: true, code: true, shotName: true } },
        artist: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createTask(input: TaskSchema) {
    return prisma.shotTask.create({
      data: {
        projectId: input.projectId,
        shotId: input.shotId,
        artistId: input.artistId,
        taskName: input.taskName,
        description: input.description,
        estimatedMinutes: input.estimatedMinutes,
        status: input.status,
      },
    });
  },

  async updateTask(id: string, input: TaskSchema) {
    return prisma.shotTask.update({
      where: { id },
      data: {
        projectId: input.projectId,
        shotId: input.shotId,
        artistId: input.artistId,
        taskName: input.taskName,
        description: input.description,
        estimatedMinutes: input.estimatedMinutes,
        status: input.status,
      },
    });
  },

  async softDeleteTask(id: string) {
    return prisma.shotTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
