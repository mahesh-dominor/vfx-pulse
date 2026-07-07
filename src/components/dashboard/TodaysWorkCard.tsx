import type { TodayWorkItem } from "@/types/dashboard";

type TodaysWorkCardProps = {
  workItems: TodayWorkItem[];
};

export default function TodaysWorkCard({ workItems }: TodaysWorkCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Today&apos;s Work</h2>

      <div className="space-y-3">
        {workItems.length === 0 ? (
          <p className="text-sm text-slate-400">No updates submitted today.</p>
        ) : (
          workItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0E1625] p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-100">{item.shotCode}</p>
                <p className="text-xs text-slate-400">{item.taskType}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-100">{item.hoursWorked.toFixed(1)}h</p>
                <p className="text-xs text-slate-400">{item.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
