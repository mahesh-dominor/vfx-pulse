import { redirect } from "next/navigation";

import { auth } from "@/auth";
import TopNav from "@/components/layout/TopNav";
import ReverseScheduleWorkbench from "@/components/planning/ReverseScheduleWorkbench";
import { DEFAULT_VFX_PIPELINE } from "@/constants/production-pipeline";
import { projectService } from "@/services/project.service";
import { productionPlanningService } from "@/services/production-planning.service";

function riskClasses(risk: "ON_TRACK" | "AT_RISK" | "BLOCKED"): string {
  if (risk === "ON_TRACK") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  }

  if (risk === "AT_RISK") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/40";
  }

  return "bg-red-500/15 text-red-300 border border-red-500/40";
}

export default async function PlanningPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await projectService.listProjects({ activeOnly: true });
  const selectedProjectId = projects[0]?.id;
  const selectedProject = projects[0] ?? null;
  const latestDelivery = projects
    .map((project) => project.deliveryDate)
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  const finalDeliveryDate = latestDelivery ?? "2030-01-31T00:00:00.000Z";

  const reverseSchedule = productionPlanningService.calculateReverseSchedule({
    finalDeliveryDate,
    includeWeekends: false,
    holidays: [],
    steps: [...DEFAULT_VFX_PIPELINE],
  });

  const capacity = await productionPlanningService.getDepartmentCapacityForecast({ targetDays: 8 });
  const snapshots = selectedProjectId
    ? await productionPlanningService.listPlanningSnapshots({ projectId: selectedProjectId, limit: 6 })
    : [];
  const capacityGeneratedAt = new Date(capacity.generatedAt).toLocaleString();
  const snapshotRows = snapshots.map((snapshot) => ({
    ...snapshot,
    pipelineStart: snapshot.pipelineStartDate.slice(0, 10),
    finalDelivery: snapshot.finalDeliveryDate.slice(0, 10),
    createdAtLabel: new Date(snapshot.createdAt).toLocaleString(),
  }));

  return (
    <main className="flex-1 min-h-screen bg-[#070B14] p-8">
      <TopNav />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Production Planning</h1>
        <p className="mt-2 text-slate-400">
          Reverse schedule milestones and capacity forecast from final delivery backward.
        </p>
      </div>

      <ReverseScheduleWorkbench
        initialSchedule={reverseSchedule}
        initialFinalDeliveryDate={finalDeliveryDate}
        initialIncludeWeekends={false}
        initialHolidays={[]}
        initialSteps={[...DEFAULT_VFX_PIPELINE]}
        selectedProject={selectedProject ? { id: selectedProject.id, name: selectedProject.name } : null}
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Saved Plan Snapshots</h2>
          <p className="text-sm text-slate-400">
            {selectedProject ? `Project ${selectedProject.name}` : "No active project selected"}
          </p>
        </div>

        {snapshots.length === 0 ? (
          <p className="text-sm text-slate-400">
            No plan snapshots saved yet. Use POST /api/planning/snapshots to save reverse schedules.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Snapshot</th>
                  <th className="px-3 py-2 font-medium">Pipeline Start</th>
                  <th className="px-3 py-2 font-medium">Final Delivery</th>
                  <th className="px-3 py-2 font-medium">Created By</th>
                  <th className="px-3 py-2 font-medium">Milestones</th>
                  <th className="px-3 py-2 font-medium">Created At</th>
                </tr>
              </thead>
              <tbody>
                {snapshotRows.map((snapshot) => (
                  <tr key={snapshot.id} className="border-b border-slate-900 text-slate-200">
                    <td className="px-3 py-2 font-medium text-white">{snapshot.name}</td>
                    <td className="px-3 py-2">{snapshot.pipelineStart}</td>
                    <td className="px-3 py-2">{snapshot.finalDelivery}</td>
                    <td className="px-3 py-2">{snapshot.createdBy.name}</td>
                    <td className="px-3 py-2">{snapshot.milestones.length}</td>
                    <td className="px-3 py-2">{snapshot.createdAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Department Capacity Forecast</h2>
          <p className="text-sm text-slate-400">Generated at {capacityGeneratedAt}</p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Pending Hours</th>
                <th className="px-3 py-2 font-medium">In Progress</th>
                <th className="px-3 py-2 font-medium">Artists</th>
                <th className="px-3 py-2 font-medium">Leave Hours</th>
                <th className="px-3 py-2 font-medium">Effective Artists</th>
                <th className="px-3 py-2 font-medium">Capacity/Day</th>
                <th className="px-3 py-2 font-medium">Forecast Days</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Additional Needed</th>
                <th className="px-3 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {capacity.items.map((item) => (
                <tr key={item.department} className="border-b border-slate-900 text-slate-200">
                  <td className="px-3 py-2 font-medium text-white">{item.department}</td>
                  <td className="px-3 py-2">{item.pendingHours.toFixed(1)}h</td>
                  <td className="px-3 py-2">{item.inProgressHours.toFixed(1)}h</td>
                  <td className="px-3 py-2">{item.availableArtists}</td>
                  <td className="px-3 py-2">{item.leaveHoursInWindow.toFixed(1)}h</td>
                  <td className="px-3 py-2">{item.effectiveArtists.toFixed(2)}</td>
                  <td className="px-3 py-2">{item.capacityHoursPerDay.toFixed(1)}h</td>
                  <td className="px-3 py-2">{item.forecastFinishDays}</td>
                  <td className="px-3 py-2">{item.targetDays}d</td>
                  <td className="px-3 py-2">{item.requiredAdditionalArtists}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${riskClasses(item.risk)}`}>
                      {item.risk.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
