const blockers = [
  ["Waiting for Client Feedback", 12],
  ["Waiting for Renders", 8],
  ["Missing Plates / Assets", 6],
  ["Technical Issue", 3],
];

export default function TopBlockers() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full">

      <div className="flex justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">
          Top Blockers
        </h2>

        <button className="text-cyan-400 text-sm">
          View All
        </button>
      </div>

      <div className="space-y-5">

        {blockers.map(([name, count]) => (
          <div key={name} className="flex justify-between">

            <span className="text-slate-300">
              {name}
            </span>

            <span className="text-white font-semibold">
              {count}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}