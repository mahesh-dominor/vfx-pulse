import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  planningSnapshotCreateSchema,
  planningSnapshotQuerySchema,
} from "@/features/planning/schemas/reverse-schedule.schema";
import { productionPlanningService } from "@/services/production-planning.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = planningSnapshotQuerySchema.safeParse({
      projectId: searchParams.get("projectId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const snapshots = await productionPlanningService.listPlanningSnapshots(parsed.data);
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("GET /api/planning/snapshots error:", error);
    return NextResponse.json({ error: "Failed to fetch planning snapshots" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as unknown;
    const parsed = planningSnapshotCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const snapshot = await productionPlanningService.savePlanningSnapshot({
      projectId: parsed.data.projectId,
      createdById: session.user.id,
      name: parsed.data.name,
      notes: parsed.data.notes,
      finalDeliveryDate: parsed.data.finalDeliveryDate,
      includeWeekends: parsed.data.includeWeekends,
      holidays: parsed.data.holidays,
      steps: parsed.data.steps,
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("POST /api/planning/snapshots error:", error);
    return NextResponse.json({ error: "Failed to save planning snapshot" }, { status: 500 });
  }
}
