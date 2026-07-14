import { auth } from "@/auth";
import { canAccessModuleAction } from "@/features/auth/rbac";
import { projectSchema } from "@/features/projects/schemas/project.schema";
import { projectService } from "@/services/project.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessModuleAction(session.user.id, session.user.role, "projects", "view"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeOnly = new URL(req.url).searchParams.get("activeOnly") === "true";

    const projects = await projectService.listProjects({ activeOnly });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessModuleAction(session.user.id, session.user.role, "projects", "create"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const project = await projectService.createProject(parsed.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
