"use client";

import { useEffect, useMemo, useState } from "react";

import { emitDataSync, subscribeDataSync } from "@/lib/live-sync";
import { FeedbackMessage } from "@/components/ui/feedback-message";

type ReviewStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "APPROVED" | "REJECTED";

type ReviewItem = {
  id: string;
  reviewType: string;
  title: string;
  description: string | null;
  status: ReviewStatus;
  shot: {
    id: string;
    code: string | null;
    shotName: string;
    version: number;
    project: { id: string; code: string; name: string };
    artist: { id: string; name: string } | null;
  };
  createdBy: { id: string; name: string };
  notes: Array<{ id: string; content: string; user: { name: string } }>;
  createdAt: string;
};

type ArtistFilter = { id: string; name: string };
type ProjectFilter = { id: string; code: string; name: string };

const statusOptions: ReviewStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "APPROVED", "REJECTED"];

export default function ReviewsDashboard() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [projectId, setProjectId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const projects = useMemo<ProjectFilter[]>(() => {
    const map = new Map<string, ProjectFilter>();
    for (const review of reviews) {
      map.set(review.shot.project.id, review.shot.project);
    }
    return Array.from(map.values());
  }, [reviews]);

  const artists = useMemo<ArtistFilter[]>(() => {
    const map = new Map<string, ArtistFilter>();
    for (const review of reviews) {
      if (review.shot.artist) {
        map.set(review.shot.artist.id, { id: review.shot.artist.id, name: review.shot.artist.name });
      }
    }
    return Array.from(map.values());
  }, [reviews]);

  useEffect(() => {
    void loadReviews();

    const unsubscribe = subscribeDataSync(() => {
      void loadReviews();
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReviews() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (artistId) params.set("artistId", artistId);
      if (status) params.set("status", status);
      if (fromDate) params.set("fromDate", new Date(fromDate).toISOString());
      if (toDate) params.set("toDate", new Date(toDate).toISOString());
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = (await response.json()) as ReviewItem[];
      setReviews(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(reviewId: string, nextStatus: ReviewStatus) {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update review status");
      }

      setReviews((prev) =>
        prev.map((review) => (review.id === reviewId ? { ...review, status: nextStatus } : review))
      );
      emitDataSync("reviews");
      setSuccess("Review status updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update review status");
    }
  }

  async function addComment(reviewId: string) {
    const content = (commentDraft[reviewId] ?? "").trim();
    if (!content) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to add comment");
      }

      setCommentDraft((prev) => ({ ...prev, [reviewId]: "" }));
      await loadReviews();
      emitDataSync("reviews");
      setSuccess("Review comment added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add comment");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-[#111827] p-4 md:grid-cols-6">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>

        <select
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
        >
          <option value="">All Artists</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
        />

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search review"
            className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={() => void loadReviews()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
          >
            Apply
          </button>
        </div>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {success ? <FeedbackMessage variant="success" message={success} /> : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 text-slate-300">Loading reviews...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-400">{review.reviewType}</p>
                <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
              </div>

              <h3 className="mt-1 text-lg font-semibold text-slate-100">{review.title}</h3>
              <p className="text-sm text-slate-300">
                {review.shot.code ?? review.shot.shotName} • {review.shot.project.code}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reviewer: {review.createdBy.name} • Artist: {review.shot.artist?.name ?? "Unassigned"}
              </p>
              <p className="text-xs text-slate-500">Latest version: v{review.shot.version}</p>

              {review.description ? (
                <p className="mt-2 text-sm text-slate-300">{review.description}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={review.status}
                  onChange={(e) => void updateStatus(review.id, e.target.value as ReviewStatus)}
                  className="rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-xs text-slate-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "APPROVED")}
                  className="rounded-lg border border-emerald-700 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-900/30"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "REJECTED")}
                  className="rounded-lg border border-red-700 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30"
                >
                  Reject
                </button>
              </div>

              <div className="mt-3 space-y-1 rounded-lg border border-slate-800 bg-[#0B1321] p-3">
                <p className="text-xs font-medium text-slate-400">Review comments</p>
                {review.notes.length === 0 ? (
                  <p className="text-xs text-slate-500">No comments yet</p>
                ) : (
                  review.notes.slice(0, 3).map((note) => (
                    <p key={note.id} className="text-xs text-slate-300">
                      {note.user.name}: {note.content}
                    </p>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={commentDraft[review.id] ?? ""}
                  onChange={(e) => setCommentDraft((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Add comment"
                  className="w-full rounded-lg border border-slate-700 bg-[#0B1321] px-3 py-2 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void addComment(review.id)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
                >
                  Add
                </button>
              </div>
            </article>
          ))}
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-400">
              No reviews found for the current filters.
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
