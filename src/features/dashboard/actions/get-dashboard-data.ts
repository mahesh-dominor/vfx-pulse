"use server";

import { auth } from "@/auth";
import { dashboardQuerySchema } from "@/features/dashboard/schemas/dashboard-query.schema";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardDataAction(
  input?: Partial<{ recentActivityLimit: number; assignedShotsLimit: number }>
): Promise<DashboardData> {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    throw new Error("Unauthorized");
  }

  const parsed = dashboardQuerySchema.safeParse({
    recentActivityLimit: input?.recentActivityLimit,
    assignedShotsLimit: input?.assignedShotsLimit,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid dashboard request");
  }

  return dashboardService.getDashboardData({
    userId: session.user.id,
    role: session.user.role,
    recentActivityLimit: parsed.data.recentActivityLimit,
    assignedShotsLimit: parsed.data.assignedShotsLimit,
  });
}
