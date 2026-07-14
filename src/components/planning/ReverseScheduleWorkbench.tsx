"use client";

import { useEffect, useMemo, useState } from "react";

import { FeedbackMessage } from "@/components/ui/feedback-message";
import type {
  PipelineStepInput,
  ReverseScheduleResult,
} from "@/types/planning";

type ReverseScheduleWorkbenchProps = {
  initialSchedule: ReverseScheduleResult;
  initialFinalDeliveryDate: string;
  initialIncludeWeekends: boolean;
  initialHolidays: string[];
  initialSteps: PipelineStepInput[];
  selectedProject: {
    id: string;
    name: string;
  } | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMELINE_COLORS = [
  "bg-sky-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-fuchsia-500",
] as const;

function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function normalizeHolidayInput(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.includes("T") ? value : `${value}T00:00:00.000Z`));
}

function parseDateOnly(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export default function ReverseScheduleWorkbench({
  initialSchedule,
  initialFinalDeliveryDate,
  initialIncludeWeekends,
  initialHolidays,
  initialSteps,
  selectedProject,
}: ReverseScheduleWorkbenchProps) {
  const [finalDeliveryDateInput, setFinalDeliveryDateInput] = useState(toDateInputValue(initialFinalDeliveryDate));
  const [includeWeekends, setIncludeWeekends] = useState(initialIncludeWeekends);
  const [holidaysInput, setHolidaysInput] = useState(
    initialHolidays
      .map((holiday) => toDateInputValue(holiday))
      .join(", ")
  );
  const [steps, setSteps] = useState<PipelineStepInput[]>(initialSteps);
  const [schedule, setSchedule] = useState<ReverseScheduleResult>(initialSchedule);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const requestPayload = useMemo(() => {
    const finalDeliveryDate = `${finalDeliveryDateInput}T00:00:00.000Z`;

    return {
      finalDeliveryDate,
      includeWeekends,
      holidays: normalizeHolidayInput(holidaysInput),
      steps,
    };
  }, [finalDeliveryDateInput, holidaysInput, includeWeekends, steps]);

  const timelineRows = useMemo(() => {
    if (schedule.milestones.length === 0) {
      return {
        totalDays: 1,
        rows: [] as Array<{
          key: string;
          name: string;
          startDate: string;
          endDate: string;
          offsetPercent: number;
          widthPercent: number;
          colorClass: string;
        }>,
      };
    }

    const starts = schedule.milestones.map((milestone) => parseDateOnly(milestone.startDate).getTime());
    const ends = schedule.milestones.map((milestone) => parseDateOnly(milestone.endDate).getTime());

    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const totalDays = Math.max(Math.round((maxEnd - minStart) / DAY_MS) + 1, 1);

    return {
      totalDays,
      rows: schedule.milestones.map((milestone, index) => {
        const startTs = parseDateOnly(milestone.startDate).getTime();
        const endTs = parseDateOnly(milestone.endDate).getTime();
        const offsetDays = Math.max(Math.round((startTs - minStart) / DAY_MS), 0);
        const spanDays = Math.max(Math.round((endTs - startTs) / DAY_MS) + 1, 1);

        return {
          key: `${milestone.code}-${milestone.startDate}-${milestone.endDate}`,
          name: milestone.name,
          startDate: milestone.startDate,
          endDate: milestone.endDate,
          offsetPercent: (offsetDays / totalDays) * 100,
          widthPercent: (spanDays / totalDays) * 100,
          colorClass: TIMELINE_COLORS[index % TIMELINE_COLORS.length],
        };
      }),
    };
  }, [schedule.milestones]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setIsRecalculating(true);

        const response = await fetch("/api/planning/reverse-schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to recalculate schedule");
        }

        const data = (await response.json()) as ReverseScheduleResult;
        setSchedule(data);
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to recalculate schedule");
      } finally {
        setIsRecalculating(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [requestPayload]);

  async function saveCurrentSnapshot() {
    if (!selectedProject) {
      return;
    }

    try {
      setIsSaving(true);
      setSuccess(null);

      const response = await fetch("/api/planning/snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          name: `${selectedProject.name} plan ${new Date().toISOString().slice(0, 10)}`,
          notes: "Saved from reverse schedule workbench.",
          finalDeliveryDate: requestPayload.finalDeliveryDate,
          includeWeekends: requestPayload.includeWeekends,
          holidays: requestPayload.holidays,
          steps: requestPayload.steps,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to save snapshot");
      }

      setSuccess("Snapshot saved. Refreshing plan history...");
      window.location.reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save snapshot");
    } finally {
      setIsSaving(false);
    }
  }

  function updateStep(index: number, key: keyof PipelineStepInput, value: string) {
    setSteps((current) =>
      current.map((step, currentIndex) => {
        if (currentIndex !== index) {
          return step;
        }

        if (key === "durationDays" || key === "bufferDays") {
          const parsed = Number(value);
          return {
            ...step,
            [key]: Number.isFinite(parsed) ? Math.max(Math.round(parsed), 0) : 0,
          };
        }

        return {
          ...step,
          [key]: key === "parallelGroup" && value.trim() === "" ? undefined : value,
        };
      })
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Reverse Production Schedule</h2>
        <div className="text-sm text-slate-300">
          Pipeline start <span className="font-semibold text-white">{schedule.pipelineStartDate}</span>
          {"  ->  "}
          Final delivery <span className="font-semibold text-white">{schedule.finalDeliveryDate}</span>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-3 mb-4">
        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Final Delivery Date</span>
          <input
            type="date"
            value={finalDeliveryDateInput}
            onChange={(event) => setFinalDeliveryDateInput(event.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Studio Holidays</span>
          <input
            type="text"
            value={holidaysInput}
            onChange={(event) => setHolidaysInput(event.target.value)}
            placeholder="2026-12-25, 2027-01-01"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeWeekends}
            onChange={(event) => setIncludeWeekends(event.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
          />
          Include weekends in schedule calculation
        </label>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} className="mb-3" /> : null}
      {success ? <FeedbackMessage variant="success" message={success} className="mb-3" /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={saveCurrentSnapshot}
          disabled={!selectedProject || isSaving}
        >
          {isSaving ? "Saving..." : "Save Current Snapshot"}
        </button>
        <span className="self-center text-xs text-slate-400">
          {isRecalculating ? "Recalculating milestones..." : "Milestones update automatically on changes."}
        </span>
      </div>

      <div className="overflow-auto mb-4">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-3 py-2 font-medium">Step</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Duration (days)</th>
              <th className="px-3 py-2 font-medium">Buffer (days)</th>
              <th className="px-3 py-2 font-medium">Parallel Group</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={`${step.code}-${index}`} className="border-b border-slate-900 text-slate-200">
                <td className="px-3 py-2">
                  <input
                    value={step.name}
                    onChange={(event) => updateStep(index, "name", event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white outline-none focus:border-sky-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={step.code}
                    onChange={(event) => updateStep(index, "code", event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white outline-none focus:border-sky-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={step.durationDays}
                    onChange={(event) => updateStep(index, "durationDays", event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white outline-none focus:border-sky-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={step.bufferDays}
                    onChange={(event) => updateStep(index, "bufferDays", event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white outline-none focus:border-sky-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={step.parallelGroup ?? ""}
                    onChange={(event) => updateStep(index, "parallelGroup", event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white outline-none focus:border-sky-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Timeline Preview</h3>
          <span className="text-xs text-slate-400">{timelineRows.totalDays} day span</span>
        </div>

        <div className="space-y-2">
          {timelineRows.rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[140px_1fr_150px] items-center gap-3">
              <span className="truncate text-xs text-slate-300">{row.name}</span>
              <div className="h-3 rounded-full bg-slate-800">
                <div
                  className={`h-3 rounded-full ${row.colorClass}`}
                  style={{
                    marginLeft: `${row.offsetPercent}%`,
                    width: `${Math.max(row.widthPercent, 1)}%`,
                  }}
                />
              </div>
              <span className="text-right text-xs text-slate-400">
                {row.startDate} to {row.endDate}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Start</th>
              <th className="px-3 py-2 font-medium">End</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              <th className="px-3 py-2 font-medium">Buffer</th>
              <th className="px-3 py-2 font-medium">Parallel Group</th>
            </tr>
          </thead>
          <tbody>
            {schedule.milestones.map((item) => (
              <tr key={`${item.code}-${item.startDate}-${item.endDate}`} className="border-b border-slate-900 text-slate-200">
                <td className="px-3 py-2 font-medium text-white">{item.name}</td>
                <td className="px-3 py-2">{item.startDate}</td>
                <td className="px-3 py-2">{item.endDate}</td>
                <td className="px-3 py-2">{item.durationDays}d</td>
                <td className="px-3 py-2">{item.bufferDays}d</td>
                <td className="px-3 py-2">{item.parallelGroup ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
