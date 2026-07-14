import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ProjectsManagement from "@/components/projects/ProjectsManagement";
import TopNav from "@/components/layout/TopNav";
import { canAccessModuleAction } from "@/features/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const canView = await canAccessModuleAction(session.user.id, session.user.role, "projects", "view");

  if (!canView) {
    redirect("/dashboard");
  }

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    canAccessModuleAction(session.user.id, session.user.role, "projects", "create"),
    canAccessModuleAction(session.user.id, session.user.role, "projects", "update"),
    canAccessModuleAction(session.user.id, session.user.role, "projects", "delete"),
  ]);

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Projects</h1>
      <ProjectsManagement canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
    </main>
  );
}
