"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownUp,
  ChevronDown,
  Copy,
  Grid3x3,
  KanbanSquare,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { pendingCrudLabel } from "@/components/ui/async-action-label";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";

type ShotStatus =
  | "NOT_STARTED"
  | "WIP"
  | "INTERNAL_REVIEW"
  | "CLIENT_REVIEW"
  | "APPROVED"
  | "DELIVERED"
  | "HOLD";

type ViewMode = "LIST" | "GRID" | "KANBAN";

interface ProjectItem {
  id: string;
  code: string;
  name: string;
}

interface SequenceItem {
  id: string;
  code: string;
  name: string;
  projectId: string;
}

interface ShotItem {
  id: string;
  projectId: string;
  sequenceId: string;
  artistId: string | null;
  code: string | null;
  shotName: string;
  episode: string | null;
  clientShotName: string | null;
  status: ShotStatus;
  priority: number;
  flag: string | null;
  dueDate: string | null;
  vendorETA: string | null;
  deliverNextFor: string | null;
  prodTeamComments: string | null;
  vendorProdComments: string | null;
  latestClientNote: string | null;
  scopeOfWork: string | null;
  bidDays: number | null;
  actualDays: number | null;
  frameStart: number | null;
  frameEnd: number | null;
  project: ProjectItem;
  sequence: SequenceItem;
  artist: { id: string; name: string } | null;
}

interface ShotForm {
  projectId: string;
  sequenceId: string;
  episode: string;
  shotName: string;
  clientShotName: string;
  scopeOfWork: string;
  taskTemplate: string;
  code: string;
  status: ShotStatus;
  priority: string;
  flag: string;
  dueDate: string;
  vendorETA: string;
  deliverNextFor: string;
  prodTeamComments: string;
  vendorProdComments: string;
  latestClientNote: string;
  bidDays: string;
  actualDays: string;
  frameStart: string;
  frameEnd: string;
  artistId: string;
  clientDeliveryName: string;
  complexity: string;
  clientPriority: string;
  cgComplete: boolean;
  cgSupervisorComments: string;
  cameraInfo: string;
  character: string;
  compositor: string;
  cleanupVendor: string;
  additionalFX: string;
  assumptions: string;
  clientProdNotes: string;
  clientReportNotes: string;
  clientSGId: string;
  clientSGStatus: string;
  bidId: string;
  bidNotes: string;
  bidTotal: string;
  contentHubPipelineLink: string;
  assignedVendors: string;
}

