"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataSync } from "@/lib/live-sync";
import * as XLSX from "xlsx";
import { FeedbackMessage } from "@/components/ui/feedback-message";

type ProjectOption = { id: string; code: string; name: string; status: string };

type ReportType =
  | "project-progress"
  | "shot-status-summary"
  | "artist-workload"
  | "department-progress"
  | "time-log"
  | "task-completion";

const DEFAULT_TO_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_FROM_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function toQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });
  return search.toString();
}

function formatDate(value: string) {
  return new Date(value).toISOString().split("T")[0];
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const line = headers
      .map((header) => {
        const value = row[header];
        const safe = String(value ?? "").replace(/"/g, '""');
        return `"${safe}"`;
      })
      .join(",");
    lines.push(line);
  }

  return lines.join("\n");
}

export default function ReportsDashboard() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [from, setFrom] = useState(DEFAULT_FROM_DATE);
  const [to, setTo] = useState(DEFAULT_TO_DATE);

  const [projectProgress, setProjectProgress] = useState<Array<Record<string, unknown>>>([]);
  const [shotStatusSummary, setShotStatusSummary] = useState<Array<Record<string, unknown>>>([]);
  const [artistWorkload, setArtistWorkload] = useState<Array<Record<string, unknown>>>([]);
  const [departmentProgress, setDepartmentProgress] = useState<Array<Record<string, unknown>>>([]);
  const [timeLogReport, setTimeLogReport] = useState<{ totalHours: number; entryCount: number; entries: Array<Record<string, unknown>> } | null>(null);
  const [taskCompletion, setTaskCompletion] = useState<{ totalTasks: number; completedTasks: number; completionPercent: number; breakdown: Array<Record<string, unknown>> } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "ACTIVE"),
    [projects]
  );

  const loadProjects = useCallback(async () => {
    const response = await fetch("/api/projects?activeOnly=true", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load projects");
    }
    const data = (await response.json()) as ProjectOption[];
    setProjects(data);
  }, []);

  const fetchReport = useCallback(async (type: ReportType) => {
    const query = toQuery({
      type,
      projectId: projectId || undefined,
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });

    const response = await fetch(`/api/reports?${query}`, { cache: "no-store" });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? `Failed to load ${type}`);
    }

    return response.json();
  }, [projectId, from, to]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectProgressData, shotStatusData, artistWorkloadData, departmentProgressData, timeLogData, taskCompletionData] =
        await Promise.all([
          fetchReport("project-progress"),
          fetchReport("shot-status-summary"),
          fetchReport("artist-workload"),
          fetchReport("department-progress"),
          fetchReport("time-log"),
          fetchReport("task-completion"),
        ]);

      setProjectProgress(projectProgressData as Array<Record<string, unknown>>);
      setShotStatusSummary(shotStatusData as Array<Record<string, unknown>>);
      setArtistWorkload(artistWorkloadData as Array<Record<string, unknown>>);
      setDepartmentProgress(departmentProgressData as Array<Record<string, unknown>>);
      setTimeLogReport(timeLogData as { totalHours: number; entryCount: number; entries: Array<Record<string, unknown>> });
      setTaskCompletion(taskCompletionData as { totalTasks: number; completedTasks: number; completionPercent: number; breakdown: Array<Record<string, unknown>> });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, [fetchReport]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadReports();
    }, 30000);

    const unsubscribe = subscribeDataSync(() => {
      void loadReports();
    });

    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [loadReports]);

  function exportCsv() {
    const mergedRows = [
      ...projectProgress.map((row) => ({ section: "project-progress", ...row })),
      ...shotStatusSummary.map((row) => ({ section: "shot-status-summary", ...row })),
      ...artistWorkload.map((row) => ({ section: "artist-workload", ...row })),
      ...departmentProgress.map((row) => ({ section: "department-progress", ...row })),
      ...(timeLogReport?.entries ?? []).map((row) => ({ section: "time-log", ...row })),
      ...((taskCompletion?.breakdown ?? []).map((row) => ({ section: "task-completion", ...row })) as Array<Record<string, unknown>>),
    ];

    downloadText("reports-export.csv", toCsv(mergedRows), "text/csv;charset=utf-8");
  }

  function exportExcelLike() {
    const workbook = XLSX.utils.book_new();

    const projectSheet = XLSX.utils.json_to_sheet(projectProgress);
    XLSX.utils.book_append_sheet(workbook, projectSheet, "Project Progress");

    const shotStatusSheet = XLSX.utils.json_to_sheet(shotStatusSummary);
    XLSX.utils.book_append_sheet(workbook, shotStatusSheet, "Shot Status");

    const artistSheet = XLSX.utils.json_to_sheet(artistWorkload);
    XLSX.utils.book_append_sheet(workbook, artistSheet, "Artist Workload");

    const departmentSheet = XLSX.utils.json_to_sheet(departmentProgress);
    XLSX.utils.book_append_sheet(workbook, departmentSheet, "Department Progress");

    const timeLogSheet = XLSX.utils.json_to_sheet(timeLogReport?.entries ?? []);
    XLSX.utils.book_append_sheet(workbook, timeLogSheet, "Time Logs");

    const taskSheet = XLSX.utils.json_to_sheet(taskCompletion?.breakdown ?? []);
    XLSX.utils.book_append_sheet(workbook, taskSheet, "Task Completion");

    XLSX.writeFile(workbook, "reports-export.xlsx");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          >
            <option value="">All active projects</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:border-slate-500"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportExcelLike}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {loading ? <FeedbackMessage variant="info" message="Loading reports..." /> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Project Progress</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {projectProgress.map((row, index) => (
              <p key={`project-progress-${index}`}>
                {String(row.projectCode)}: {Number(row.progressPercent ?? 0).toFixed(1)}% ({String(row.completedShots)}/{String(row.totalShots)})
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Shot Status Summary</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {shotStatusSummary.map((row, index) => (
              <p key={`shot-status-${index}`}>
                {String(row.status)}: {String((row as { _count?: { _all?: number } })._count?._all ?? 0)}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Artist Workload</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {artistWorkload.map((row, index) => (
              <p key={`artist-load-${index}`}>
                {String(row.artistName)} ({String(row.department)}): {Number(row.hoursLogged ?? 0).toFixed(1)}h, open {String(row.openTasks)}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Department Progress</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {departmentProgress.map((row, index) => (
              <p key={`department-progress-${index}`}>
                {String(row.department)}: {Number(row.progressPercent ?? 0).toFixed(1)}%
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Time Log Reports</h2>
        <p className="text-sm text-slate-300">
          Total Hours: {timeLogReport ? timeLogReport.totalHours.toFixed(2) : "0.00"} | Entries: {timeLogReport?.entryCount ?? 0}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Artist</th>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Hours</th>
              </tr>
            </thead>
            <tbody>
              {(timeLogReport?.entries ?? []).slice(0, 15).map((row, index) => (
                <tr key={`timelog-${index}`} className="border-t border-slate-800">
                  <td className="px-3 py-2">{formatDate(String(row.date))}</td>
                  <td className="px-3 py-2">{String(row.projectCode)}</td>
                  <td className="px-3 py-2">{String(row.artistName)}</td>
                  <td className="px-3 py-2">{String(row.taskName)}</td>
                  <td className="px-3 py-2">{String(row.status)}</td>
                  <td className="px-3 py-2">{Number(row.hours ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Task Completion Statistics</h2>
        <p className="text-sm text-slate-300">
          Completed: {taskCompletion?.completedTasks ?? 0}/{taskCompletion?.totalTasks ?? 0} ({Number(taskCompletion?.completionPercent ?? 0).toFixed(1)}%)
        </p>
        <div className="mt-2 space-y-1 text-sm text-slate-300">
          {(taskCompletion?.breakdown ?? []).map((row, index) => (
            <p key={`task-breakdown-${index}`}>
              {String(row.status)}: {String((row as { _count?: { _all?: number } })._count?._all ?? 0)}
            </p>
          ))}
        </div>
      </section>
    </section>
  );
}
