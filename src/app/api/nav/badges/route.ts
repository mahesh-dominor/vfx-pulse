import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [openShots, openTasks, pendingReviews, thresholdSettings] = await Promise.all([
      prisma.shot.count({
        where: {
          deletedAt: null,
          status: {
            in: ["NOT_STARTED", "WIP", "INTERNAL_REVIEW", "CLIENT_REVIEW", "HOLD"],
          },
          project: { deletedAt: null },
        },
      }),
      prisma.shotTask.count({
        where: {
          deletedAt: null,
          status: {
            in: ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "REVIEW"],
          },
          project: { deletedAt: null },
          shot: { deletedAt: null },
        },
      }),
      prisma.review.count({
        where: {
          deletedAt: null,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),
      prisma.studioSetting.findMany({
        where: {
          deletedAt: null,
          key: {
            in: ["nav_badge_warning_threshold", "nav_badge_critical_threshold"],
          },
        },
        select: {
          key: true,
          value: true,
        },
      }),
    ]);

    const thresholdMap = Object.fromEntries(thresholdSettings.map((item) => [item.key, item.value])) as Record<string, string>;

    const parsedWarningThreshold = Number.parseInt(thresholdMap.nav_badge_warning_threshold ?? "10", 10);
    const parsedCriticalThreshold = Number.parseInt(thresholdMap.nav_badge_critical_threshold ?? "20", 10);

    const warningThreshold = Number.isFinite(parsedWarningThreshold) ? parsedWarningThreshold : 10;
    const criticalThreshold = Number.isFinite(parsedCriticalThreshold) ? parsedCriticalThreshold : 20;

    const normalizedWarning = Math.max(1, Math.min(warningThreshold, criticalThreshold));
    const normalizedCritical = Math.max(normalizedWarning, criticalThreshold);

    return NextResponse.json({
      openShots,
      openTasks,
      pendingReviews,
      warningThreshold: normalizedWarning,
      criticalThreshold: normalizedCritical,
    });
  } catch (error) {
    console.error("GET /api/nav/badges error:", error);
    return NextResponse.json({ error: "Failed to fetch nav badges" }, { status: 500 });
  }
}
