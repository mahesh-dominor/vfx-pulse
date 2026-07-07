import TopNav from "@/components/layout/TopNav";
import LiveDashboard from "@/components/dashboard/LiveDashboard";
import { getDashboardDataAction } from "@/features/dashboard/actions/get-dashboard-data";
import { redirect } from "next/navigation";
import type { DashboardData } from "@/types/dashboard";

const EMPTY_DASHBOARD_DATA: DashboardData = {
  kpis: {
    totalProjects: 0,
    activeProjects: 0,
    totalShots: 0,
    openShots: 0,
    completedShots: 0,
    artistCount: 0,
    taskOpen: 0,
    taskInProgress: 0,
    taskCompleted: 0,
    timeLogHours: 0,
    productionProgressPercent: 0,
    artistsLoggedIn: 0,
    updatesSubmitted: 0,
    hoursLogged: 0,
    shotsUpdated: 0,
    missingUpdates: 0,
  },
  recentActivity: [],
  assignedShots: [],
  todaysWork: [],
  notifications: [],
  quickActions: [],
};

export default async function Dashboard() {
  let dashboardData = EMPTY_DASHBOARD_DATA;

  try {
    dashboardData = await getDashboardDataAction();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
  }

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