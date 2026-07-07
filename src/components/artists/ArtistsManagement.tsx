"use client";

import { useEffect, useMemo, useState } from "react";
import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { pendingCrudLabel } from "@/components/ui/async-action-label";
import { DataPanel, EmptyState, LoadingState, TableWrapper } from "@/components/ui/data-states";

type ArtistDesignation =
  | "JUNIOR_ARTIST"
  | "MID_ARTIST"
  | "SENIOR_ARTIST"
  | "LEAD"
  | "SUPERVISOR";

type ArtistDepartment =
  | "PREP"
  | "MATCHMOVE"
  | "LAYOUT"
  | "ANIMATION"
  | "FX"
  | "LIGHTING"
  | "COMPOSITING"
  | "ROTO"
  | "PAINT"
  | "QC"
  | "PRODUCTION";

type ArtistItem = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  designation: ArtistDesignation;
  department: ArtistDepartment;
  joiningDate: string;
  isActive: boolean;
};

type ArtistForm = {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  designation: ArtistDesignation;
  department: ArtistDepartment;
  joiningDate: string;
  isActive: boolean;
};

const designationOptions: ArtistDesignation[] = [
  "JUNIOR_ARTIST",
  "MID_ARTIST",
  "SENIOR_ARTIST",
  "LEAD",
  "SUPERVISOR",
];

const departmentOptions: ArtistDepartment[] = [
  "PREP",
  "MATCHMOVE",
  "LAYOUT",
  "ANIMATION",
  "FX",
  "LIGHTING",
  "COMPOSITING",
  "ROTO",
  "PAINT",
  "QC",
  "PRODUCTION",
];

const defaultForm: ArtistForm = {
  employeeId: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  designation: "JUNIOR_ARTIST",
  department: "PRODUCTION",
  joiningDate: new Date().toISOString().slice(0, 10),
  isActive: true,
};

export default function ArtistsManagement() {
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkActive, setBulkActive] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<ArtistForm>(defaultForm);

  const editingArtist = useMemo(
    () => artists.find((artist) => artist.id === editingId) ?? null,
    [artists, editingId]
  );

  useEffect(() => {
    void loadArtists();

    const unsubscribe = subscribeDataSync(() => {
      void loadArtists();
    });

    return unsubscribe;
  }, []);

  async function loadArtists() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/artists", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load artists");
      }

      const data = (await response.json()) as ArtistItem[];
      setArtists(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((artist) => artist.id === id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = selectedIds.length;
  const allSelected = artists.length > 0 && selectedCount === artists.length;

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultForm);
    setIsFormOpen(true);
  }

  function openEditModal(artist: ArtistItem) {
    setEditingId(artist.id);
    setForm({
      employeeId: artist.employeeId,
      fullName: artist.fullName,
      email: artist.email,
      phoneNumber: artist.phoneNumber ?? "",
      designation: artist.designation,
      department: artist.department,
      joiningDate: artist.joiningDate.slice(0, 10),
      isActive: artist.isActive,
    });
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function saveArtist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      employeeId: form.employeeId.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      designation: form.designation,
      department: form.department,
      joiningDate: new Date(form.joiningDate).toISOString(),
      isActive: form.isActive,
    };

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/artists/${editingId}` : "/api/artists";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save artist");
      }

      await loadArtists();
      emitDataSync("artists");
      setSuccess(editingId ? "Artist updated" : "Artist created");
      closeFormModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save artist");
    } finally {
      setSaving(false);
    }
  }

  async function removeArtist() {
    if (!deletingId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/artists/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove artist");
      }

      setDeletingId(null);
      await loadArtists();
      emitDataSync("artists");
      setSuccess("Artist removed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove artist");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : artists.map((artist) => artist.id));
  }

  function exportSelected() {
    if (selectedCount === 0) {
      return;
    }

    const selected = artists.filter((artist) => selectedIds.includes(artist.id));
    const rows = [
      "employeeId,fullName,email,department,designation,status",
      ...selected.map(
        (artist) =>
          `${artist.employeeId},${artist.fullName},${artist.email},${artist.department},${artist.designation},${artist.isActive ? "Active" : "Inactive"}`
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artists-selected.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSelected() {
    if (selectedCount === 0) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedCount} selected artists?`);
    if (!confirmed) {
      return;
    }

    setBulkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/artists/${id}`, {
            method: "DELETE",
          })
        )
      );

      setSelectedIds([]);
      await loadArtists();
      emitDataSync("artists");
      setSuccess("Selected artists removed");
    } catch {
      setError("Failed to remove selected artists");
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
          fetch(`/api/artists/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: bulkActive }),
          })
        )
      );

      await loadArtists();
      emitDataSync("artists");
      setSuccess("Selected artist statuses updated");
    } catch {
      setError("Failed to update selected artist statuses");
    } finally {
      setBulkLoading(false);
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
          Add Artist
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

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
            value={bulkActive ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => setBulkActive(e.target.value === "ACTIVE")}
            className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-xs text-slate-100"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
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
          <LoadingState text="Loading artists..." />
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
                    aria-label="Select all artists"
                  />
                </th>
                <th className="px-3 py-2">Employee ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(artist.id)}
                      onChange={() => toggleSelect(artist.id)}
                      aria-label={`Select ${artist.fullName}`}
                    />
                  </td>
                  <td className="px-3 py-2">{artist.employeeId}</td>
                  <td className="px-3 py-2">{artist.fullName}</td>
                  <td className="px-3 py-2">{artist.email}</td>
                  <td className="px-3 py-2">{artist.department}</td>
                  <td className="px-3 py-2">{artist.designation}</td>
                  <td className="px-3 py-2">{artist.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(artist)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(artist.id)}
                        className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {artists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-3">
                    <EmptyState text="No artists found." />
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
              {editingArtist ? "Edit Artist" : "Add Artist"}
            </h2>
            <form onSubmit={saveArtist} className="grid gap-3 md:grid-cols-2">
              <input
                value={form.employeeId}
                onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                placeholder="Employee ID"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full Name"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                type="email"
                placeholder="Email"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Phone Number"
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              />
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, department: e.target.value as ArtistDepartment }))
                }
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              >
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.designation}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, designation: e.target.value as ArtistDesignation }))
                }
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
              >
                {designationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                required
              />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active artist
              </label>

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {pendingCrudLabel(saving, editingArtist ? "update" : "create", "Artist")}
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
            <h2 className="text-lg font-semibold text-slate-100">Remove Artist</h2>
            <p className="mt-2 text-sm text-slate-300">This will soft-delete the artist. Continue?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void removeArtist()}
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
