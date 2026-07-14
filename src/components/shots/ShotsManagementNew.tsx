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
  // Additional fields
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

const flagOptions = [
  { value: "GREEN", label: "Ready", color: "bg-green-500" },
  { value: "ORANGE", label: "Warning", color: "bg-orange-500" },
  { value: "RED", label: "Blocked", color: "bg-red-500" },
  { value: "BLUE", label: "On Hold", color: "bg-blue-500" },
  { value: "PURPLE", label: "In Progress", color: "bg-purple-500" },
];

const additionalFields = [
  { label: "Delivery Date - First Looks", key: "deliveryDateFirstLooks" },
  { label: "Additional FX", key: "additionalFX" },
  { label: "After June 2", key: "afterJune2" },
  { label: "Allow Total", key: "allowTotal" },
  { label: "All Color", key: "allColor" },
  { label: "ASC SAT", key: "ascSAT" },
  { label: "ASC SOP Offset", key: "ascSopOffset" },
  { label: "ASC SOP Power", key: "ascSopPower" },
  { label: "ASC SOP Slope", key: "ascSopSlope" },
  { label: "Assigned Vendors", key: "assignedVendors" },
  { label: "Assumptions", key: "assumptions" },
  { label: "Bid ID", key: "bidId" },
  { label: "Bid Notes", key: "bidNotes" },
  { label: "Bid Total", key: "bidTotal" },
  { label: "Bidding Shot Count", key: "biddingShotCount" },
  { label: "Camera Info", key: "cameraInfo" },
  { label: "CG Complete", key: "cgComplete" },
  { label: "CG Supervisor Comments", key: "cgSupervisorComments" },
  { label: "Character", key: "character" },
  { label: "Cleanup Vendor", key: "cleanupVendor" },
  { label: "Client Additional SOW", key: "clientAdditionalSOW" },
  { label: "Client Delivery Name", key: "clientDeliveryName" },
  { label: "Client Priority", key: "clientPriority" },
  { label: "Client Prod Notes", key: "clientProdNotes" },
  { label: "Client Report Notes", key: "clientReportNotes" },
  { label: "Client SG ID", key: "clientSGId" },
  { label: "Client SG Status", key: "clientSGStatus" },
  { label: "Complexity", key: "complexity" },
  { label: "Compositor", key: "compositor" },
  { label: "Content Hub Pipeline Link", key: "contentHubPipelineLink" },
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
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/shots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save shot");
      }

      setSuccess("Shot created successfully!");
      setForm(defaultForm);
      setShowForm(false);
      await loadData();
      emitDataSync("shots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shot");
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
      {/* Header with Add Shot Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            {shots.length} Shots {statusFilter !== "ALL" && `(${statusFilter})`}
          </h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Shot
        </button>
      </div>

      {/* Add Shot Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Create a new Shot</h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 hover:bg-slate-700"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={saveShot} className="space-y-4">
              {/* Core Fields */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Shot Name</label>
                  <input
                    type="text"
                    value={form.shotName}
                    onChange={(e) => setForm({ ...form, shotName: e.target.value })}
                    placeholder="Enter shot name"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Scope of Work</label>
                  <input
                    type="text"
                    value={form.scopeOfWork}
                    onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })}
                    placeholder="Describe scope"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Task Template</label>
                  <input
                    type="text"
                    value={form.taskTemplate}
                    onChange={(e) => setForm({ ...form, taskTemplate: e.target.value })}
                    placeholder="Select template"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Project</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => {
                      setForm({ ...form, projectId: e.target.value, sequenceId: "" });
                      loadSequences(e.target.value);
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
                  <label className="mb-2 block text-sm text-slate-300">Sequence</label>
                  <select
                    value={form.sequenceId}
                    onChange={(e) => setForm({ ...form, sequenceId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                    required
                  >
                    <option value="">Select sequence</option>
                    {sequences.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* More Fields Toggle */}
              <button
                type="button"
                onClick={() => setShowMoreFields(!showMoreFields)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showMoreFields ? "rotate-180" : ""}`}
                />
                More fields
              </button>

              {/* Additional Fields */}
              {showMoreFields && (
                <div className="space-y-3 border-t border-slate-700 pt-4">
                  <div className="max-h-60 overflow-y-auto">
                    {additionalFields.map((field) => (
                      <label key={field.key} className="flex items-center gap-2 py-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            // Handle additional field visibility
                          }}
                          className="h-4 w-4 rounded border-slate-600 bg-[#0B1321]"
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 border-t border-slate-700 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {pendingCrudLabel(saving, "create", "Shot")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-600"
                >
                  Cancel
                </button>
                {success && <p className="text-sm text-emerald-400">{success}</p>}
                {error && <p className="text-sm text-rose-400">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <DataPanel className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-[#0B1321] px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, sequence..."
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1321] p-1">
            <button
              onClick={() => setViewMode("LIST")}
              className={`rounded px-3 py-1.5 text-sm ${
                viewMode === "LIST"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`rounded px-3 py-1.5 text-sm ${
                viewMode === "GRID"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("KANBAN")}
              className={`rounded px-3 py-1.5 text-sm ${
                viewMode === "KANBAN"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Shots Display */}
        {loading ? (
          <LoadingState text="Loading shots..." />
        ) : filteredShots.length === 0 ? (
          <EmptyState text="No shots found. Create one to get started." />
        ) : viewMode === "LIST" ? (
          <TableWrapper>
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#0B1321] text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="px-3 py-3 font-medium">Thumbnail</th>
                  <th className="px-3 py-3 font-medium">Shot Name</th>
                  <th className="px-3 py-3 font-medium">Client Name</th>
                  <th className="px-3 py-3 font-medium">Sequence</th>
                  <th className="px-3 py-3 font-medium">Episode</th>
                  <th className="px-3 py-3 font-medium">Shot</th>
                  <th className="px-3 py-3 font-medium">Flag</th>
                  <th className="px-3 py-3 font-medium">NetFX Due</th>
                  <th className="px-3 py-3 font-medium">Vendor ETA</th>
                  <th className="px-3 py-3 font-medium">Deliver For</th>
                  <th className="px-3 py-3 font-medium">Prod Team Comments</th>
                  <th className="px-3 py-3 font-medium">Vendor Comments</th>
                  <th className="px-3 py-3 font-medium">Scope of Work</th>
                  <th className="px-3 py-3 font-medium">Latest Client Note</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredShots.map((shot) => (
                  <tr
                    key={shot.id}
                    className="bg-[#0B1321] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <div className="h-10 w-10 rounded bg-slate-700" />
                    </td>
                    <td className="px-3 py-3 font-medium text-white">{shot.shotName}</td>
                    <td className="px-3 py-3 text-slate-400">{shot.clientShotName || "-"}</td>
                    <td className="px-3 py-3 text-slate-400">{shot.sequence.code}</td>
                    <td className="px-3 py-3 text-slate-400">{shot.episode || "-"}</td>
                    <td className="px-3 py-3 text-slate-400">{shot.code || "-"}</td>
                    <td className="px-3 py-3">
                      {shot.flag && (
                        <div className={`h-4 w-4 rounded-full ${flagColor(shot.flag)}`} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      {shot.dueDate ? new Date(shot.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-400">
                      {shot.vendorETA ? new Date(shot.vendorETA).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-400">{shot.deliverNextFor || "-"}</td>
                    <td className="px-3 py-3 text-slate-400 truncate">{shot.prodTeamComments || "-"}</td>
                    <td className="px-3 py-3 text-slate-400 truncate">{shot.vendorProdComments || "-"}</td>
                    <td className="px-3 py-3 text-slate-400 truncate">{shot.scopeOfWork || "-"}</td>
                    <td className="px-3 py-3 text-slate-400 truncate">{shot.latestClientNote || "-"}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : (
          <div className="text-center py-8 text-slate-400">
            {viewMode === "GRID" ? "Grid view coming soon" : "Kanban view coming soon"}
          </div>
        )}
      </DataPanel>
    </section>
  );
}
