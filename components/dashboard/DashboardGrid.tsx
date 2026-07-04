import StatCard from "@/components/cards/StatCard";
import DepartmentOverview from "./DepartmentOverview";
import ProjectProgress from "./ProjectProgress";
import MissingUpdates from "./MissingUpdates";
import ActivityTimeline from "./ActivityTimeline";
import HoursTrend from "./HoursTrend";
import TopBlockers from "./TopBlockers";

import {
  Users,
  ClipboardCheck,
  Clock3,
  Film,
  AlertTriangle,
} from "lucide-react";

export default function DashboardGrid() {
  return (
    <div className="space-y-8">

      {/* KPI CARDS */}

      <div className="grid grid-cols-5 gap-6">

        <StatCard
          title="Artists Logged In"
          value="42"
          subtitle="87% of Team"
          icon={<Users className="text-white" size={28} />}
          iconBg="bg-blue-600"
        />

        <StatCard
          title="Updates Submitted"
          value="38"
          subtitle="79% Completed"
          icon={<ClipboardCheck className="text-white" size={28} />}
          iconBg="bg-green-600"
        />

        <StatCard
          title="Hours Logged"
          value="312.5"
          subtitle="+8% vs Yesterday"
          icon={<Clock3 className="text-white" size={28} />}
          iconBg="bg-violet-600"
        />

        <StatCard
          title="Shots Updated"
          value="128"
          subtitle="+12 Today"
          icon={<Film className="text-white" size={28} />}
          iconBg="bg-orange-500"
        />

        <StatCard
          title="Missing Updates"
          value="4"
          subtitle="Needs Attention"
          icon={<AlertTriangle className="text-white" size={28} />}
          iconBg="bg-red-600"
        />

      </div>

      {/* DASHBOARD GRID */}

      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-4 h-80">
     <DepartmentOverview />
     </div>

        <div className="col-span-4 h-80">
        <ProjectProgress />
        </div>

        <div className="col-span-4 h-80">
        <MissingUpdates />
        </div>

        <div className="col-span-4 h-80">
        <ActivityTimeline />
        </div>

        <div className="col-span-4 h-80">
        <HoursTrend />
        </div>

        <div className="col-span-4 h-80">
        <TopBlockers />
        </div>

      </div>

    </div>
  );
}