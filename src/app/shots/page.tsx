import TopNav from "@/components/layout/TopNav";
import ShotsManagementNew from "@/components/shots/ShotsManagementNew";

export const dynamic = "force-dynamic";

export default function ShotsPage() {

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Shots</h1>
      <ShotsManagementNew />
    </main>
  );
}
