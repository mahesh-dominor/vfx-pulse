import { auth } from "@/auth";
import { projectSchema } from "@/features/projects/schemas/project.schema";
import { projectService } from "@/services/project.service";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const project = await projectService.updateProject(id, parsed.data);
    return NextResponse.json(project);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const mode = new URL(req.url).searchParams.get("mode") ?? "hard";

    if (mode === "soft") {
      await projectService.softDeleteProject(id);
    } else {
      await projectService.hardDeleteProject(id);
    }

    return NextResponse.json({ success: true, mode });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
