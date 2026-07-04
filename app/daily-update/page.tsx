import DailyUpdateForm from "@/components/daily-update/DailyUpdateForm";

export default function DailyUpdatePage() {
  return (
    <main className="flex-1 p-8 bg-[#070B14] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Daily Update
        </h1>

        <p className="text-slate-400 mt-2">
          Submit today's work progress.
        </p>
      </div>

      <DailyUpdateForm />
    </main>
  );
}