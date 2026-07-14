import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { DEFAULT_VFX_PIPELINE } from "@/constants/production-pipeline";
import { reverseScheduleSchema } from "@/features/planning/schemas/reverse-schedule.schema";
import { productionPlanningService } from "@/services/production-planning.service";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{
      finalDeliveryDate: string;
      includeWeekends: boolean;
      holidays: string[];
      steps: Array<{
        code: string;
        name: string;
        durationDays: number;
        bufferDays: number;
        parallelGroup?: string;
      }>;
    }>;

    const parsed = reverseScheduleSchema.safeParse({
      finalDeliveryDate: body.finalDeliveryDate,
      includeWeekends: body.includeWeekends ?? false,
      holidays: body.holidays ?? [],
      steps: body.steps?.length ? body.steps : DEFAULT_VFX_PIPELINE,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const result = productionPlanningService.calculateReverseSchedule(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/planning/reverse-schedule error:", error);
    return NextResponse.json(
      { error: "Failed to generate reverse schedule" },
      { status: 500 }
    );
  }
}
