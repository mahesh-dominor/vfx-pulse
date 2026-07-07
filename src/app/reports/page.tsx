import ReportsDashboard from "@/components/reports/ReportsDashboard";
import TopNav from "@/components/layout/TopNav";

export default function ReportsPage() {

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Reports</h1>
      <ReportsDashboard />
    </main>
  );
}
