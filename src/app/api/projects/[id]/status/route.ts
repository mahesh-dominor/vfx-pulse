import { auth } from "@/auth";
import { canAccessModuleAction } from "@/features/auth/rbac";
import { projectService } from "@/services/project.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessModuleAction(session.user.id, session.user.role, "projects", "update"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const project = await projectService.updateProjectStatus(id, parsed.data.status);
    return NextResponse.json(project);
  } catch (error) {
    console.error("PATCH /api/projects/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update project status" }, { status: 500 });
  }
}
