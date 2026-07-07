import { auth } from "@/auth";
import { taskSchema } from "@/features/tasks/schemas/task.schema";
import { taskService } from "@/services/task.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const tasks = await taskService.listTasks({
    projectId: searchParams.get("projectId") ?? undefined,
    shotId: searchParams.get("shotId") ?? undefined,
    artistId: searchParams.get("artistId") ?? undefined,
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const task = await taskService.createTask(parsed.data);
  return NextResponse.json(task, { status: 201 });
}
