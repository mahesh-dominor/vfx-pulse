import ShotTasksManagement from "@/components/shot-tasks/ShotTasksManagement";
import TopNav from "@/components/layout/TopNav";

export const dynamic = "force-dynamic";

export default function ShotTasksPage() {
  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Shot Tasks</h1>
      <ShotTasksManagement />
    </main>
  );
}
