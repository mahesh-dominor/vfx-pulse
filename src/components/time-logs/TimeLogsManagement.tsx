"use client";

import { useEffect, useMemo, useState } from "react";
import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { pendingCrudLabel } from "@/components/ui/async-action-label";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";

type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "REVIEW" | "COMPLETED";

type ProjectItem = { id: string; code: string; name: string };
type ShotItem = { id: string; code: string | null; shotName: string; projectId: string };
type ArtistItem = { id: string; fullName: string };
type TaskItem = {
  id: string;
  projectId: string;
  shotId: string;
  taskName: string;
};

type TimeLogItem = {
  id: string;
  logDate: string;
  artistId: string;
  projectId: string;
  shotId: string;
  taskId: string;
  activity: string;
  minutesSpent: number;
  status: TaskStatus;
  notes: string | null;
  artist: { id: string; fullName: string };
  project: { id: string; code: string; name: string };
  shot: { id: string; code: string | null; shotName: string };
  task: { id: string; taskName: string };
};

type DashboardData = {
  remainingEstimatedHours: number;
};

type TimeLogForm = {
  logDate: string;
  projectId: string;
  shotId: string;
  taskId: string;
  artistId: string;
  activity: string;
  minutesSpent: string;
  status: TaskStatus;
  notes: string;
};

const statusOptions: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "REVIEW",
  "COMPLETED",
];

const defaultForm: TimeLogForm = {
  logDate: new Date().toISOString().slice(0, 10),
  projectId: "",
  shotId: "",
  taskId: "",
  artistId: "",
  activity: "",
  minutesSpent: "",
  status: "IN_PROGRESS",
  notes: "",
};

