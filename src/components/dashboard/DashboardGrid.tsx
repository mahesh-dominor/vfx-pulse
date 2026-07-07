import { Users, ClipboardCheck, Clock3, Film, AlertTriangle } from "lucide-react";
import StatCard from "@/components/cards/StatCard";
import ActivityTimeline from "./ActivityTimeline";
import AssignedShotsCard from "./AssignedShotsCard";
import TodaysWorkCard from "./TodaysWorkCard";
import NotificationsCard from "./NotificationsCard";
import QuickActionsCard from "./QuickActionsCard";

import type { DashboardData } from "@/types/dashboard";

type DashboardGridProps = {
  data: DashboardData;
};

export default function DashboardGrid({ data }: DashboardGridProps) {
  const { kpis } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Projects"
          value={kpis.totalProjects.toString()}
          subtitle={`Active ${kpis.activeProjects}`}
          icon={<Film className="text-white" size={28} />}
          iconBg="bg-sky-600"
        />

        <StatCard
          title="Total Shots"
          value={kpis.totalShots.toString()}
          subtitle={`Open ${kpis.openShots} / Completed ${kpis.completedShots}`}
          icon={<Film className="text-white" size={28} />}
          iconBg="bg-indigo-600"
        />

        <StatCard
          title="Artists"
          value={kpis.artistCount.toString()}
          subtitle={`Logged in today ${kpis.artistsLoggedIn}`}
          icon={<Users className="text-white" size={28} />}
          iconBg="bg-blue-600"
        />

        <StatCard
          title="Task Status"
          value={kpis.taskInProgress.toString()}
          subtitle={`Open ${kpis.taskOpen} / Completed ${kpis.taskCompleted}`}
          icon={<ClipboardCheck className="text-white" size={28} />}
          iconBg="bg-amber-600"
        />

        <StatCard
          title="Production Progress"
          value={`${kpis.productionProgressPercent.toFixed(1)}%`}
          subtitle={`Time Logs ${kpis.timeLogHours.toFixed(1)}h`}
          icon={<Clock3 className="text-white" size={28} />}
          iconBg="bg-emerald-600"
        />

        <StatCard
          title="Artists Logged In"
          value={kpis.artistsLoggedIn.toString()}
          subtitle="Active Today"
          icon={<Users className="text-white" size={28} />}
          iconBg="bg-blue-600"
        />

        <StatCard
          title="Updates Submitted"
          value={kpis.updatesSubmitted.toString()}
          subtitle="Today"
          icon={<ClipboardCheck className="text-white" size={28} />}
          iconBg="bg-green-600"
        />

        <StatCard
          title="Hours Logged"
          value={kpis.hoursLogged.toFixed(1)}
          subtitle="Total Hours"
          icon={<Clock3 className="text-white" size={28} />}
          iconBg="bg-violet-600"
        />

        <StatCard
          title="Shots Updated"
          value={kpis.shotsUpdated.toString()}
          subtitle="Completed"
          icon={<Film className="text-white" size={28} />}
          iconBg="bg-orange-500"
        />

        <StatCard
          title="Missing Updates"
          value={kpis.missingUpdates.toString()}
          subtitle="Needs Attention"
          icon={<AlertTriangle className="text-white" size={28} />}
          iconBg="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityTimeline activities={data.recentActivity.map((item) => ({
          time: item.time,
          user: item.user,
          task: item.task,
        }))} />
        <AssignedShotsCard shots={data.assignedShots} />
        <TodaysWorkCard workItems={data.todaysWork} />
        <NotificationsCard notifications={data.notifications} />
      </div>

      <QuickActionsCard actions={data.quickActions} />
    </div>
  );
}
