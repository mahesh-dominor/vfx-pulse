"use client";

import { useEffect, useState } from "react";

import { USER_PERMISSION_MODULES, USER_ROLES } from "@/constants/users";
import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";

type StudioItem = { id: string; key: string; value: string };
type DepartmentItem = { id: string; name: string; code: string; isActive: boolean };
type StatusItem = { id: string; module: string; name: string; colorHex: string | null; isActive: boolean };
type PriorityItem = { id: string; module: string; name: string; level: number; isActive: boolean };

type SettingsPayload = {
  studio: StudioItem[];
  departments: DepartmentItem[];
  statuses: StatusItem[];
  priorities: PriorityItem[];
};

function toStudioMap(studio: StudioItem[]) {
  return Object.fromEntries(studio.map((item) => [item.key, item.value])) as Record<string, string>;
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState<SettingsPayload>({
    studio: [],
    departments: [],
    statuses: [],
    priorities: [],
  });

  const [company, setCompany] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
  });

  const [designationCsv, setDesignationCsv] = useState("");

  const [projectDefaults, setProjectDefaults] = useState({
    default_fps: "24",
    default_resolution: "1920x1080",
    default_color_space: "ACEScg",
    default_priority: "3",
  });

  const [preferences, setPreferences] = useState({
    app_url: "http://localhost:3000",
    app_timezone: "UTC",
    app_date_format: "YYYY-MM-DD",
    app_auto_refresh_seconds: "30",
    nav_badge_warning_threshold: "10",
    nav_badge_critical_threshold: "20",
  });

  const [newDepartment, setNewDepartment] = useState({ name: "", code: "", isActive: true });
  const [newStatus, setNewStatus] = useState({ module: "shots", name: "", colorHex: "#22c55e", isActive: true });
  const [newPriority, setNewPriority] = useState({ module: "shots", name: "", level: "1", isActive: true });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();

    const unsubscribe = subscribeDataSync(() => {
      void loadSettings();
    });

    return unsubscribe;
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to fetch settings");
      }

      const data = (await response.json()) as SettingsPayload;
      setSettings(data);

      const studioMap = toStudioMap(data.studio);
      setCompany({
        company_name: studioMap.company_name ?? "",
        company_email: studioMap.company_email ?? "",
        company_phone: studioMap.company_phone ?? "",
        company_address: studioMap.company_address ?? "",
      });
      setDesignationCsv(studioMap.designations ?? "JUNIOR_ARTIST,MID_ARTIST,SENIOR_ARTIST,LEAD,SUPERVISOR");
      setProjectDefaults({
        default_fps: studioMap.default_fps ?? "24",
        default_resolution: studioMap.default_resolution ?? "1920x1080",
        default_color_space: studioMap.default_color_space ?? "ACEScg",
        default_priority: studioMap.default_priority ?? "3",
      });
      setPreferences({
        app_url: studioMap.app_url ?? "http://localhost:3000",
        app_timezone: studioMap.app_timezone ?? "UTC",
        app_date_format: studioMap.app_date_format ?? "YYYY-MM-DD",
        app_auto_refresh_seconds: studioMap.app_auto_refresh_seconds ?? "30",
        nav_badge_warning_threshold: studioMap.nav_badge_warning_threshold ?? "10",
        nav_badge_critical_threshold: studioMap.nav_badge_critical_threshold ?? "20",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to fetch settings");
    } finally {
      setLoading(false);
    }
  }

  async function upsertStudioPair(key: string, value: string) {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "studio", payload: { key, value } }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? `Failed to save ${key}`);
    }
  }

  async function saveStudioGroup(entries: Record<string, string>) {
    setSaving(true);
    setError(null);

    try {
      await Promise.all(Object.entries(entries).map(([key, value]) => upsertStudioPair(key, value)));
      await loadSettings();
      emitDataSync("settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function createDepartment() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "department", payload: newDepartment }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create department");
      }

      setNewDepartment({ name: "", code: "", isActive: true });
      await loadSettings();
      emitDataSync("settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create department");
    } finally {
      setSaving(false);
    }
  }

  async function createStatus() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "status", payload: newStatus }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create status");
      }

      setNewStatus({ module: "shots", name: "", colorHex: "#22c55e", isActive: true });
      await loadSettings();
      emitDataSync("settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create status");
    } finally {
      setSaving(false);
    }
  }

  async function createPriority() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "priority", payload: { ...newPriority, level: Number(newPriority.level) } }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create priority");
      }

      setNewPriority({ module: "shots", name: "", level: "1", isActive: true });
      await loadSettings();
      emitDataSync("settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create priority");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(type: "department" | "status" | "priority", id: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings?type=${type}&id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove settings item");
      }

      await loadSettings();
      emitDataSync("settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove settings item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      {error ? <p className="rounded border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-slate-300">Loading settings...</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Company Information</h2>
          <div className="grid gap-2">
            <input value={company.company_name} onChange={(e) => setCompany((prev) => ({ ...prev, company_name: e.target.value }))} placeholder="Company Name" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={company.company_email} onChange={(e) => setCompany((prev) => ({ ...prev, company_email: e.target.value }))} placeholder="Company Email" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={company.company_phone} onChange={(e) => setCompany((prev) => ({ ...prev, company_phone: e.target.value }))} placeholder="Company Phone" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={company.company_address} onChange={(e) => setCompany((prev) => ({ ...prev, company_address: e.target.value }))} placeholder="Company Address" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void saveStudioGroup(company)} className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Save Company Info</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Designations</h2>
          <textarea value={designationCsv} onChange={(e) => setDesignationCsv(e.target.value)} className="min-h-24 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
          <button type="button" disabled={saving} onClick={() => void saveStudioGroup({ designations: designationCsv })} className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Save Designations</button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Project Defaults</h2>
          <div className="grid gap-2">
            <input value={projectDefaults.default_fps} onChange={(e) => setProjectDefaults((prev) => ({ ...prev, default_fps: e.target.value }))} placeholder="Default FPS" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={projectDefaults.default_resolution} onChange={(e) => setProjectDefaults((prev) => ({ ...prev, default_resolution: e.target.value }))} placeholder="Default Resolution" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={projectDefaults.default_color_space} onChange={(e) => setProjectDefaults((prev) => ({ ...prev, default_color_space: e.target.value }))} placeholder="Default Color Space" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={projectDefaults.default_priority} onChange={(e) => setProjectDefaults((prev) => ({ ...prev, default_priority: e.target.value }))} placeholder="Default Priority" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void saveStudioGroup(projectDefaults)} className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Save Project Defaults</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">General Application Preferences</h2>
          <div className="grid gap-2">
            <input value={preferences.app_url} onChange={(e) => setPreferences((prev) => ({ ...prev, app_url: e.target.value }))} placeholder="Application URL" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={preferences.app_timezone} onChange={(e) => setPreferences((prev) => ({ ...prev, app_timezone: e.target.value }))} placeholder="Timezone" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={preferences.app_date_format} onChange={(e) => setPreferences((prev) => ({ ...prev, app_date_format: e.target.value }))} placeholder="Date Format" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={preferences.app_auto_refresh_seconds} onChange={(e) => setPreferences((prev) => ({ ...prev, app_auto_refresh_seconds: e.target.value }))} placeholder="Auto Refresh Seconds" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={preferences.nav_badge_warning_threshold} onChange={(e) => setPreferences((prev) => ({ ...prev, nav_badge_warning_threshold: e.target.value }))} placeholder="Nav Badge Warning Threshold" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <input value={preferences.nav_badge_critical_threshold} onChange={(e) => setPreferences((prev) => ({ ...prev, nav_badge_critical_threshold: e.target.value }))} placeholder="Nav Badge Critical Threshold" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void saveStudioGroup(preferences)} className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Save Preferences</button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Departments</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {settings.departments.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-slate-800 px-2 py-1">
                <span>{item.code} - {item.name}</span>
                <button type="button" onClick={() => void removeItem("department", item.id)} className="text-xs text-red-300">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <input value={newDepartment.name} onChange={(e) => setNewDepartment((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <input value={newDepartment.code} onChange={(e) => setNewDepartment((prev) => ({ ...prev, code: e.target.value }))} placeholder="Code" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void createDepartment()} className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Add Department</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Status Management</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {settings.statuses.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-slate-800 px-2 py-1">
                <span>{item.module}: {item.name}</span>
                <button type="button" onClick={() => void removeItem("status", item.id)} className="text-xs text-red-300">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <input value={newStatus.module} onChange={(e) => setNewStatus((prev) => ({ ...prev, module: e.target.value }))} placeholder="Module" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <input value={newStatus.name} onChange={(e) => setNewStatus((prev) => ({ ...prev, name: e.target.value }))} placeholder="Status Name" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <input value={newStatus.colorHex} onChange={(e) => setNewStatus((prev) => ({ ...prev, colorHex: e.target.value }))} placeholder="Color Hex" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void createStatus()} className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Add Status</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Priority Management</h2>
          <div className="space-y-2 text-sm text-slate-300">
            {settings.priorities.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-slate-800 px-2 py-1">
                <span>{item.module}: L{item.level} {item.name}</span>
                <button type="button" onClick={() => void removeItem("priority", item.id)} className="text-xs text-red-300">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <input value={newPriority.module} onChange={(e) => setNewPriority((prev) => ({ ...prev, module: e.target.value }))} placeholder="Module" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <input value={newPriority.name} onChange={(e) => setNewPriority((prev) => ({ ...prev, name: e.target.value }))} placeholder="Priority Name" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <input value={newPriority.level} onChange={(e) => setNewPriority((prev) => ({ ...prev, level: e.target.value }))} placeholder="Level" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100" />
            <button type="button" disabled={saving} onClick={() => void createPriority()} className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-60">Add Priority</button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">User Roles & Permissions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-slate-400">Roles</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {USER_ROLES.map((role) => (
                <span key={role} className="rounded border border-slate-700 px-2 py-1">{role}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-400">Permission Modules</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {USER_PERMISSION_MODULES.map((module) => (
                <span key={module} className="rounded border border-slate-700 px-2 py-1">{module}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
