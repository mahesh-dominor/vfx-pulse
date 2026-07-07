import TopNav from "@/components/layout/TopNav";
import ReviewsDashboard from "@/components/reviews/ReviewsDashboard";

export const dynamic = "force-dynamic";

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Reviews</h1>
      <ReviewsDashboard />
    </main>
  );
}
