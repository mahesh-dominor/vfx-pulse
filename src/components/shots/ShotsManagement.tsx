"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";

type ShotStatus =
  | "NOT_STARTED"
  | "WIP"
  | "INTERNAL_REVIEW"
  | "CLIENT_REVIEW"
  | "APPROVED"
  | "DELIVERED"
  | "HOLD";

type ProjectItem = { id: string; code: string; name: string };
type SequenceItem = { id: string; code: string; name: string; projectId: string };
type ArtistItem = { id: string; fullName: string };

type ShotItem = {
  id: string;
  projectId: string;
  sequenceId: string;
  artistId: string | null;
  code: string | null;
  shotName: string;
  description: string | null;
  status: ShotStatus;
  priority: number;
  version: number;
  dueDate: string | null;
  bidDays: number | null;
  actualDays: number | null;
  frameStart: number | null;
  frameEnd: number | null;
  project: { id: string; code: string; name: string };
  sequence: { id: string; code: string; name: string };
  artist: { id: string; name: string } | null;
};

type ShotForm = {
  projectId: string;
  sequenceId: string;
  artistId: string;
  code: string;
  shotName: string;
  description: string;
  status: ShotStatus;
  priority: string;
  version: string;
  dueDate: string;
  bidDays: string;
  actualDays: string;
  frameStart: string;
  frameEnd: string;
};

const statusOptions: ShotStatus[] = [
  "NOT_STARTED",
  "WIP",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "APPROVED",
  "DELIVERED",
  "HOLD",
];

const defaultForm: ShotForm = {
  projectId: "",
  sequenceId: "",
  artistId: "",
  code: "",
  shotName: "",
  description: "",
  status: "NOT_STARTED",
  priority: "3",
  version: "1",
  dueDate: "",
  bidDays: "",
  actualDays: "",
  frameStart: "",
  frameEnd: "",
};

function csvToRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsText(file);
  });
}

function getShotCsvTemplate() {
  return [
    "projectId,sequenceId,artistId,code,shotName,description,status,priority,version,dueDate,bidDays,actualDays,frameStart,frameEnd",
    "<project_cuid>,<sequence_cuid>,<artist_cuid_optional>,SH010,Opening shot,Warm sunrise comp,WIP,3,1,2026-07-20T00:00:00.000Z,2.5,0,1001,1050",
  ].join("\n");
}

