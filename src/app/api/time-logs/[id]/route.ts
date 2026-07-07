import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timeLogSchema } from "@/features/time-logs/schemas/time-log.schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = timeLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;

  const log = await prisma.timeLog.update({
    where: { id },
    data: {
      logDate: new Date(data.logDate),
      projectId: data.projectId,
      shotId: data.shotId,
      taskId: data.taskId,
      artistId: data.artistId,
      activity: data.activity,
      minutesSpent: data.minutesSpent,
      status: data.status,
      notes: data.notes,
    },
  });

  return NextResponse.json(log);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.timeLog.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
