import { auth } from "@/auth";
import { timeLogService } from "@/services/time-log.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") ?? "daily") as "daily" | "weekly" | "monthly";

    if (!["daily", "weekly", "monthly"].includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const data = await timeLogService.getDashboard(period);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/time-logs/dashboard error:", error);
    return NextResponse.json({
      period: "weekly",
      totalHoursPerShot: [],
      totalHoursPerArtist: [],
      totalHoursPerProject: [],
      productivityByDepartment: {},
      remainingEstimatedHours: 0,
    });
  }
}
