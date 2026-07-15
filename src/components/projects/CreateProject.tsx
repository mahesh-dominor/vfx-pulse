"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, Download, GripVertical, Plus, Trash2, Upload, X } from "lucide-react";
import { emitDataSync } from "@/lib/live-sync";

interface Episode {
  id: string;
  code: string;
  sortOrder: number;
  _count?: { sequences: number };
}

interface Sequence {
  id: string;
  code: string;
  name: string;
  episodeId?: string;
  description?: string;
  sortOrder: number;
  episode?: { id: string; code: string };
}

interface ProjectFormData {
  code: string;
  name: string;
  client: string;
  productionHouse: string;
  producer: string;
  priority: string;
  status: string;
  deliveryDate: string;
}

const defaultForm: ProjectFormData = {
  code: "",
  name: "",
  client: "",
  productionHouse: "",
  producer: "",
  priority: "MEDIUM",
  status: "ACTIVE",
  deliveryDate: "",
};

interface CreateProjectProps {
  projectId?: string;
  onSuccess?: () => void;
  producers?: Array<{ id: string; name: string; email: string }>;
}

export default function CreateProject({ projectId, onSuccess, producers = [] }: CreateProjectProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProjectFormData>(defaultForm);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [episodeInput, setEpisodeInput] = useState("");
  const [selectedEpisodeIdForSeq, setSelectedEpisodeIdForSeq] = useState<string>("");
  const [sequenceCode, setSequenceCode] = useState("");
  const [sequenceName, setSequenceName] = useState("");
  const [draggedEpisode, setDraggedEpisode] = useState<string | null>(null);
  const [draggedSequence, setDraggedSequence] = useState<string | null>(null);
  const [showEpisodeImport, setShowEpisodeImport] = useState(false);
  const [showSequenceImport, setShowSequenceImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      void loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Load project data
      const projectRes = await fetch(`/api/projects?id=${projectId}`);
      if (projectRes.ok) {
        const projects = await projectRes.json();
        const project = Array.isArray(projects) ? projects[0] : projects;
        if (project) {
          setForm({
            code: project.code,
            name: project.name,
            client: project.client || "",
            productionHouse: project.productionHouse || "",
            producer: project.producerId || "",
            priority: project.priority,
            status: project.status,
            deliveryDate: project.deliveryDate ? project.deliveryDate.split("T")[0] : "",
          });
        }
      }

      // Load episodes
      const episodesRes = await fetch(`/api/episodes?projectId=${projectId}`);
      if (episodesRes.ok) {
        const loadedEpisodes = await episodesRes.json();
        setEpisodes(Array.isArray(loadedEpisodes) ? loadedEpisodes : []);
      }

      // Load sequences
      const sequencesRes = await fetch(`/api/sequences?projectId=${projectId}`);
      if (sequencesRes.ok) {
        const loadedSequences = await sequencesRes.json();
        setSequences(Array.isArray(loadedSequences) ? loadedSequences : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const addEpisode = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        setError("Episode code cannot be empty");
        return;
      }

      if (episodes.some((e) => e.code === trimmed)) {
        setError("Episode already exists");
        return;
      }

      const newEpisode: Episode = {
        id: `temp-${Date.now()}`,
        code: trimmed,
        sortOrder: episodes.length,
      };

      setEpisodes([...episodes, newEpisode]);
      setError(null);
    },
    [episodes]
  );

  const addSequence = useCallback(() => {
    const code = sequenceCode.trim().toUpperCase();
    const name = sequenceName.trim();

    if (!code || !name) {
      setError("Sequence code and name are required");
      return;
    }

    if (sequences.some((s) => s.code === code)) {
      setError("Sequence code already exists");
      return;
    }

    const newSequence: Sequence = {
      id: `temp-${Date.now()}`,
      code,
      name,
      episodeId: selectedEpisodeIdForSeq,
      sortOrder: sequences.length,
    };

    setSequences([...sequences, newSequence]);
    setSequenceCode("");
    setSequenceName("");
    setSelectedEpisodeIdForSeq("");
    setError(null);
  }, [sequenceCode, sequenceName, selectedEpisodeIdForSeq, sequences]);

  const removeEpisode = useCallback(
    (id: string) => {
      setEpisodes(episodes.filter((e) => e.id !== id));
      // Remove sequences linked to this episode
      setSequences(sequences.filter((s) => s.episodeId !== id));
    },
    [episodes, sequences]
  );

  const removeSequence = useCallback((id: string) => {
    setSequences((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleEpisodePaste = (text: string) => {
    const codes = text.split(/[,\n]/).map((c) => c.trim()).filter(Boolean);
    codes.forEach((code) => addEpisode(code));
  };

  const handleBulkEpisodeImport = async (file: File) => {
    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // Skip header if it looks like CSV
      let startIndex = 0;
      if (lines[0]?.toLowerCase() === "episode" || lines[0]?.toLowerCase() === "code") {
        startIndex = 1;
      }

      const codes = lines.slice(startIndex);
      codes.forEach((code) => addEpisode(code));
      setShowEpisodeImport(false);
      setSuccess(`Imported ${codes.length} episodes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import episodes");
    } finally {
      setImporting(false);
    }
  };

  const handleBulkSequenceImport = async (file: File) => {
    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // Parse CSV header
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
      const codeIndex = headers.indexOf("code") ?? headers.indexOf("sequence code") ?? 0;
      const nameIndex = headers.indexOf("name") ?? headers.indexOf("sequence name") ?? 1;
      const episodeIndex = headers.indexOf("episode");

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i]?.split(",").map((p) => p.trim()) ?? [];
        const code = parts[codeIndex];
        const name = parts[nameIndex];

        if (code && name) {
          const newSeq: Sequence = {
            id: `temp-${Date.now()}-${i}`,
            code: code.toUpperCase(),
            name,
            sortOrder: sequences.length + imported,
          };

          setSequences((prev) => [...prev, newSeq]);
          imported++;
        }
      }

      setShowSequenceImport(false);
      setSuccess(`Imported ${imported} sequences`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import sequences");
    } finally {
      setImporting(false);
    }
  };

  // Convert date from "YYYY-MM-DD" to ISO datetime format
  const toIsoDateTime = (value: string) => {
    return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
  };

  const saveProject = async () => {
    if (!form.code || !form.name) {
      setError("Project code and name are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Create project
      const projectRes = await fetch("/api/projects", {
        method: projectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(projectId && { id: projectId }),
          ...form,
          ...(form.deliveryDate && { deliveryDate: toIsoDateTime(form.deliveryDate) }),
        }),
      });

      if (!projectRes.ok) {
        let errorMsg = "Failed to save project";
        try {
          const data = await projectRes.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `${projectRes.status} ${projectRes.statusText}`;
        }
        throw new Error(errorMsg);
      }

      let savedProject;
      try {
        savedProject = await projectRes.json();
      } catch (e) {
        console.error("Failed to parse project response:", await projectRes.text());
        throw new Error("Invalid response from server while saving project");
      }
      const projId = projectId || savedProject.id;

      // Save episodes
      for (const episode of episodes) {
        if (episode.id.startsWith("temp-")) {
          const episodeRes = await fetch("/api/episodes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: episode.code,
              projectId: projId,
              sortOrder: episode.sortOrder,
            }),
          });

          if (!episodeRes.ok) {
            let errorMsg = `Failed to save episode ${episode.code}`;
            try {
              const data = await episodeRes.json();
              errorMsg = `Failed to save episode ${episode.code}: ${data.error || episodeRes.statusText}`;
            } catch {
              errorMsg = `Failed to save episode ${episode.code}: ${episodeRes.status} ${episodeRes.statusText}`;
            }
            throw new Error(errorMsg);
          }
        }
      }

      // Save sequences
      for (const sequence of sequences) {
        if (sequence.id.startsWith("temp-")) {
          const payload = {
            code: sequence.code,
            name: sequence.name,
            projectId: projId,
            ...(sequence.episodeId && { episodeId: sequence.episodeId }),
            ...(sequence.description && { description: sequence.description }),
            sortOrder: sequence.sortOrder,
          };
          console.log("Sequence payload:", JSON.stringify(payload, null, 2));
          
          const sequenceRes = await fetch("/api/sequences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!sequenceRes.ok) {
            let errorMsg = `Failed to save sequence ${sequence.code}`;
            try {
              const data = await sequenceRes.json();
              errorMsg = `Failed to save sequence ${sequence.code}: ${data.error || sequenceRes.statusText}`;
            } catch {
              errorMsg = `Failed to save sequence ${sequence.code}: ${sequenceRes.status} ${sequenceRes.statusText}`;
            }
            throw new Error(errorMsg);
          }
        }
      }

      setSuccess("Project created successfully!");
      setForm(defaultForm);
      setEpisodes([]);
      setSequences([]);
      emitDataSync("projects");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full border-2 border-slate-700 border-t-blue-500 h-8 w-8" />
          <p className="mt-2 text-sm text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Project Basic Info */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">Project Information</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Project Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g., LEGACY"
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Client</label>
            <input
              type="text"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder="Client name"
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Production House</label>
            <input
              type="text"
              value={form.productionHouse}
              onChange={(e) => setForm({ ...form, productionHouse: e.target.value })}
              placeholder="Production house"
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Delivery Date</label>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Producer</label>
            <select
              value={form.producer}
              onChange={(e) => setForm({ ...form, producer: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Select producer</option>
              {producers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Episodes Management */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Episodes</h3>
            <p className="text-sm text-slate-400">{episodes.length} episode{episodes.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEpisodeImport(!showEpisodeImport)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-600"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>

        {showEpisodeImport && (
          <div className="rounded-lg border border-slate-700 bg-[#0B1321] p-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">CSV/TXT File</label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleBulkEpisodeImport(file);
                }}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm file:bg-blue-600 file:text-white file:border-0 file:px-2 file:rounded"
              />
              <p className="mt-2 text-xs text-slate-500">Format: One episode code per line (EP101, EP102...)</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={episodeInput}
            onChange={(e) => setEpisodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addEpisode(episodeInput);
                setEpisodeInput("");
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text");
              setEpisodeInput("");
              handleEpisodePaste(text);
            }}
            placeholder="Type episode code (e.g., EP101) or paste multiple (comma/newline separated)"
            className="flex-1 rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <button
            onClick={() => {
              addEpisode(episodeInput);
              setEpisodeInput("");
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-10">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              draggable
              onDragStart={() => setDraggedEpisode(episode.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedEpisode && draggedEpisode !== episode.id) {
                  const draggedIndex = episodes.findIndex((e) => e.id === draggedEpisode);
                  const targetIndex = episodes.findIndex((e) => e.id === episode.id);
                  const newEpisodes = [...episodes];
                  [newEpisodes[draggedIndex], newEpisodes[targetIndex]] = [
                    newEpisodes[targetIndex],
                    newEpisodes[draggedIndex],
                  ];
                  setEpisodes(newEpisodes);
                  setDraggedEpisode(null);
                }
              }}
              className="group flex cursor-move items-center gap-2 rounded-full bg-emerald-600/20 px-4 py-2 text-sm text-emerald-300 border border-emerald-600/50 hover:border-emerald-500"
            >
              <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-100" />
              {episode.code}
              <button
                onClick={() => removeEpisode(episode.id)}
                className="ml-1 opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sequences Management */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Sequences</h3>
            <p className="text-sm text-slate-400">{sequences.length} sequence{sequences.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowSequenceImport(!showSequenceImport)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-600"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>

        {showSequenceImport && (
          <div className="rounded-lg border border-slate-700 bg-[#0B1321] p-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleBulkSequenceImport(file);
                }}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm file:bg-blue-600 file:text-white file:border-0 file:px-2 file:rounded"
              />
              <p className="mt-2 text-xs text-slate-500">Format: code,name (e.g., SQ001,Opening)</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            value={sequenceCode}
            onChange={(e) => setSequenceCode(e.target.value)}
            placeholder="Sequence Code (e.g., SQ001)"
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />
          <input
            type="text"
            value={sequenceName}
            onChange={(e) => setSequenceName(e.target.value)}
            placeholder="Sequence Name (e.g., Opening)"
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={selectedEpisodeIdForSeq}
            onChange={(e) => setSelectedEpisodeIdForSeq(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Optional: Link to Episode</option>
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.code}
              </option>
            ))}
          </select>
          <button
            onClick={addSequence}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Sequence
          </button>
        </div>

        <div className="space-y-2">
          {sequences.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No sequences added yet</p>
          ) : (
            sequences.map((seq) => (
              <div
                key={seq.id}
                draggable
                onDragStart={() => setDraggedSequence(seq.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedSequence && draggedSequence !== seq.id) {
                    const draggedIndex = sequences.findIndex((s) => s.id === draggedSequence);
                    const targetIndex = sequences.findIndex((s) => s.id === seq.id);
                    const newSequences = [...sequences];
                    [newSequences[draggedIndex], newSequences[targetIndex]] = [
                      newSequences[targetIndex],
                      newSequences[draggedIndex],
                    ];
                    setSequences(newSequences);
                    setDraggedSequence(null);
                  }
                }}
                className="group flex cursor-move items-center justify-between rounded-lg border border-slate-700 bg-[#0B1321] p-4 hover:border-slate-600"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{seq.code}</span>
                      <span className="text-slate-400">{seq.name}</span>
                    </div>
                    {seq.episodeId && (
                      <p className="text-xs text-slate-500">
                        Episode: {episodes.find((e) => e.id === seq.episodeId)?.code}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeSequence(seq.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages and Actions */}
      {error && <div className="rounded-lg bg-rose-500/10 border border-rose-500/50 p-3 text-sm text-rose-300">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/50 p-3 text-sm text-emerald-300">{success}</div>}

      <div className="flex gap-3">
        <button
          onClick={saveProject}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Project"}
        </button>
      </div>
    </div>
  );
}
