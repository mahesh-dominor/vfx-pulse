import type { ArtistDepartment } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  DepartmentCapacityItem,
  DepartmentCapacityResult,
  PlanningSnapshot,
  ReverseScheduleInput,
  ReverseScheduleMilestone,
  ReverseScheduleResult,
} from "@/types/planning";

type SavePlanningSnapshotInput = {
  projectId: string;
  createdById: string;
  name: string;
  notes?: string;
  finalDeliveryDate: string;
  includeWeekends: boolean;
  holidays: string[];
  steps: ReverseScheduleInput["steps"];
};

function toDateOnlyString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function buildHolidaySet(holidays: string[]): Set<string> {
  return new Set(holidays.map((value) => toDateOnlyString(normalizeDate(new Date(value)))));
}

function isWorkingDay(date: Date, includeWeekends: boolean, holidaySet: Set<string>): boolean {
  const day = date.getDay();
  if (!includeWeekends && (day === 0 || day === 6)) {
    return false;
  }

  return !holidaySet.has(toDateOnlyString(date));
}

function moveBackWorkingDays(
  date: Date,
  days: number,
  includeWeekends: boolean,
  holidaySet: Set<string>
): Date {
  const cursor = normalizeDate(date);

  let moved = 0;
  while (moved < days) {
    cursor.setDate(cursor.getDate() - 1);
    if (isWorkingDay(cursor, includeWeekends, holidaySet)) {
      moved += 1;
    }
  }

  return cursor;
}

function spanStartFromEnd(
  endDate: Date,
  spanDays: number,
  includeWeekends: boolean,
  holidaySet: Set<string>
): Date {
  if (spanDays <= 1) {
    return normalizeDate(endDate);
  }

  return moveBackWorkingDays(endDate, spanDays - 1, includeWeekends, holidaySet);
}

function sumStepSpan(durationDays: number, bufferDays: number): number {
  return Math.max(durationDays + bufferDays, 1);
}

function mapPlanningSnapshot(snapshot: {
  id: string;
  projectId: string;
  name: string;
  notes: string | null;
  finalDeliveryDate: Date;
  pipelineStartDate: Date;
  includeWeekends: boolean;
  holidays: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string; email: string };
  milestones: Array<{
    stepCode: string;
    stepName: string;
    startDate: Date;
    endDate: Date;
    durationDays: number;
    bufferDays: number;
    parallelGroup: string | null;
  }>;
}): PlanningSnapshot {
  const holidays = Array.isArray(snapshot.holidays)
    ? snapshot.holidays.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: snapshot.id,
    projectId: snapshot.projectId,
    name: snapshot.name,
    notes: snapshot.notes,
    finalDeliveryDate: snapshot.finalDeliveryDate.toISOString(),
    pipelineStartDate: snapshot.pipelineStartDate.toISOString(),
    includeWeekends: snapshot.includeWeekends,
    holidays,
    createdBy: snapshot.createdBy,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
    milestones: snapshot.milestones
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map((milestone) => ({
        code: milestone.stepCode,
        name: milestone.stepName,
        startDate: toDateOnlyString(milestone.startDate),
        endDate: toDateOnlyString(milestone.endDate),
        durationDays: milestone.durationDays,
        bufferDays: milestone.bufferDays,
        parallelGroup: milestone.parallelGroup ?? undefined,
      })),
  };
}

