"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownUp,
  CalendarDays,
  KanbanSquare,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { pendingCrudLabel } from "@/components/ui/async-action-label";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";
import CreateProject from "@/components/projects/CreateProject";

type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ProjectView = "LIST" | "GRID" | "KANBAN";
type DueDateFilter = "ALL" | "OVERDUE" | "THIS_WEEK" | "THIS_MONTH" | "NO_DATE";
type SortDirection = "asc" | "desc";
type SortField =
  | "code"
  | "name"
  | "client"
  | "productionHouse"
  | "status"
  | "priority"
  | "deliveryDate"
  | "totalShots"
  | "completedShots"
  | "progressPercent"
  | "producer"
  | "createdAt"
  | "updatedAt";

type ProducerOption = {
  id: string;
  name: string;
  email: string;
};

type ProjectItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  client: string | null;
  productionHouse: string | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  producerId: string | null;
  producer: ProducerOption | null;
  startDate: string | null;
  deliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  totalShots: number;
  completedShots: number;
  progressPercent: number;
  isDelayed: boolean;
};

type ProjectForm = {
  code: string;
  name: string;
  client: string;
  productionHouse: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  producerId: string;
  deliveryDate: string;
};

type ProjectsManagementProps = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const defaultForm: ProjectForm = {
  code: "",
  name: "",
  client: "",
  productionHouse: "",
  priority: "MEDIUM",
  status: "ACTIVE",
  producerId: "",
  deliveryDate: "",
};

const statusOptions: ProjectStatus[] = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];
const priorityOptions: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const viewOptions: Array<{ id: ProjectView; label: string; icon: typeof List }> = [
  { id: "LIST", label: "List", icon: List },
  { id: "GRID", label: "Grid", icon: LayoutGrid },
  { id: "KANBAN", label: "Kanban", icon: KanbanSquare },
];

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toIsoDateTime(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

function statusBadgeClass(status: ProjectStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25";
    case "ON_HOLD":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25";
    case "COMPLETED":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25";
    case "ARCHIVED":
      return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/25";
  }
}

function priorityBadgeClass(priority: ProjectPriority) {
  switch (priority) {
    case "LOW":
      return "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/25";
    case "MEDIUM":
      return "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/25";
    case "HIGH":
      return "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/25";
    case "CRITICAL":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/25";
  }
}

function progressBarClass(progressPercent: number) {
  if (progressPercent >= 100) {
    return "bg-emerald-400";
  }

  if (progressPercent >= 60) {
    return "bg-sky-400";
  }

  if (progressPercent >= 30) {
    return "bg-amber-400";
  }

  return "bg-rose-400";
}

function matchesDueDateFilter(project: ProjectItem, dueDateFilter: DueDateFilter) {
  if (dueDateFilter === "ALL") {
    return true;
  }

  if (!project.deliveryDate) {
    return dueDateFilter === "NO_DATE";
  }

  const dueDate = new Date(project.deliveryDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + 7);
  const endOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0);

  if (dueDateFilter === "OVERDUE") {
    return dueDate < startOfToday;
  }

  if (dueDateFilter === "THIS_WEEK") {
    return dueDate >= startOfToday && dueDate <= endOfWeek;
  }

  if (dueDateFilter === "THIS_MONTH") {
    return dueDate >= startOfToday && dueDate <= endOfMonth;
  }

  return false;
}

function compareProjects(a: ProjectItem, b: ProjectItem, field: SortField, direction: SortDirection) {
  const modifier = direction === "asc" ? 1 : -1;
  const producerA = a.producer?.name ?? "";
  const producerB = b.producer?.name ?? "";

  const left: Record<SortField, string | number> = {
    code: a.code,
    name: a.name,
    client: a.client ?? "",
    productionHouse: a.productionHouse ?? "",
    status: a.status,
    priority: a.priority,
    deliveryDate: a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0,
    totalShots: a.totalShots,
    completedShots: a.completedShots,
    progressPercent: a.progressPercent,
    producer: producerA,
    createdAt: new Date(a.createdAt).getTime(),
    updatedAt: new Date(a.updatedAt).getTime(),
  };

  const right: Record<SortField, string | number> = {
    code: b.code,
    name: b.name,
    client: b.client ?? "",
    productionHouse: b.productionHouse ?? "",
    status: b.status,
    priority: b.priority,
    deliveryDate: b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0,
    totalShots: b.totalShots,
    completedShots: b.completedShots,
    progressPercent: b.progressPercent,
    producer: producerB,
    createdAt: new Date(b.createdAt).getTime(),
    updatedAt: new Date(b.updatedAt).getTime(),
  };

  const leftValue = left[field];
  const rightValue = right[field];

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return (leftValue - rightValue) * modifier;
  }

  return String(leftValue).localeCompare(String(rightValue)) * modifier;
}