export default function ShotsManagement() {
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sequences, setSequences] = useState<SequenceItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");

  const [form, setForm] = useState<ShotForm>(defaultForm);

  const editingShot = useMemo(
    () => shots.find((shot) => shot.id === editingId) ?? null,
    [shots, editingId]
  );

  const sequenceOptions = useMemo(
    () => sequences.filter((sequence) => !form.projectId || sequence.projectId === form.projectId),
    [sequences, form.projectId]
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
      const [shotsRes, projectsRes, sequencesRes, artistsRes] = await Promise.all([
        fetch("/api/shots", { cache: "no-store" }),
        fetch("/api/projects?activeOnly=true", { cache: "no-store" }),
        fetch("/api/sequences", { cache: "no-store" }),
        fetch("/api/artists", { cache: "no-store" }),
      ]);

      if (!shotsRes.ok || !projectsRes.ok || !sequencesRes.ok || !artistsRes.ok) {
        throw new Error("Failed to load shot management data");
      }

      const [shotsData, projectsData, sequencesData, artistsData] = (await Promise.all([
        shotsRes.json(),
        projectsRes.json(),
        sequencesRes.json(),
        artistsRes.json(),
      ])) as [ShotItem[], ProjectItem[], SequenceItem[], ArtistItem[]];

      setShots(shotsData);
      setProjects(projectsData.map((project) => ({ id: project.id, code: project.code, name: project.name })));
      setSequences(
        sequencesData.map((sequence) => ({
          id: sequence.id,
          code: sequence.code,
          name: sequence.name,
          projectId: sequence.projectId,
        }))
      );
      setArtists(artistsData.map((artist) => ({ id: artist.id, fullName: artist.fullName })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shot management data");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  }

  function openEditModal(shot: ShotItem) {
    setEditingId(shot.id);
    setForm({
      projectId: shot.projectId,
      sequenceId: shot.sequenceId,
      artistId: shot.artistId ?? "",
      code: shot.code ?? "",
      shotName: shot.shotName,
      description: shot.description ?? "",
      status: shot.status,
      priority: String(shot.priority),
      version: String(shot.version),
      dueDate: shot.dueDate ? new Date(shot.dueDate).toISOString().slice(0, 10) : "",
      bidDays: shot.bidDays ? String(shot.bidDays) : "",
      actualDays: shot.actualDays ? String(shot.actualDays) : "",
      frameStart: shot.frameStart ? String(shot.frameStart) : "",
      frameEnd: shot.frameEnd ? String(shot.frameEnd) : "",
    });
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  function toPayload(current: ShotForm) {
    return {
      projectId: current.projectId,
      sequenceId: current.sequenceId,
      artistId: current.artistId || undefined,
      code: current.code.trim() || undefined,
      shotName: current.shotName.trim(),
      description: current.description.trim() || undefined,
      status: current.status,
      priority: Number(current.priority),
      version: Number(current.version),
      dueDate: current.dueDate ? new Date(current.dueDate).toISOString() : undefined,
      bidDays: current.bidDays ? Number(current.bidDays) : undefined,
      actualDays: current.actualDays ? Number(current.actualDays) : undefined,
      frameStart: current.frameStart ? Number(current.frameStart) : undefined,
      frameEnd: current.frameEnd ? Number(current.frameEnd) : undefined,
    };
  }

  async function saveShot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/shots/${editingId}` : "/api/shots";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save shot");
      }

      await loadData();
      emitDataSync("shots");
      closeFormModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save shot");
    } finally {
      setSaving(false);
    }
  }

  async function removeShot() {
    if (!deletingId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/shots/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove shot");
      }

      setDeletingId(null);
      await loadData();
      emitDataSync("shots");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove shot");
    }
  }

  async function importBulk() {
    setSaving(true);
    setError(null);

    try {
      const rows = csvToRows(bulkCsv);
      if (rows.length < 2) {
        throw new Error("CSV requires a header and at least one row");
      }

      const [header, ...dataRows] = rows;
      const headerIndex = Object.fromEntries(header.map((name, index) => [name, index])) as Record<
        string,
        number
      >;

      const required = ["projectId", "sequenceId", "shotName", "status", "priority", "version"];
      for (const key of required) {
        if (headerIndex[key] === undefined) {
          throw new Error(`Missing required CSV column: ${key}`);
        }
      }

      const payload = dataRows.map((row) => ({
        projectId: row[headerIndex.projectId],
        sequenceId: row[headerIndex.sequenceId],
        artistId: headerIndex.artistId !== undefined ? row[headerIndex.artistId] || undefined : undefined,
        code: headerIndex.code !== undefined ? row[headerIndex.code] || undefined : undefined,
        shotName: row[headerIndex.shotName],
        description: headerIndex.description !== undefined ? row[headerIndex.description] || undefined : undefined,
        status: row[headerIndex.status],
        priority: Number(row[headerIndex.priority]),
        version: Number(row[headerIndex.version]),
        dueDate:
          headerIndex.dueDate !== undefined && row[headerIndex.dueDate]
            ? new Date(row[headerIndex.dueDate]).toISOString()
            : undefined,
        bidDays:
          headerIndex.bidDays !== undefined && row[headerIndex.bidDays]
            ? Number(row[headerIndex.bidDays])
            : undefined,
        actualDays:
          headerIndex.actualDays !== undefined && row[headerIndex.actualDays]
            ? Number(row[headerIndex.actualDays])
            : undefined,
        frameStart:
          headerIndex.frameStart !== undefined && row[headerIndex.frameStart]
            ? Number(row[headerIndex.frameStart])
            : undefined,
        frameEnd:
          headerIndex.frameEnd !== undefined && row[headerIndex.frameEnd]
            ? Number(row[headerIndex.frameEnd])
            : undefined,
      }));

      const response = await fetch("/api/shots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: payload }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Bulk import failed");
      }

      setIsBulkOpen(false);
      setBulkCsv("");
      await loadData();
      emitDataSync("shots");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk import failed");
    } finally {
      setSaving(false);
    }
  }

  async function onBulkFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await readFileAsText(file);
      setBulkCsv(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read CSV file");
    }
  }

  function downloadTemplate() {
    const template = getShotCsvTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shots-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => setIsBulkOpen(true)}
          className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-900/20"
        >
          Bulk Import (CSV)
        </button>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add Shot
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        {loading ? (
          <p className="text-slate-300">Loading shots...</p>
        ) : (
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Shot</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Sequence</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Artist</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot) => (
                <tr key={shot.id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-3 py-2">{shot.code ?? shot.shotName}</td>
                  <td className="px-3 py-2">{shot.project.code}</td>
                  <td className="px-3 py-2">{shot.sequence.code}</td>
                  <td className="px-3 py-2">{shot.status}</td>
                  <td className="px-3 py-2">{shot.priority}</td>
                  <td className="px-3 py-2">{shot.artist?.name ?? "Unassigned"}</td>
                  <td className="px-3 py-2">{shot.dueDate ? new Date(shot.dueDate).toISOString().split("T")[0] : "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(shot)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(shot.id)}
                        className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-100">
              {editingShot ? "Edit Shot" : "Add Shot"}
            </h2>

            <form onSubmit={saveShot} className="grid gap-3 md:grid-cols-2">
              <select
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value, sequenceId: "" }))}
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
                value={form.sequenceId}
                onChange={(e) => setForm((prev) => ({ ...prev, sequenceId: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                <option value="">Select sequence</option>
                {sequenceOptions.map((sequence) => (
                  <option key={sequence.id} value={sequence.id}>
                    {sequence.code} - {sequence.name}
                  </option>
                ))}
              </select>

              <select
                value={form.artistId}
                onChange={(e) => setForm((prev) => ({ ...prev, artistId: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Unassigned</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.fullName}
                  </option>
                ))}
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ShotStatus }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="Shot Code"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <input
                value={form.shotName}
                onChange={(e) => setForm((prev) => ({ ...prev, shotName: e.target.value }))}
                placeholder="Shot Name"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />

              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <input
                type="number"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                placeholder="Priority (1-5)"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />

              <input
                type="number"
                min={1}
                value={form.version}
                onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
                placeholder="Version"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />

              <input
                type="number"
                min={0}
                step="0.1"
                value={form.bidDays}
                onChange={(e) => setForm((prev) => ({ ...prev, bidDays: e.target.value }))}
                placeholder="Bid Days"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <input
                type="number"
                min={0}
                step="0.1"
                value={form.actualDays}
                onChange={(e) => setForm((prev) => ({ ...prev, actualDays: e.target.value }))}
                placeholder="Actual Days"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <input
                type="number"
                min={0}
                value={form.frameStart}
                onChange={(e) => setForm((prev) => ({ ...prev, frameStart: e.target.value }))}
                placeholder="Frame Start"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <input
                type="number"
                min={0}
                value={form.frameEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, frameEnd: e.target.value }))}
                placeholder="Frame End"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="min-h-24 rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 md:col-span-2"
              />

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingShot ? "Update Shot" : "Create Shot"}
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

      {isBulkOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="text-xl font-semibold text-slate-100">Bulk Import Shots (CSV)</h2>
            <p className="mt-2 text-sm text-slate-300">
              Header example: projectId,sequenceId,artistId,code,shotName,description,status,priority,version,dueDate,bidDays,actualDays,frameStart,frameEnd
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-3 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:border-slate-500"
            >
              Download CSV Template
            </button>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void onBulkFileChange(e)}
              className="mt-4 block w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
            <textarea
              value={bulkCsv}
              onChange={(e) => setBulkCsv(e.target.value)}
              placeholder="Paste CSV here"
              className="mt-4 min-h-64 w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void importBulk()}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? "Importing..." : "Import Shots"}
              </button>
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-slate-100">Remove Shot</h2>
            <p className="mt-2 text-sm text-slate-300">This will soft-delete the shot. Continue?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void removeShot()}
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
