"use client";

import { useEffect, useMemo, useState } from "react";
import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { pendingCrudLabel } from "@/components/ui/async-action-label";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";

type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

type ProjectItem = {
  id: string;
  code: string;
  name: string;
  client: string | null;
  status: ProjectStatus;
  producer?: { name?: string | null } | null;
  _count: {
    shots: number;
  };
};

type ProjectForm = {
  code: string;
  name: string;
  client: string;
  status: ProjectStatus;
};

const defaultForm: ProjectForm = {
  code: "",
  name: "",
  client: "",
  status: "ACTIVE",
};

const statusOptions: ProjectStatus[] = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];

export default function ProjectsManagement() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProjectStatus>("ACTIVE");

  const [editingId, setEditingId] = useState<string | null>(null);

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingId) ?? null,
    [projects, editingId]
  );

  useEffect(() => {
    void loadProjects();

    const unsubscribe = subscribeDataSync(() => {
      void loadProjects();
    });

    return unsubscribe;
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = (await response.json()) as ProjectItem[];
      setProjects(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((item) => item.id === id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = selectedIds.length;
  const allSelected = projects.length > 0 && selectedCount === projects.length;

  function startEdit(project: ProjectItem) {
    setEditingId(project.id);
    setForm({
      code: project.code,
      name: project.name,
      client: project.client ?? "",
      status: project.status,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      client: form.client.trim() || undefined,
      status: form.status,
    };

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/projects/${editingId}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save project");
      }

      await loadProjects();
      emitDataSync("projects");
      setSuccess(isEdit ? "Project updated" : "Project created");
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    const confirmed = window.confirm("Remove this project? This is a soft delete.");
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove project");
      }

      if (editingId === id) {
        cancelEdit();
      }

      await loadProjects();
      emitDataSync("projects");
      setSuccess("Project removed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove project");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : projects.map((project) => project.id));
  }

  function exportSelected() {
    if (selectedCount === 0) {
      return;
    }

    const selected = projects.filter((project) => selectedIds.includes(project.id));
    const rows = [
      "code,name,client,status,producer,shots",
      ...selected.map(
        (project) =>
          `${project.code},${project.name},${project.client ?? ""},${project.status},${project.producer?.name ?? ""},${project._count.shots}`
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects-selected.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSelected() {
    if (selectedCount === 0) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedCount} selected projects?`);
    if (!confirmed) {
      return;
    }

    setBulkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/projects/${id}`, {
            method: "DELETE",
          })
        )
      );

      setSelectedIds([]);
      await loadProjects();
      emitDataSync("projects");
      setSuccess("Selected projects deleted");
    } catch {
      setError("Failed to delete selected projects");
    } finally {
      setBulkLoading(false);
    }
  }

  async function updateSelectedStatus() {
    if (selectedCount === 0) {
      return;
    }

    setBulkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/projects/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );

      await loadProjects();
      emitDataSync("projects");
      setSuccess("Selected project statuses updated");
    } catch {
      setError("Failed to update selected project statuses");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <form
        onSubmit={saveProject}
        className="rounded-2xl border border-slate-800 bg-[#111827] p-5"
      >
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          {editingProject ? "Edit Project" : "Add Project"}
        </h2>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Code"
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            required
          />

          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            required
          />

          <input
            value={form.client}
            onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
            placeholder="Client"
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />

          <select
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value as ProjectStatus }))
            }
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {pendingCrudLabel(saving, editingProject ? "update" : "create", "Project")}
          </button>

          {editingProject ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-400">{success}</p> : null}
      </form>

      <DataPanel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void deleteSelected()}
            disabled={bulkLoading || selectedCount === 0}
            className="rounded-lg border border-red-700 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30 disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            type="button"
            onClick={exportSelected}
            disabled={selectedCount === 0}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            Export Selected
          </button>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ProjectStatus)}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-xs text-slate-100"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void updateSelectedStatus()}
            disabled={bulkLoading || selectedCount === 0}
            className="rounded-lg border border-blue-700 px-3 py-2 text-xs text-blue-300 hover:bg-blue-900/30 disabled:opacity-50"
          >
            Update Status
          </button>
          <span className="text-xs text-slate-400">Selected: {selectedCount}</span>
        </div>

        {loading ? (
          <LoadingState text="Loading projects..." />
        ) : (
          <TableWrapper>
            <table className="min-w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all projects"
                  />
                </th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Producer</th>
                <th className="px-3 py-2">Shots</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-t border-slate-800 text-slate-200"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(project.id)}
                      onChange={() => toggleSelect(project.id)}
                      aria-label={`Select ${project.name}`}
                    />
                  </td>
                  <td className="px-3 py-2">{project.code}</td>
                  <td className="px-3 py-2">{project.name}</td>
                  <td className="px-3 py-2">{project.client ?? "-"}</td>
                  <td className="px-3 py-2">{project.status}</td>
                  <td className="px-3 py-2">{project.producer?.name ?? "Unassigned"}</td>
                  <td className="px-3 py-2">{project._count.shots}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeProject(project.id)}
                        className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-3">
                    <EmptyState text="No projects found." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </TableWrapper>
        )}
      </DataPanel>
    </section>
  );
}
