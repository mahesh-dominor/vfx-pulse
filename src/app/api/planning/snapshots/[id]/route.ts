import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { productionPlanningService } from "@/services/production-planning.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const snapshot = await productionPlanningService.getPlanningSnapshotById(id);

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/planning/snapshots/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch planning snapshot" }, { status: 500 });
  }
}
