import type { AssignedShotItem } from "@/types/dashboard";

type AssignedShotsCardProps = {
  shots: AssignedShotItem[];
};

export default function AssignedShotsCard({ shots }: AssignedShotsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Assigned Shots</h2>

      <div className="space-y-3">
        {shots.length === 0 ? (
          <p className="text-sm text-slate-400">No assigned shots found.</p>
        ) : (
          shots.map((shot) => (
            <div
              key={shot.id}
              className="rounded-lg border border-slate-800 bg-[#0E1625] p-3"
            >
              <p className="text-sm font-medium text-slate-100">{shot.code}</p>
              <p className="text-xs text-slate-400">{shot.projectName}</p>
              <p className="mt-1 text-xs text-slate-300">
                {shot.status}
                {shot.dueDate ? ` • Due ${shot.dueDate}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
