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
  artistId: string;
  taskName: string;
  description: string | null;
  estimatedMinutes: number | null;
  status: TaskStatus;
  project: { id: string; code: string; name: string };
  shot: { id: string; code: string | null; shotName: string };
  artist: { id: string; fullName: string };
};

type TaskForm = {
  projectId: string;
  shotId: string;
  artistId: string;
  taskName: string;
  description: string;
  estimatedMinutes: string;
  status: TaskStatus;
};

const statusOptions: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "REVIEW",
  "COMPLETED",
];

const defaultForm: TaskForm = {
  projectId: "",
  shotId: "",
  artistId: "",
  taskName: "",
  description: "",
  estimatedMinutes: "",
  status: "NOT_STARTED",
};

export default function ShotTasksManagement() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(defaultForm);

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingId) ?? null,
    [tasks, editingId]
  );

  const shotOptions = useMemo(
    () => shots.filter((shot) => !form.projectId || shot.projectId === form.projectId),
    [shots, form.projectId]
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
      const [tasksRes, projectsRes, shotsRes, artistsRes] = await Promise.all([
        fetch("/api/shot-tasks", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/shots", { cache: "no-store" }),
        fetch("/api/artists", { cache: "no-store" }),
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !shotsRes.ok || !artistsRes.ok) {
        throw new Error("Failed to load task management data");
      }

      const [tasksData, projectsData, shotsData, artistsData] = (await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        shotsRes.json(),
        artistsRes.json(),
      ])) as [TaskItem[], ProjectItem[], ShotItem[], ArtistItem[]];

      setTasks(tasksData);
      setProjects(projectsData.map((project) => ({ id: project.id, code: project.code, name: project.name })));
      setShots(shotsData.map((shot) => ({
        id: shot.id,
        code: shot.code,
        shotName: shot.shotName,
        projectId: shot.projectId,
      })));
      setArtists(artistsData.map((artist) => ({ id: artist.id, fullName: artist.fullName })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load task management data");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  }

  function openEditModal(task: TaskItem) {
    setEditingId(task.id);
    setForm({
      projectId: task.projectId,
      shotId: task.shotId,
      artistId: task.artistId,
      taskName: task.taskName,
      description: task.description ?? "",
      estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
      status: task.status,
    });
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      projectId: form.projectId,
      shotId: form.shotId,
      artistId: form.artistId,
      taskName: form.taskName.trim(),
      description: form.description.trim() || undefined,
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      status: form.status,
    };

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/shot-tasks/${editingId}` : "/api/shot-tasks";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save task");
      }

      await loadData();
      emitDataSync("tasks");
      closeFormModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!deletingId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/shot-tasks/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove task");
      }

      setDeletingId(null);
      await loadData();
      emitDataSync("tasks");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove task");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add Shot Task
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <DataPanel>
        {loading ? (
          <LoadingState text="Loading shot tasks..." />
        ) : (
          <TableWrapper>
            <table className="min-w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Shot</th>
                <th className="px-3 py-2">Artist</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Est. Hours</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-3 py-2">{task.taskName}</td>
                  <td className="px-3 py-2">{task.project.code}</td>
                  <td className="px-3 py-2">{task.shot.code ?? task.shot.shotName}</td>
                  <td className="px-3 py-2">{task.artist.fullName}</td>
                  <td className="px-3 py-2">{task.status}</td>
                  <td className="px-3 py-2">
                    {task.estimatedMinutes ? (task.estimatedMinutes / 60).toFixed(2) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(task.id)}
                        className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-3">
                    <EmptyState text="No shot tasks found." />
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
              {editingTask ? "Edit Shot Task" : "Add Shot Task"}
            </h2>

            <form onSubmit={saveTask} className="grid gap-3 md:grid-cols-2">
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, projectId: e.target.value, shotId: "" }))
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
                onChange={(e) => setForm((prev) => ({ ...prev, shotId: e.target.value }))}
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
                value={form.taskName}
                onChange={(e) => setForm((prev) => ({ ...prev, taskName: e.target.value }))}
                placeholder="Task Name"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                required
              />

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="min-h-24 rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 md:col-span-2"
              />

              <input
                type="number"
                min={1}
                value={form.estimatedMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, estimatedMinutes: e.target.value }))}
                placeholder="Estimated Minutes"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {pendingCrudLabel(saving, editingTask ? "update" : "create", "Task")}
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
            <h2 className="text-lg font-semibold text-slate-100">Remove Shot Task</h2>
            <p className="mt-2 text-sm text-slate-300">This will soft-delete the task. Continue?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void removeTask()}
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