export default function TimeLogsManagement() {
  const [logs, setLogs] = useState<TimeLogItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<TimeLogForm>(defaultForm);

  const editingLog = useMemo(
    () => logs.find((log) => log.id === editingId) ?? null,
    [logs, editingId]
  );

  const shotOptions = useMemo(
    () => shots.filter((shot) => !form.projectId || shot.projectId === form.projectId),
    [shots, form.projectId]
  );

  const taskOptions = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!form.projectId || task.projectId === form.projectId) &&
          (!form.shotId || task.shotId === form.shotId)
      ),
    [tasks, form.projectId, form.shotId]
  );

  useEffect(() => {
    void loadData();

    const unsubscribe = subscribeDataSync(() => {
      void loadData();
    });

    return unsubscribe;
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [logsRes, projectsRes, shotsRes, artistsRes, tasksRes, dashboardRes] =
        await Promise.all([
          fetch("/api/time-logs", { cache: "no-store" }),
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/shots", { cache: "no-store" }),
          fetch("/api/artists", { cache: "no-store" }),
          fetch("/api/shot-tasks", { cache: "no-store" }),
          fetch("/api/time-logs/dashboard?period=weekly", { cache: "no-store" }),
        ]);

      if (
        !logsRes.ok ||
        !projectsRes.ok ||
        !shotsRes.ok ||
        !artistsRes.ok ||
        !tasksRes.ok ||
        !dashboardRes.ok
      ) {
        throw new Error("Failed to load time log management data");
      }

      const [logsData, projectsData, shotsData, artistsData, tasksData, dashboardData] =
        (await Promise.all([
          logsRes.json(),
          projectsRes.json(),
          shotsRes.json(),
          artistsRes.json(),
          tasksRes.json(),
          dashboardRes.json(),
        ])) as [
          TimeLogItem[],
          ProjectItem[],
          ShotItem[],
          ArtistItem[],
          TaskItem[],
          DashboardData
        ];

      setLogs(logsData);
      setProjects(projectsData.map((project) => ({ id: project.id, code: project.code, name: project.name })));
      setShots(shotsData.map((shot) => ({
        id: shot.id,
        code: shot.code,
        shotName: shot.shotName,
        projectId: shot.projectId,
      })));
      setArtists(artistsData.map((artist) => ({ id: artist.id, fullName: artist.fullName })));
      setTasks(tasksData.map((task) => ({
        id: task.id,
        taskName: task.taskName,
        projectId: task.projectId,
        shotId: task.shotId,
      })));
      setDashboard(dashboardData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load time log management data");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  }

  function openEditModal(log: TimeLogItem) {
    setEditingId(log.id);
    setForm({
      logDate: log.logDate.slice(0, 10),
      projectId: log.projectId,
      shotId: log.shotId,
      taskId: log.taskId,
      artistId: log.artistId,
      activity: log.activity,
      minutesSpent: String(log.minutesSpent),
      status: log.status,
      notes: log.notes ?? "",
    });
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function saveLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      logDate: new Date(form.logDate).toISOString(),
      projectId: form.projectId,
      shotId: form.shotId,
      taskId: form.taskId,
      artistId: form.artistId,
      activity: form.activity.trim(),
      minutesSpent: Number(form.minutesSpent),
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/time-logs/${editingId}` : "/api/time-logs";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save time log");
      }

      await loadData();
      emitDataSync("time-logs");
      closeFormModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save time log");
    } finally {
      setSaving(false);
    }
  }

  async function removeLog() {
    if (!deletingId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/time-logs/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove time log");
      }

      setDeletingId(null);
      await loadData();
      emitDataSync("time-logs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove time log");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-slate-200">
          <p className="text-sm text-slate-400">Weekly Remaining Estimated Hours</p>
          <p className="text-2xl font-semibold">
            {dashboard ? dashboard.remainingEstimatedHours.toFixed(2) : "0.00"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-slate-200">
          <p className="text-sm text-slate-400">Entries</p>
          <p className="text-2xl font-semibold">{logs.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add Time Log
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <DataPanel>
        {loading ? (
          <LoadingState text="Loading time logs..." />
        ) : (
          <TableWrapper>
            <table className="min-w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Artist</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Shot</th>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Hours</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-3 py-2">{new Date(log.logDate).toISOString().split("T")[0]}</td>
                  <td className="px-3 py-2">{log.artist.fullName}</td>
                  <td className="px-3 py-2">{log.project.code}</td>
                  <td className="px-3 py-2">{log.shot.code ?? log.shot.shotName}</td>
                  <td className="px-3 py-2">{log.task.taskName}</td>
                  <td className="px-3 py-2">{(log.minutesSpent / 60).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(log)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(log.id)}
                        className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-3">
                    <EmptyState text="No time logs found." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </TableWrapper>
        )}
      </DataPanel>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-100">
              {editingLog ? "Edit Time Log" : "Add Time Log"}
            </h2>

            <form onSubmit={saveLog} className="grid gap-3 md:grid-cols-2">
              <input
                type="date"
                value={form.logDate}
                onChange={(e) => setForm((prev) => ({ ...prev, logDate: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />

              <select
                value={form.artistId}
                onChange={(e) => setForm((prev) => ({ ...prev, artistId: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                <option value="">Select artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.fullName}
                  </option>
                ))}
              </select>

              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, projectId: e.target.value, shotId: "", taskId: "" }))
                }
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>

              <select
                value={form.shotId}
                onChange={(e) => setForm((prev) => ({ ...prev, shotId: e.target.value, taskId: "" }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                <option value="">Select shot</option>
                {shotOptions.map((shot) => (
                  <option key={shot.id} value={shot.id}>
                    {shot.code ?? shot.shotName}
                  </option>
                ))}
              </select>

              <select
                value={form.taskId}
                onChange={(e) => setForm((prev) => ({ ...prev, taskId: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                <option value="">Select task</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.taskName}
                  </option>
                ))}
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <input
                value={form.activity}
                onChange={(e) => setForm((prev) => ({ ...prev, activity: e.target.value }))}
                placeholder="Activity"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                required
              />

              <input
                type="number"
                min={1}
                value={form.minutesSpent}
                onChange={(e) => setForm((prev) => ({ ...prev, minutesSpent: e.target.value }))}
                placeholder="Minutes Spent"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />

              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes"
                className="min-h-24 rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 md:col-span-2"
              />

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {pendingCrudLabel(saving, editingLog ? "update" : "create", "Time Log")}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-slate-100">Remove Time Log</h2>
            <p className="mt-2 text-sm text-slate-300">This will soft-delete the time log. Continue?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void removeLog()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
