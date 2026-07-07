const defaultActivities = [
  { time: "10:30 AM", user: "System", task: "Dashboard loaded" },
];

interface Activity {
  time: string;
  user: string;
  task: string;
}

interface Props {
  activities?: Activity[];
}

export default function ActivityTimeline({ activities = defaultActivities }: Props) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
      <div className="flex justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">
          Activity Timeline
        </h2>

        <button className="text-cyan-400 text-sm hover:text-cyan-300">
          View All
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto flex-1">
        {activities.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="text-xs text-slate-500 w-20 shrink-0">
              {item.time}
            </div>

            <div className="w-3 h-3 mt-1 rounded-full bg-cyan-400 shrink-0"></div>

            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium">
                {item.user}
              </p>

              <p className="text-slate-400 text-sm truncate">
                {item.task}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
