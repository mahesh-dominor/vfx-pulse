import { auth } from "@/auth";
import { timeLogSchema } from "@/features/time-logs/schemas/time-log.schema";
import { timeLogService } from "@/services/time-log.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const timeLogs = await timeLogService.listTimeLogs({
      projectId: searchParams.get("projectId") ?? undefined,
      shotId: searchParams.get("shotId") ?? undefined,
      artistId: searchParams.get("artistId") ?? undefined,
    });

    return NextResponse.json(timeLogs);
  } catch (error) {
    console.error("GET /api/time-logs error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = timeLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const log = await timeLogService.createTimeLog(parsed.data);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/time-logs error:", error);
    return NextResponse.json({ error: "Failed to create time log" }, { status: 500 });
  }
}
