import { auth } from "@/auth";
import { dailyUpdateService } from "@/services/daily-update.service";
import { dailyUpdateSchema } from "@/features/daily-update/schemas/daily-update.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validated = dailyUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const update = await dailyUpdateService.createUpdate({
      userId: session.user.id,
      projectId: validated.data.projectId,
      shotId: validated.data.shotId,
      hoursWorked: validated.data.hoursWorked,
      taskType: validated.data.taskType,
      status: validated.data.status,
      comments: validated.data.comments || "",
    });

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error("POST /api/daily-updates error:", error);
    return NextResponse.json(
      { error: "Failed to create update" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;
    const days = parseInt(searchParams.get("days") || "7");

    const updates = await dailyUpdateService.getUpdatesByUser(userId, days);
    return NextResponse.json(updates);
  } catch (error) {
    console.error("GET /api/daily-updates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}