function SortButton({
  field,
  label,
  onRequestSort,
}: {
  field: SortField;
  label: string;
  onRequestSort: (field: SortField) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRequestSort(field)}
      className="flex items-center gap-1 font-medium text-slate-300 transition hover:text-white"
    >
      <span>{label}</span>
      <ArrowDownUp className="h-3.5 w-3.5" />
    </button>
  );
}

export default function ProjectsManagement({ canCreate, canUpdate, canDelete }: ProjectsManagementProps) {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [producers, setProducers] = useState<ProducerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProjectStatus>("ACTIVE");
  const [bulkProducerId, setBulkProducerId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<ProjectView>("LIST");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [producerFilter, setProducerFilter] = useState<string>("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingId) ?? null,
    [projects, editingId]
  );

  useEffect(() => {
    setMounted(true);
    void Promise.all([loadProjects(), loadMeta()]);

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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }

  async function loadMeta() {
    try {
      const response = await fetch("/api/projects/meta", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch project metadata");
      }

      const data = (await response.json()) as { producers: ProducerOption[] };
      setProducers(data.producers);
    } catch {
      setProducers([]);
    }
  }

  const clientOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => project.client)
            .filter((client): client is string => Boolean(client))
        )
      ).sort(),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        query.length === 0 ||
        [project.code, project.name, project.client ?? "", project.productionHouse ?? "", project.producer?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      const matchesProducer = producerFilter === "ALL" || project.producerId === producerFilter;
      const matchesClient = clientFilter === "ALL" || project.client === clientFilter;
      const matchesPriority = priorityFilter === "ALL" || project.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProducer &&
        matchesClient &&
        matchesPriority &&
        matchesDueDateFilter(project, dueDateFilter)
      );
    });
  }, [projects, search, statusFilter, producerFilter, clientFilter, priorityFilter, dueDateFilter]);

  const sortedProjects = useMemo(
    () => [...filteredProjects].sort((a, b) => compareProjects(a, b, sortField, sortDirection)),
    [filteredProjects, sortField, sortDirection]
  );

  const summary = useMemo(() => {
    const source = filteredProjects;

    return {
      total: source.length,
      active: source.filter((project) => project.status === "ACTIVE").length,
      completed: source.filter((project) => project.status === "COMPLETED").length,
      onHold: source.filter((project) => project.status === "ON_HOLD").length,
      delayed: source.filter((project) => project.isDelayed).length,
    };
  }, [filteredProjects]);

  const selectedCount = selectedIds.length;
  const visibleIds = sortedProjects.map((project) => project.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function requestSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function startEdit(project: ProjectItem) {
    setEditingId(project.id);
    setForm({
      code: project.code,
      name: project.name,
      client: project.client ?? "",
      productionHouse: project.productionHouse ?? "",
      priority: project.priority,
      status: project.status,
      producerId: project.producerId ?? "",
      deliveryDate: toDateInputValue(project.deliveryDate),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  function buildPayloadFromForm() {
    return {
      code: form.code.trim(),
      name: form.name.trim(),
      client: form.client.trim() || undefined,
      productionHouse: form.productionHouse.trim() || undefined,
      priority: form.priority,
      status: form.status,
      producerId: form.producerId || undefined,
      deliveryDate: toIsoDateTime(form.deliveryDate),
    };
  }

  function buildPayloadFromProject(project: ProjectItem, overrides?: Partial<ReturnType<typeof buildPayloadFromForm>>) {
    return {
      code: project.code,
      name: project.name,
      client: project.client ?? undefined,
      productionHouse: project.productionHouse ?? undefined,
      priority: project.priority,
      status: project.status,
      producerId: project.producerId ?? undefined,
      deliveryDate: project.deliveryDate ?? undefined,
      ...overrides,
    };
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/projects/${editingId}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayloadFromForm()),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save project");
      }

      await loadProjects();
      emitDataSync("projects");
      setSuccess(isEdit ? "Project updated" : "Project created");
      cancelEdit();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    if (!window.confirm("Delete this project? It will be archived in the database.")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${id}?mode=soft`, { method: "DELETE" });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove project");
      }

      if (editingId === id) {
        cancelEdit();
      }

      await loadProjects();
      emitDataSync("projects");
      setSuccess("Project deleted");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove project");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleIds]));
    });
  }

  async function deleteSelected() {
    if (selectedCount === 0 || !window.confirm(`Delete ${selectedCount} selected projects?`)) {
      return;
    }

    setBulkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(selectedIds.map((id) => fetch(`/api/projects/${id}?mode=soft`, { method: "DELETE" })));
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

  async function updateSelectedStatus(status: ProjectStatus) {
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
            body: JSON.stringify({ status }),
          })
        )
      );

      await loadProjects();
      emitDataSync("projects");
      setSuccess(status === "ARCHIVED" ? "Selected projects archived" : "Selected project statuses updated");
    } catch {
      setError("Failed to update selected project statuses");
    } finally {
      setBulkLoading(false);
    }
  }

  async function assignSelectedProducer() {
    if (selectedCount === 0 || !bulkProducerId) {
      return;
    }

    const selectedProjects = projects.filter((project) => selectedIds.includes(project.id));
    setBulkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(
        selectedProjects.map((project) =>
          fetch(`/api/projects/${project.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayloadFromProject(project, { producerId: bulkProducerId })),
          })
        )
      );

      await loadProjects();
      emitDataSync("projects");
      setSuccess("Producer assignment updated");
    } catch {
      setError("Failed to assign producer to selected projects");
    } finally {
      setBulkLoading(false);
    }
  }

  const groupedProjects = useMemo(
    () =>
      statusOptions.map((status) => ({
        status,
        items: sortedProjects.filter((project) => project.status === status),
      })),
    [sortedProjects]
  );

  if (!mounted) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Projects", value: summary.total, tone: "text-white" },
          { label: "Active Projects", value: summary.active, tone: "text-emerald-300" },
          { label: "Completed Projects", value: summary.completed, tone: "text-sky-300" },
          { label: "On Hold", value: summary.onHold, tone: "text-amber-300" },
          { label: "Delayed Projects", value: summary.delayed, tone: "text-rose-300" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-[#0B1321] p-4 shadow-lg shadow-black/15">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {canCreate || (canUpdate && editingProject) ? (
        <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6">
          {editingProject && canUpdate ? (
            <button type="button" onClick={cancelEdit} className="mb-4 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500">
              ← Back
            </button>
          ) : null}
          <CreateProject
            projectId={editingProject?.id}
            producers={producers}
            onSuccess={() => {
              void loadProjects();
              emitDataSync("projects");
              setSuccess("Project created successfully");
              setEditingId(null);
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        </div>
      ) : null}

      <DataPanel className="space-y-5 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, client, project, or producer" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2 text-sm text-slate-400">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </div>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5 text-sm text-slate-100">
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>

            <select value={producerFilter} onChange={(event) => setProducerFilter(event.target.value)} className="rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5 text-sm text-slate-100">
              <option value="ALL">All producers</option>
              {producers.map((producer) => <option key={producer.id} value={producer.id}>{producer.name}</option>)}
            </select>

            <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5 text-sm text-slate-100">
              <option value="ALL">All clients</option>
              {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
            </select>

            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5 text-sm text-slate-100">
              <option value="ALL">All priorities</option>
              {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>

            <select value={dueDateFilter} onChange={(event) => setDueDateFilter(event.target.value as DueDateFilter)} className="rounded-2xl border border-slate-800 bg-[#0B1321] px-3 py-2.5 text-sm text-slate-100">
              <option value="ALL">All due dates</option>
              <option value="OVERDUE">Overdue</option>
              <option value="THIS_WEEK">Due this week</option>
              <option value="THIS_MONTH">Due this month</option>
              <option value="NO_DATE">No due date</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#0B1321] p-1">
            {viewOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button key={option.id} type="button" onClick={() => setView(option.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${view === option.id ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"}`}>
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {canUpdate || canDelete ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#0B1321] p-3">
          <span className="text-sm text-slate-400">Selected: {selectedCount}</span>
          <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ProjectStatus)} disabled={!canUpdate} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 disabled:opacity-50">
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="button" onClick={() => void updateSelectedStatus(bulkStatus)} disabled={!canUpdate || bulkLoading || selectedCount === 0} className="rounded-xl border border-blue-700 px-3 py-2 text-xs text-blue-300 hover:bg-blue-900/30 disabled:opacity-50">
            Change Status
          </button>
          <button type="button" onClick={() => void updateSelectedStatus("ARCHIVED")} disabled={!canUpdate || bulkLoading || selectedCount === 0} className="inline-flex items-center gap-2 rounded-xl border border-amber-700 px-3 py-2 text-xs text-amber-300 hover:bg-amber-900/20 disabled:opacity-50">
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
          <select value={bulkProducerId} onChange={(event) => setBulkProducerId(event.target.value)} disabled={!canUpdate} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 disabled:opacity-50">
            <option value="">Assign producer</option>
            {producers.map((producer) => <option key={producer.id} value={producer.id}>{producer.name}</option>)}
          </select>
          <button type="button" onClick={() => void assignSelectedProducer()} disabled={!canUpdate || bulkLoading || selectedCount === 0 || !bulkProducerId} className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-900/20 disabled:opacity-50">
            <UserRound className="h-3.5 w-3.5" /> Assign Producer
          </button>
          <button type="button" onClick={() => void deleteSelected()} disabled={!canDelete || bulkLoading || selectedCount === 0} className="rounded-xl border border-rose-700 px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/20 disabled:opacity-50">
            Delete
          </button>
        </div>
        ) : null}

        {loading ? <LoadingState text="Loading projects..." /> : null}
        {!loading && sortedProjects.length === 0 ? <EmptyState text="No projects match the current filters." /> : null}

        {!loading && sortedProjects.length > 0 && view === "LIST" ? (
          <TableWrapper>
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#0B1321] text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} aria-label="Select visible projects" /></th>
                  <th className="px-3 py-3"><SortButton field="code" label="Code" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="name" label="Project" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="client" label="Client" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="productionHouse" label="Production House" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="status" label="Status" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="priority" label="Priority" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="deliveryDate" label="Due Date" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="totalShots" label="Shots" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="completedShots" label="Done" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="progressPercent" label="Progress" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="producer" label="Producer" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="createdAt" label="Created" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3"><SortButton field="updatedAt" label="Updated" onRequestSort={requestSort} /></th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((project) => (
                  <tr key={project.id} className="border-t border-slate-800 text-slate-200 transition hover:bg-white/[0.02]">
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => toggleSelect(project.id)} aria-label={`Select ${project.name}`} /></td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-300">{project.code}</td>
                    <td className="px-3 py-3"><div className="font-medium text-white">{project.name}</div><div className="mt-1 text-xs text-slate-500">{project.description ?? "No description"}</div></td>
                    <td className="px-3 py-3">{project.client ?? "-"}</td>
                    <td className="px-3 py-3">{project.productionHouse ?? "-"}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(project.status)}`}>{project.status}</span></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadgeClass(project.priority)}`}>{project.priority}</span></td>
                    <td className="px-3 py-3"><div>{formatDate(project.deliveryDate)}</div>{project.isDelayed ? <div className="mt-1 text-xs text-rose-400">Delayed</div> : null}</td>
                    <td className="px-3 py-3">{project.totalShots}</td>
                    <td className="px-3 py-3">{project.completedShots}</td>
                    <td className="px-3 py-3"><div className="w-28"><div className="mb-1 flex items-center justify-between text-xs text-slate-400"><span>{project.progressPercent}%</span><span>{project.completedShots}/{project.totalShots}</span></div><div className="h-2 rounded-full bg-slate-900"><div className={`h-2 rounded-full ${progressBarClass(project.progressPercent)}`} style={{ width: `${project.progressPercent}%` }} /></div></div></td>
                    <td className="px-3 py-3">{project.producer?.name ?? "Unassigned"}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{formatDate(project.createdAt)}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{formatDate(project.updatedAt)}</td>
                    <td className="px-3 py-3"><div className="flex justify-end gap-2">{canUpdate ? <button type="button" onClick={() => startEdit(project)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-500">Edit</button> : null}{canDelete ? <button type="button" onClick={() => void removeProject(project.id)} className="rounded-lg border border-rose-700 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-900/20">Delete</button> : null}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : null}

        {!loading && sortedProjects.length > 0 && view === "GRID" ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <article key={project.id} className="rounded-3xl border border-slate-800 bg-[#0B1321] p-5 shadow-lg shadow-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => toggleSelect(project.id)} aria-label={`Select ${project.name}`} /><p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">{project.code}</p></div>
                    <h3 className="mt-3 text-xl font-semibold text-white">{project.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{project.client ?? "No client"} {project.productionHouse ? `• ${project.productionHouse}` : ""}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(project.status)}`}>{project.status}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadgeClass(project.priority)}`}>{project.priority}</span></div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Assigned Producer</p><p className="mt-2 text-sm text-slate-100">{project.producer?.name ?? "Unassigned"}</p></div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Due Date</p><p className="mt-2 text-sm text-slate-100">{formatDate(project.deliveryDate)}</p>{project.isDelayed ? <p className="mt-1 text-xs text-rose-400">Past due</p> : null}</div>
                </div>

                <div className="mt-5"><div className="mb-2 flex items-center justify-between text-sm text-slate-300"><span>Progress</span><span>{project.progressPercent}%</span></div><div className="h-2.5 rounded-full bg-slate-900"><div className={`h-2.5 rounded-full ${progressBarClass(project.progressPercent)}`} style={{ width: `${project.progressPercent}%` }} /></div><div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{project.totalShots} total shots</span><span>{project.completedShots} completed</span></div></div>

                <div className="mt-5 flex gap-2">{canUpdate ? <button type="button" onClick={() => startEdit(project)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500">Edit</button> : null}{canDelete ? <button type="button" onClick={() => void removeProject(project.id)} className="rounded-xl border border-rose-700 px-3 py-2 text-sm text-rose-300 hover:bg-rose-900/20">Delete</button> : null}</div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && sortedProjects.length > 0 && view === "KANBAN" ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {groupedProjects.map((column) => (
              <section key={column.status} className="rounded-3xl border border-slate-800 bg-[#0B1321] p-4">
                <div className="mb-4 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(column.status)}`}>{column.status}</span><span className="text-xs text-slate-500">{column.items.length}</span></div>
                <div className="space-y-3">
                  {column.items.map((project) => (
                    <article key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                      <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => toggleSelect(project.id)} aria-label={`Select ${project.name}`} /><span className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">{project.code}</span></div><h3 className="mt-3 text-base font-semibold text-white">{project.name}</h3></div><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityBadgeClass(project.priority)}`}>{project.priority}</span></div>
                      <div className="mt-4 space-y-2 text-sm text-slate-400"><div className="flex items-center gap-2"><UserRound className="h-4 w-4" /> {project.producer?.name ?? "Unassigned"}</div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(project.deliveryDate)}</div></div>
                      <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{project.completedShots}/{project.totalShots} shots done</span><span>{project.progressPercent}%</span></div><div className="h-2 rounded-full bg-slate-900"><div className={`h-2 rounded-full ${progressBarClass(project.progressPercent)}`} style={{ width: `${project.progressPercent}%` }} /></div></div>
                      <div className="mt-4 flex gap-2">{canUpdate ? <button type="button" onClick={() => startEdit(project)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-500">Edit</button> : null}{canDelete ? <button type="button" onClick={() => void removeProject(project.id)} className="rounded-lg border border-rose-700 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-900/20">Delete</button> : null}</div>
                    </article>
                  ))}
                  {column.items.length === 0 ? <EmptyState text="No projects in this lane." /> : null}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </DataPanel>
    </section>
  );
}