const defaultForm: ShotForm = {
  projectId: "",
  sequenceId: "",
  episode: "",
  shotName: "",
  clientShotName: "",
  scopeOfWork: "",
  taskTemplate: "",
  code: "",
  status: "NOT_STARTED",
  priority: "3",
  flag: "",
  dueDate: "",
  vendorETA: "",
  deliverNextFor: "",
  prodTeamComments: "",
  vendorProdComments: "",
  latestClientNote: "",
  bidDays: "",
  actualDays: "",
  frameStart: "",
  frameEnd: "",
  artistId: "",
  clientDeliveryName: "",
  complexity: "",
  clientPriority: "",
  cgComplete: false,
  cgSupervisorComments: "",
  cameraInfo: "",
  character: "",
  compositor: "",
  cleanupVendor: "",
  additionalFX: "",
  assumptions: "",
  clientProdNotes: "",
  clientReportNotes: "",
  clientSGId: "",
  clientSGStatus: "",
  bidId: "",
  bidNotes: "",
  bidTotal: "",
  contentHubPipelineLink: "",
  assignedVendors: "",
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

export default function ShotsManagementNew() {
  const [mounted, setMounted] = useState(false);
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sequences, setSequences] = useState<SequenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ShotForm>(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedSequenceTags, setSelectedSequenceTags] = useState<string[]>([]);
  const [selectedEpisodeTags, setSelectedEpisodeTags] = useState<string[]>([]);
  const [bulkProjectId, setBulkProjectId] = useState("");

  useEffect(() => {
    setMounted(true);
    loadData();
    const unsubscribe = subscribeDataSync(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [shotsRes, projectsRes] = await Promise.all([
        fetch("/api/shots", { cache: "no-store" }),
        fetch("/api/projects?activeOnly=true", { cache: "no-store" }),
      ]);

      if (shotsRes.ok) {
        const shotsData = await shotsRes.json();
        setShots(Array.isArray(shotsData) ? shotsData : []);
      }
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadSequences(projectId: string) {
    if (!projectId) {
      setSequences([]);
      return;
    }
    try {
      const response = await fetch(`/api/sequences?projectId=${projectId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setSequences(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load sequences:", err);
    }
  }

  async function saveShot(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSequenceTags[0]) {
      setError("Please select a sequence");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const shotData = {
        ...form,
        sequenceId: selectedSequenceTags[0],
        episode: selectedEpisodeTags[0] || form.episode,
      };

      const response = await fetch("/api/shots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shotData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save shot");
      }

      setSuccess("Shot created successfully!");
      setForm(defaultForm);
      setShowForm(false);
      setSelectedSequenceTags([]);
      setSelectedEpisodeTags([]);
      await loadData();
      emitDataSync("shots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shot");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !bulkProjectId || !selectedSequenceTags[0]) {
      setError("Select project, sequence, and CSV file");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];

      if (!headers.includes("shotname")) {
        throw new Error("CSV must include 'shotname' column");
      }

      let imported = 0;

      for (const line of lines.slice(1)) {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });

        if (!row.shotname) continue;

        const shotData = {
          projectId: bulkProjectId,
          sequenceId: selectedSequenceTags[0],
          shotName: row.shotname,
          code: row.code || undefined,
          episode: selectedEpisodeTags[0] || row.episode || undefined,
          clientShotName: row.clientshotname || undefined,
          scopeOfWork: row.scopeofwork || undefined,
          status: (row.status as ShotStatus) || "NOT_STARTED",
          priority: parseInt(row.priority || "3"),
          dueDate: row.duedate ? new Date(row.duedate).toISOString() : undefined,
        };

        await fetch("/api/shots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shotData),
        });

        imported++;
      }

      setSuccess(`Successfully imported ${imported} shots!`);
      setShowBulkImport(false);
      setImportFile(null);
      setBulkProjectId("");
      setSelectedSequenceTags([]);
      setSelectedEpisodeTags([]);
      await loadData();
      emitDataSync("shots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSaving(false);
    }
  }

  const filteredShots = useMemo(() => {
    return shots.filter((shot) => {
      const matchesSearch =
        shot.code?.toLowerCase().includes(search.toLowerCase()) ||
        shot.shotName.toLowerCase().includes(search.toLowerCase()) ||
        shot.clientShotName?.toLowerCase().includes(search.toLowerCase()) ||
        shot.project.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || shot.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shots, search, statusFilter]);

  const flagColor = (flag: string | null) => {
    switch (flag) {
      case "GREEN":
        return "bg-green-500";
      case "ORANGE":
        return "bg-orange-500";
      case "RED":
        return "bg-red-500";
      case "BLUE":
        return "bg-blue-500";
      case "PURPLE":
        return "bg-purple-500";
      default:
        return "bg-slate-600";
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-100">
          {shots.length} Shots {statusFilter !== "ALL" && `(${statusFilter})`}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-600"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Shot
          </button>
        </div>
      </div>

      {/* Add Shot Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Create a new Shot</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedSequenceTags([]);
                  setSelectedEpisodeTags([]);
                }}
                className="rounded-lg p-1 hover:bg-slate-700"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={saveShot} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Shot Name *</label>
                  <input
                    type="text"
                    value={form.shotName}
                    onChange={(e) => setForm({ ...form, shotName: e.target.value })}
                    placeholder="Enter shot name"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Project *</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => {
                      setForm({ ...form, projectId: e.target.value });
                      loadSequences(e.target.value);
                      setSelectedSequenceTags([]);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Scope of Work</label>
                  <input
                    type="text"
                    value={form.scopeOfWork}
                    onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })}
                    placeholder="Describe scope"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Task Template</label>
                  <input
                    type="text"
                    value={form.taskTemplate}
                    onChange={(e) => setForm({ ...form, taskTemplate: e.target.value })}
                    placeholder="Enter template"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              {/* Sequence Tagging */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">Sequences (Click to tag) *</label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-[#0B1321] p-3">
                  {sequences.length === 0 ? (
                    <p className="text-xs text-slate-500">Select a project first</p>
                  ) : (
                    sequences.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSequenceTags([s.id])}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          selectedSequenceTags.includes(s.id)
                            ? "bg-blue-600 text-white"
                            : "border border-slate-600 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {s.code}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Episode Tagging */}
              <div>
                <label className="mb-2 block text-sm text-slate-300">Episodes (Press Enter to add tags)</label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-[#0B1321] p-3">
                  <input
                    type="text"
                    placeholder="Type episode # and press Enter..."
                    value={form.episode}
                    onChange={(e) => setForm({ ...form, episode: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value;
                        if (value && !selectedEpisodeTags.includes(value)) {
                          setSelectedEpisodeTags([...selectedEpisodeTags, value]);
                          setForm({ ...form, episode: "" });
                        }
                      }
                    }}
                    className="flex-1 min-w-40 border-0 bg-transparent px-2 py-1 text-sm text-slate-100 outline-none"
                  />
                  {selectedEpisodeTags.map((ep) => (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => setSelectedEpisodeTags(selectedEpisodeTags.filter((e) => e !== ep))}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Ep {ep} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>

              {/* More Fields */}
              <button
                type="button"
                onClick={() => setShowMoreFields(!showMoreFields)}
                className="flex items-center gap-2 text-sm text-slate-400"
              >
                <ChevronDown className={`h-4 w-4 ${showMoreFields ? "rotate-180" : ""}`} />
                More fields
              </button>

              <div className="flex gap-3 border-t border-slate-700 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {pendingCrudLabel(saving, "create", "Shot")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedSequenceTags([]);
                    setSelectedEpisodeTags([]);
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300"
                >
                  Cancel
                </button>
                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Bulk Import Shots (CSV)</h3>
              <button
                onClick={() => {
                  setShowBulkImport(false);
                  setSelectedSequenceTags([]);
                  setSelectedEpisodeTags([]);
                  setBulkProjectId("");
                }}
                className="rounded-lg p-1 hover:bg-slate-700"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-[#0B1321] p-3 text-xs text-slate-400">
                <p className="mb-1 font-mono">shotname,code,episode,status,priority</p>
                <p className="font-mono">Example: Shot 001,SH001,1,NOT_STARTED,3</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Project *</label>
                <select
                  value={bulkProjectId}
                  onChange={(e) => {
                    setBulkProjectId(e.target.value);
                    loadSequences(e.target.value);
                    setSelectedSequenceTags([]);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Tag all with Sequence *</label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-[#0B1321] p-3">
                  {sequences.length === 0 ? (
                    <p className="text-xs text-slate-500">Select project first</p>
                  ) : (
                    sequences.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSequenceTags([s.id])}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          selectedSequenceTags.includes(s.id)
                            ? "bg-blue-600 text-white"
                            : "border border-slate-600 text-slate-400"
                        }`}
                      >
                        {s.code}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Tag all with Episode</label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-[#0B1321] p-3">
                  <input
                    type="text"
                    placeholder="Type episode # and press Enter..."
                    value={form.episode}
                    onChange={(e) => setForm({ ...form, episode: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value;
                        if (value && !selectedEpisodeTags.includes(value)) {
                          setSelectedEpisodeTags([...selectedEpisodeTags, value]);
                          setForm({ ...form, episode: "" });
                        }
                      }
                    }}
                    className="flex-1 min-w-40 border-0 bg-transparent px-2 py-1 text-sm text-slate-100 outline-none"
                  />
                  {selectedEpisodeTags.map((ep) => (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => setSelectedEpisodeTags(selectedEpisodeTags.filter((e) => e !== ep))}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Ep {ep} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm file:bg-blue-600 file:text-white file:border-0 file:px-2 file:py-1 file:text-xs file:rounded"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-700 pt-4">
                <button
                  onClick={async () => {
                    if (!importFile || !bulkProjectId || !selectedSequenceTags[0]) {
                      setError("Select project, sequence, and CSV file");
                      return;
                    }

                    setSaving(true);
                    setError(null);
                    setSuccess(null);

                    try {
                      const text = await importFile.text();
                      const lines = text.split("\n").filter((l) => l.trim());
                      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];

                      if (!headers.includes("shotname")) {
                        throw new Error("CSV must include 'shotname' column");
                      }

                      let imported = 0;

                      for (const line of lines.slice(1)) {
                        const values = line.split(",").map((v) => v.trim());
                        const row: Record<string, string> = {};

                        headers.forEach((header, idx) => {
                          row[header] = values[idx] || "";
                        });

                        if (!row.shotname) continue;

                        const shotData = {
                          projectId: bulkProjectId,
                          sequenceId: selectedSequenceTags[0],
                          shotName: row.shotname,
                          code: row.code || undefined,
                          episode: selectedEpisodeTags[0] || row.episode || undefined,
                          clientShotName: row.clientshotname || undefined,
                          scopeOfWork: row.scopeofwork || undefined,
                          status: (row.status as ShotStatus) || "NOT_STARTED",
                          priority: parseInt(row.priority || "3"),
                          dueDate: row.duedate ? new Date(row.duedate).toISOString() : undefined,
                        };

                        await fetch("/api/shots", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(shotData),
                        });

                        imported++;
                      }

                      setSuccess(`Successfully imported ${imported} shots!`);
                      setShowBulkImport(false);
                      setImportFile(null);
                      setBulkProjectId("");
                      setSelectedSequenceTags([]);
                      setSelectedEpisodeTags([]);
                      await loadData();
                      emitDataSync("shots");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Import failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={!importFile || saving || !bulkProjectId || !selectedSequenceTags[0]}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Importing..." : "Import Shots"}
                </button>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setSelectedSequenceTags([]);
                    setSelectedEpisodeTags([]);
                    setBulkProjectId("");
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300"
                >
                  Cancel
                </button>
                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <DataPanel className="space-y-4">
        <div className="flex gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-[#0B1321] px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shots..."
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          >
            <option value="ALL">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState text="Loading shots..." />
        ) : filteredShots.length === 0 ? (
          <EmptyState text="No shots found" />
        ) : (
          <TableWrapper>
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0B1321] text-xs uppercase text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="px-3 py-3 font-medium">Shot</th>
                  <th className="px-3 py-3 font-medium">Sequence</th>
                  <th className="px-3 py-3 font-medium">Episode</th>
                  <th className="px-3 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due Date</th>
                  <th className="px-3 py-3 font-medium">Scope</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredShots.map((shot) => (
                  <tr key={shot.id} className="bg-[#0B1321] hover:bg-white/[0.02]">
                    <td className="px-3 py-3 font-medium text-white">{shot.shotName}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium">
                        {shot.sequence.code}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {shot.episode ? (
                        <span className="rounded-full bg-blue-900/50 px-2.5 py-1 text-xs font-medium text-blue-300">
                          Ep {shot.episode}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{shot.code || "-"}</td>
                    <td className="px-3 py-3 text-xs">{shot.status}</td>
                    <td className="px-3 py-3 text-slate-400 text-sm">
                      {shot.dueDate ? new Date(shot.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-3 truncate text-slate-400 max-w-xs text-sm">
                      {shot.scopeOfWork || "-"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </DataPanel>
    </section>
  );
}
