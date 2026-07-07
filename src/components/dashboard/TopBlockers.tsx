const blockers = [
  ["Waiting for Client Feedback", 12],
  ["Waiting for Renders", 8],
  ["Missing Plates / Assets", 6],
  ["Technical Issue", 3],
];

export default function TopBlockers() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
      <div className="flex justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">
          Top Blockers
        </h2>

        <button className="text-cyan-400 text-sm hover:text-cyan-300">
          View All
        </button>
      </div>

      <div className="space-y-5 flex-1">
        {blockers.map(([name, count]) => (
          <div key={name} className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">{name}</span>
            <span className="text-red-400 font-semibold">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
