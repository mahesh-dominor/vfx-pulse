"use client";

import { useEffect, useState } from "react";

type ReviewItem = {
  id: string;
  reviewType: string;
  title: string;
  status: string;
  shot: { code: string | null; shotName: string };
  createdBy: { name: string };
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/reviews");
        if (!response.ok) throw new Error("Unable to fetch reviews");
        const data = (await response.json()) as ReviewItem[];
        setReviews(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to fetch reviews");
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Reviews</h1>

      {error ? <p className="mb-4 rounded border border-red-800 bg-red-900/20 p-3 text-red-300">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <p className="text-xs text-slate-400">{review.reviewType}</p>
            <p className="text-lg font-semibold text-slate-100">{review.title}</p>
            <p className="text-sm text-slate-300">{review.shot.code ?? review.shot.shotName}</p>
            <p className="mt-2 text-xs text-slate-500">Status: {review.status}</p>
            <p className="text-xs text-slate-500">By: {review.createdBy.name}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
