import { redirect } from "next/navigation";

import { auth } from "@/auth";
import TopNav from "@/components/layout/TopNav";
import UsersManagement from "@/components/users/UsersManagement";
import { getUsersPageData } from "@/features/users/actions/get-users-page-data";
import {
  canDeleteUsers,
  canEditUsers,
  canViewUsers,
} from "@/features/users/permissions";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  if (!canViewUsers(session.user.role)) {
    redirect("/dashboard");
  }

  const data = await getUsersPageData();

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-100">Users</h1>
        <p className="mt-2 text-slate-400">
          Manage users, roles, teams, and permission overrides.
        </p>
      </div>

      <UsersManagement
        users={data.users}
        teams={data.teams}
        canEdit={canEditUsers(session.user.role)}
        canDelete={canDeleteUsers(session.user.role)}
      />
    </main>
  );
}
