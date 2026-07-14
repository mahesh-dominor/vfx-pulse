import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { capacityQuerySchema } from "@/features/planning/schemas/reverse-schedule.schema";
import { productionPlanningService } from "@/services/production-planning.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const parsed = capacityQuerySchema.safeParse({
      targetDays: searchParams.get("targetDays") ?? undefined,
      forecastStartDate: searchParams.get("forecastStartDate") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const result = await productionPlanningService.getDepartmentCapacityForecast(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/planning/capacity error:", error);
    return NextResponse.json({ error: "Failed to generate capacity forecast" }, { status: 500 });
  }
}
