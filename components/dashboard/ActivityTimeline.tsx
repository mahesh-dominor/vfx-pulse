const activities = [
  { time: "10:30 AM", user: "Mahesh R", task: "Updated CADS2_208_024A_010" },
  { time: "10:15 AM", user: "Pooja", task: "Completed HEDA_1040" },
  { time: "09:50 AM", user: "Amit", task: "Submitted SWAG_020_0010" },
  { time: "09:10 AM", user: "Rahul", task: "Logged 8 Hours" },
];

export default function ActivityTimeline() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full">
      <div className="flex justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">
          Activity Timeline
        </h2>

        <button className="text-cyan-400 text-sm">
          View All
        </button>
      </div>

      <div className="space-y-5">
        {activities.map((item, index) => (
          <div key={index} className="flex gap-4">

            <div className="text-xs text-slate-500 w-20">
              {item.time}
            </div>

            <div className="w-3 h-3 mt-1 rounded-full bg-cyan-400"></div>

            <div>
              <p className="text-white text-sm">
                {item.user}
              </p>

              <p className="text-slate-400 text-sm">
                {item.task}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}