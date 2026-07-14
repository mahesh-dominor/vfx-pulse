import { auth } from "@/auth";
import { canAccessModuleAction } from "@/features/auth/rbac";
import { projectService } from "@/services/project.service";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.id || !session.user.role) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!(await canAccessModuleAction(session.user.id, session.user.role, "projects", "view"))) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const producers = await projectService.listProjectProducers();

		return NextResponse.json({ producers });
	} catch (error) {
		console.error("GET /api/projects/meta error:", error);
		return NextResponse.json({ producers: [] });
	}
}