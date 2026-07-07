"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { pendingLabel } from "@/components/ui/async-action-label";

interface Project {
  id: string;
  code: string;
  name: string;
}

interface Shot {
  id: string;
  code: string;
  shotName: string;
}

export default function DailyUpdateForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectId: "",
    shotId: "",
    hoursWorked: 8,
    taskType: "Compositing",
    status: "WIP",
    comments: "",
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, projectId: data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShots = async (projectId: string) => {
    try {
      const response = await fetch(`/api/shots?projectId=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch shots");
      const data = await response.json();
      setShots(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, shotId: data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to load shots");
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (formData.projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchShots(formData.projectId);
    }
  }, [formData.projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/daily-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit update");
      }

      toast.success("Daily update submitted successfully!");
      setFormData({
        projectId: projects[0]?.id || "",
        shotId: shots[0]?.id || "",
        hoursWorked: 8,
        taskType: "Compositing",
        status: "WIP",
        comments: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white disabled:opacity-50"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Shot *
            </label>
            <select
              value={formData.shotId}
              onChange={(e) =>
                setFormData({ ...formData, shotId: e.target.value })
              }
              disabled={loading || shots.length === 0}
              className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white disabled:opacity-50"
              required
            >
              <option value="">Select a shot</option>
              {shots.map((shot) => (
                <option key={shot.id} value={shot.id}>
                  {shot.code || shot.shotName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Hours Worked *
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formData.hoursWorked}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hoursWorked: parseFloat(e.target.value),
                })
              }
              className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Task Type *
            </label>
            <select
              value={formData.taskType}
              onChange={(e) =>
                setFormData({ ...formData, taskType: e.target.value })
              }
              className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white"
              required
            >
              <option>Compositing</option>
              <option>Prep</option>
              <option>Lighting</option>
              <option>Animation</option>
              <option>FX</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white"
            required
          >
            <option value="WIP">WIP</option>
            <option value="INTERNAL_REVIEW">Internal Review</option>
            <option value="CLIENT_REVIEW">Client Review</option>
            <option value="APPROVED">Approved</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Today&apos;s Progress
          </label>
          <textarea
            rows={6}
            value={formData.comments}
            onChange={(e) =>
              setFormData({ ...formData, comments: e.target.value })
            }
            className="w-full rounded-xl bg-[#151F31] border border-slate-700 p-4 text-white placeholder:text-slate-500"
            placeholder="Describe today's work..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-6 py-3 border border-slate-700 rounded-xl text-white hover:border-slate-600 transition"
          >
            Save Draft
          </button>

          <button
            type="submit"
            disabled={submitting || loading}
            className="px-8 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-50 transition"
          >
            {pendingLabel({
              pending: submitting,
              pendingLabel: "Submitting...",
              idleLabel: "Submit Update",
            })}
          </button>
        </div>
      </form>
    </div>
  );
}
