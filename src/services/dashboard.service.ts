import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DASHBOARD_QUICK_ACTIONS } from "@/constants/dashboard";
import type { DashboardData } from "@/types/dashboard";

type DashboardOptions = {
  userId: string;
  role: UserRole;
  recentActivityLimit: number;
  assignedShotsLimit: number;
};

function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function toTimeString(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const dashboardService = {
  async getDashboardData(options: DashboardOptions): Promise<DashboardData> {
    const today = getStartOfToday();

    const [
      totalProjects,
      activeProjects,
      totalShots,
      openShots,
      completedShots,
      artistCount,
      taskOpen,
      taskInProgress,
      taskCompleted,
      timeLogAggregate,
      artistsLoggedIn,
      updatesToday,
      shotsUpdated,
      missingArtists,
      assignedShots,
      activityLogs,
    ] =
      await Promise.all([
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.project.count({ where: { deletedAt: null, status: "ACTIVE" } }),
        prisma.shot.count({ where: { deletedAt: null } }),
        prisma.shot.count({ where: { deletedAt: null, status: { in: ["NOT_STARTED", "WIP", "INTERNAL_REVIEW", "CLIENT_REVIEW", "HOLD"] } } }),
        prisma.shot.count({ where: { deletedAt: null, status: { in: ["APPROVED", "DELIVERED"] } } }),
        prisma.artist.count({ where: { deletedAt: null, isActive: true } }),
        prisma.shotTask.count({ where: { deletedAt: null, status: { in: ["NOT_STARTED", "ON_HOLD", "REVIEW"] } } }),
        prisma.shotTask.count({ where: { deletedAt: null, status: "IN_PROGRESS" } }),
        prisma.shotTask.count({ where: { deletedAt: null, status: "COMPLETED" } }),
        prisma.timeLog.aggregate({ where: { deletedAt: null }, _sum: { minutesSpent: true } }),
        prisma.user.count({
          where: {
            role: "ARTIST",
            isActive: true,
            deletedAt: null,
            lastLogin: { gte: today },
          },
        }),
        prisma.dailyUpdate.findMany({
          where: { createdAt: { gte: today } },
          select: {
            id: true,
            hoursWorked: true,
            taskType: true,
            status: true,
            shot: { select: { code: true } },
          },
        }),
        prisma.shot.count({
          where: {
            updatedAt: { gte: today },
            deletedAt: null,
          },
        }),
        prisma.user.findMany({
          where: {
            role: "ARTIST",
            isActive: true,
            deletedAt: null,
            dailyUpdates: {
              none: {
                createdAt: { gte: today },
              },
            },
          },
          select: {
            id: true,
            name: true,
          },
          take: 8,
        }),
        prisma.shot.findMany({
          where:
            options.role === "ARTIST"
              ? { artistId: options.userId, deletedAt: null }
              : { deletedAt: null },
          select: {
            id: true,
            code: true,
            shotName: true,
            status: true,
            dueDate: true,
            project: { select: { name: true } },
          },
          orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
          take: options.assignedShotsLimit,
        }),
        prisma.activityLog.findMany({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: {
            id: true,
            createdAt: true,
            action: true,
            description: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: options.recentActivityLimit,
        }),
      ]);

    const hoursLogged = updatesToday.reduce((sum, item) => sum + item.hoursWorked, 0);
    const productionProgressPercent = totalShots === 0 ? 0 : (completedShots / totalShots) * 100;

    const notifications = [
      ...missingArtists.slice(0, 3).map((artist) => ({
        id: `missing-${artist.id}`,
        title: `${artist.name} has not submitted daily update`,
        severity: "warning" as const,
      })),
      ...(shotsUpdated === 0
        ? [
            {
              id: "shots-updated-zero",
              title: "No shots updated today",
              severity: "critical" as const,
            },
          ]
        : []),
    ];

    const todaysWork = updatesToday.slice(0, 8).map((item) => ({
      id: item.id,
      shotCode: item.shot.code ?? "Unnamed Shot",
      taskType: item.taskType,
      hoursWorked: item.hoursWorked,
      status: item.status,
    }));

    return {
      kpis: {
        totalProjects,
        activeProjects,
        totalShots,
        openShots,
        completedShots,
        artistCount,
        taskOpen,
        taskInProgress,
        taskCompleted,
        timeLogHours: (timeLogAggregate._sum.minutesSpent ?? 0) / 60,
        productionProgressPercent,

        artistsLoggedIn,
        updatesSubmitted: updatesToday.length,
        hoursLogged,
        shotsUpdated,
        missingUpdates: missingArtists.length,
      },
      recentActivity: activityLogs.map((log) => ({
        id: log.id,
        time: toTimeString(log.createdAt),
        user: log.user.name,
        task: log.description ?? log.action,
      })),
      assignedShots: assignedShots.map((shot) => ({
        id: shot.id,
        code: shot.code ?? shot.shotName,
        status: shot.status,
        dueDate: shot.dueDate ? shot.dueDate.toISOString().split("T")[0] : null,
        projectName: shot.project.name,
      })),
      todaysWork,
      notifications,
      quickActions: DASHBOARD_QUICK_ACTIONS.map((item) => ({ ...item })),
    };
  },
};
