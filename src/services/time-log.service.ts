import type { TimeLogSchema } from "@/features/time-logs/schemas/time-log.schema";
import { prisma } from "@/lib/prisma";

function toRange(period: "daily" | "weekly" | "monthly"): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  if (period === "daily") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setMonth(from.getMonth() - 1);
  }

  return { from, to };
}

export const timeLogService = {
  async listTimeLogs(filters?: { artistId?: string; projectId?: string; shotId?: string }) {
    return prisma.timeLog.findMany({
      where: {
        deletedAt: null,
        ...(filters?.artistId ? { artistId: filters.artistId } : {}),
        ...(filters?.projectId ? { projectId: filters.projectId } : {}),
        ...(filters?.shotId ? { shotId: filters.shotId } : {}),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        shot: { select: { id: true, code: true, shotName: true } },
        task: { select: { id: true, taskName: true, estimatedMinutes: true } },
        artist: { select: { id: true, fullName: true, department: true } },
      },
      orderBy: { logDate: "desc" },
    });
  },

  async createTimeLog(input: TimeLogSchema) {
    return prisma.timeLog.create({
      data: {
        logDate: new Date(input.logDate),
        projectId: input.projectId,
        shotId: input.shotId,
        taskId: input.taskId,
        artistId: input.artistId,
        activity: input.activity,
        minutesSpent: input.minutesSpent,
        status: input.status,
        notes: input.notes,
      },
    });
  },

  async getDashboard(period: "daily" | "weekly" | "monthly") {
    const { from, to } = toRange(period);

    const where = {
      deletedAt: null as Date | null,
      logDate: {
        gte: from,
        lte: to,
      },
    };

    const [perShot, perArtist, perProject, perDepartment, tasks] = await Promise.all([
      prisma.timeLog.groupBy({
        by: ["shotId"],
        where,
        _sum: { minutesSpent: true },
      }),
      prisma.timeLog.groupBy({
        by: ["artistId"],
        where,
        _sum: { minutesSpent: true },
      }),
      prisma.timeLog.groupBy({
        by: ["projectId"],
        where,
        _sum: { minutesSpent: true },
      }),
      prisma.timeLog.findMany({
        where,
        select: {
          minutesSpent: true,
          artist: {
            select: { department: true },
          },
        },
      }),
      prisma.shotTask.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          estimatedMinutes: true,
          timeLogs: {
            where,
            select: { minutesSpent: true },
          },
        },
      }),
    ]);

    const productivityByDepartment = perDepartment.reduce<Record<string, number>>((acc, item) => {
      const key = item.artist.department;
      acc[key] = (acc[key] ?? 0) + item.minutesSpent;
      return acc;
    }, {});

    const remainingEstimatedMinutes = tasks.reduce((sum, task) => {
      const spent = task.timeLogs.reduce((logSum, log) => logSum + log.minutesSpent, 0);
      const estimate = task.estimatedMinutes ?? 0;
      return sum + Math.max(estimate - spent, 0);
    }, 0);

    return {
      period,
      totalHoursPerShot: perShot.map((item) => ({ shotId: item.shotId, hours: (item._sum.minutesSpent ?? 0) / 60 })),
      totalHoursPerArtist: perArtist.map((item) => ({ artistId: item.artistId, hours: (item._sum.minutesSpent ?? 0) / 60 })),
      totalHoursPerProject: perProject.map((item) => ({ projectId: item.projectId, hours: (item._sum.minutesSpent ?? 0) / 60 })),
      productivityByDepartment,
      remainingEstimatedHours: remainingEstimatedMinutes / 60,
    };
  },
};