export const productionPlanningService = {
  calculateReverseSchedule(input: ReverseScheduleInput): ReverseScheduleResult {
    const holidaySet = buildHolidaySet(input.holidays);
    const finalDeliveryDate = normalizeDate(new Date(input.finalDeliveryDate));
    const originalOrder = new Map(input.steps.map((step, index) => [step.code, index]));

    const reversed = [...input.steps].reverse();
    const milestones: ReverseScheduleMilestone[] = [];

    let cursor = finalDeliveryDate;
    let index = 0;

    while (index < reversed.length) {
      const current = reversed[index];

      if (current.parallelGroup) {
        const group = [current];
        let pointer = index + 1;

        while (pointer < reversed.length && reversed[pointer].parallelGroup === current.parallelGroup) {
          group.push(reversed[pointer]);
          pointer += 1;
        }

        const groupEnd = cursor;

        const groupMilestones = group.map((step) => {
          const spanDays = sumStepSpan(step.durationDays, step.bufferDays);
          const start = spanStartFromEnd(groupEnd, spanDays, input.includeWeekends, holidaySet);

          return {
            code: step.code,
            name: step.name,
            startDate: toDateOnlyString(start),
            endDate: toDateOnlyString(groupEnd),
            durationDays: step.durationDays,
            bufferDays: step.bufferDays,
            parallelGroup: step.parallelGroup,
            _startForCursor: start,
          };
        });

        const groupStart = groupMilestones.reduce((earliest, item) =>
          item._startForCursor < earliest ? item._startForCursor : earliest
        , groupMilestones[0]._startForCursor);

        milestones.push(
          ...groupMilestones.map((item) => ({
            code: item.code,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
            durationDays: item.durationDays,
            bufferDays: item.bufferDays,
            parallelGroup: item.parallelGroup,
          }))
        );

        cursor = moveBackWorkingDays(groupStart, 1, input.includeWeekends, holidaySet);
        index = pointer;
        continue;
      }

      const spanDays = sumStepSpan(current.durationDays, current.bufferDays);
      const end = cursor;
      const start = spanStartFromEnd(end, spanDays, input.includeWeekends, holidaySet);

      milestones.push({
        code: current.code,
        name: current.name,
        startDate: toDateOnlyString(start),
        endDate: toDateOnlyString(end),
        durationDays: current.durationDays,
        bufferDays: current.bufferDays,
        parallelGroup: current.parallelGroup,
      });

      cursor = moveBackWorkingDays(start, 1, input.includeWeekends, holidaySet);
      index += 1;
    }

    milestones.sort((a, b) => (originalOrder.get(a.code) ?? 0) - (originalOrder.get(b.code) ?? 0));

    const pipelineStartDate = milestones.length === 0
      ? toDateOnlyString(finalDeliveryDate)
      : milestones[0].startDate;

    return {
      pipelineStartDate,
      finalDeliveryDate: toDateOnlyString(finalDeliveryDate),
      milestones,
    };
  },

  async getDepartmentCapacityForecast(input?: {
    projectId?: string;
    targetDays?: number;
    forecastStartDate?: string;
  }): Promise<DepartmentCapacityResult> {
    const targetDays = input?.targetDays ?? 8;
    const forecastStart = normalizeDate(input?.forecastStartDate ? new Date(input.forecastStartDate) : new Date());
    const forecastEnd = normalizeDate(new Date(forecastStart));
    forecastEnd.setDate(forecastEnd.getDate() + Math.max(targetDays - 1, 0));

    const [artists, pendingTasks, leaves] = await Promise.all([
      prisma.artist.findMany({
        where: {
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          department: true,
        },
      }),
      prisma.shotTask.findMany({
        where: {
          deletedAt: null,
          ...(input?.projectId ? { projectId: input.projectId } : {}),
          status: {
            in: ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "REVIEW"],
          },
        },
        select: {
          estimatedMinutes: true,
          status: true,
          artist: {
            select: {
              department: true,
            },
          },
        },
      }),
      prisma.artistLeave.findMany({
        where: {
          deletedAt: null,
          leaveDate: {
            gte: forecastStart,
            lte: forecastEnd,
          },
          artist: {
            deletedAt: null,
            isActive: true,
          },
        },
        select: {
          isHalfDay: true,
          artist: {
            select: {
              department: true,
            },
          },
        },
      }),
    ]);

    const departmentArtistCount = new Map<ArtistDepartment, number>();
    for (const artist of artists) {
      departmentArtistCount.set(
        artist.department,
        (departmentArtistCount.get(artist.department) ?? 0) + 1
      );
    }

    const leaveHoursByDepartment = new Map<ArtistDepartment, number>();
    for (const leave of leaves) {
      const leaveHours = leave.isHalfDay ? 4 : 8;
      const department = leave.artist.department;
      leaveHoursByDepartment.set(
        department,
        (leaveHoursByDepartment.get(department) ?? 0) + leaveHours
      );
    }

    const pendingMinutesByDepartment = new Map<ArtistDepartment, number>();
    const inProgressMinutesByDepartment = new Map<ArtistDepartment, number>();

    for (const task of pendingTasks) {
      const department = task.artist.department;
      const estimatedMinutes = task.estimatedMinutes ?? 0;

      pendingMinutesByDepartment.set(
        department,
        (pendingMinutesByDepartment.get(department) ?? 0) + estimatedMinutes
      );

      if (task.status === "IN_PROGRESS") {
        inProgressMinutesByDepartment.set(
          department,
          (inProgressMinutesByDepartment.get(department) ?? 0) + estimatedMinutes
        );
      }
    }

    const allDepartments = new Set<ArtistDepartment>([
      ...departmentArtistCount.keys(),
      ...pendingMinutesByDepartment.keys(),
      ...leaveHoursByDepartment.keys(),
    ]);

    const items: DepartmentCapacityItem[] = Array.from(allDepartments)
      .sort()
      .map((department) => {
        const availableArtists = departmentArtistCount.get(department) ?? 0;
        const pendingHours = (pendingMinutesByDepartment.get(department) ?? 0) / 60;
        const inProgressHours = (inProgressMinutesByDepartment.get(department) ?? 0) / 60;
        const leaveHoursInWindow = leaveHoursByDepartment.get(department) ?? 0;
        const totalWindowHours = availableArtists * targetDays * 8;
        const effectiveWindowHours = Math.max(totalWindowHours - leaveHoursInWindow, 0);
        const capacityHoursPerDay = targetDays === 0 ? 0 : effectiveWindowHours / targetDays;
        const effectiveArtists = capacityHoursPerDay / 8;
        const forecastFinishDays =
          capacityHoursPerDay === 0
            ? pendingHours > 0
              ? 999
              : 0
            : Math.ceil(pendingHours / capacityHoursPerDay);
        const requiredArtists = Math.ceil(pendingHours / (Math.max(targetDays, 1) * 8));
        const requiredAdditionalArtists = Math.max(requiredArtists - availableArtists, 0);

        const risk =
          pendingHours > 0 && availableArtists === 0
            ? "BLOCKED"
            : forecastFinishDays > targetDays
              ? "AT_RISK"
              : "ON_TRACK";

        return {
          department,
          pendingHours,
          inProgressHours,
          availableArtists,
          leaveHoursInWindow,
          effectiveArtists,
          capacityHoursPerDay,
          forecastFinishDays,
          targetDays,
          requiredAdditionalArtists,
          risk,
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      items,
    };
  },

  async savePlanningSnapshot(input: SavePlanningSnapshotInput): Promise<PlanningSnapshot> {
    const schedule = this.calculateReverseSchedule({
      finalDeliveryDate: input.finalDeliveryDate,
      includeWeekends: input.includeWeekends,
      holidays: input.holidays,
      steps: input.steps,
    });

    const created = await prisma.$transaction(async (tx) => {
      const snapshot = await tx.projectPlanSnapshot.create({
        data: {
          projectId: input.projectId,
          createdById: input.createdById,
          name: input.name,
          notes: input.notes,
          finalDeliveryDate: new Date(schedule.finalDeliveryDate),
          pipelineStartDate: new Date(schedule.pipelineStartDate),
          includeWeekends: input.includeWeekends,
          holidays: input.holidays,
          milestones: {
            create: schedule.milestones.map((milestone, index) => ({
              sequenceOrder: index,
              stepCode: milestone.code,
              stepName: milestone.name,
              startDate: new Date(milestone.startDate),
              endDate: new Date(milestone.endDate),
              durationDays: milestone.durationDays,
              bufferDays: milestone.bufferDays,
              parallelGroup: milestone.parallelGroup,
            })),
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          milestones: {
            where: { deletedAt: null },
            orderBy: { sequenceOrder: "asc" },
            select: {
              stepCode: true,
              stepName: true,
              startDate: true,
              endDate: true,
              durationDays: true,
              bufferDays: true,
              parallelGroup: true,
            },
          },
        },
      });

      return snapshot;
    });

    return mapPlanningSnapshot(created);
  },

  async listPlanningSnapshots(input?: {
    projectId?: string;
    limit?: number;
  }): Promise<PlanningSnapshot[]> {
    const snapshots = await prisma.projectPlanSnapshot.findMany({
      where: {
        deletedAt: null,
        ...(input?.projectId ? { projectId: input.projectId } : {}),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        milestones: {
          where: { deletedAt: null },
          orderBy: { sequenceOrder: "asc" },
          select: {
            stepCode: true,
            stepName: true,
            startDate: true,
            endDate: true,
            durationDays: true,
            bufferDays: true,
            parallelGroup: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: input?.limit ?? 20,
    });

    return snapshots.map((snapshot) => mapPlanningSnapshot(snapshot));
  },

  async getPlanningSnapshotById(id: string): Promise<PlanningSnapshot | null> {
    const snapshot = await prisma.projectPlanSnapshot.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        milestones: {
          where: { deletedAt: null },
          orderBy: { sequenceOrder: "asc" },
          select: {
            stepCode: true,
            stepName: true,
            startDate: true,
            endDate: true,
            durationDays: true,
            bufferDays: true,
            parallelGroup: true,
          },
        },
      },
    });

    return snapshot ? mapPlanningSnapshot(snapshot) : null;
  },
};
