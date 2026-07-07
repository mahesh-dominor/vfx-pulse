import { auth } from "@/auth";
import { dashboardQuerySchema } from "@/features/dashboard/schemas/dashboard-query.schema";
import { dashboardService } from "@/services/dashboard.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const parsed = dashboardQuerySchema.safeParse({
      recentActivityLimit: searchParams.get("recentActivityLimit") ?? undefined,
      assignedShotsLimit: searchParams.get("assignedShotsLimit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const dashboardData = await dashboardService.getDashboardData({
      userId: session.user.id,
      role: session.user.role,
      recentActivityLimit: parsed.data.recentActivityLimit,
      assignedShotsLimit: parsed.data.assignedShotsLimit,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
