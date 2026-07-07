import TopNav from "@/components/layout/TopNav";
import LiveDashboard from "@/components/dashboard/LiveDashboard";
import { getDashboardDataAction } from "@/features/dashboard/actions/get-dashboard-data";

export default async function Dashboard() {
  const dashboardData = await getDashboardDataAction();

  return (
    <main className="flex-1 p-8 bg-[#070B14] min-h-screen">
      <TopNav />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Dashboard
        </h1>

        <p className="text-slate-400 mt-2">
          Overview of today&apos;s production activity
        </p>
      </div>
      <LiveDashboard initialData={dashboardData} />
    </main>
  );
}