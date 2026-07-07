import DailyUpdateForm from "@/components/daily-update/DailyUpdateForm";

export default function DailyUpdatePage() {
  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-100">Daily Updates</h1>
        <p className="mt-2 text-slate-400">Submit artist reports and progress notes.</p>
      </div>

      <DailyUpdateForm />
    </main>
  );
}
