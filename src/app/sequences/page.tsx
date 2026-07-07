import { sequenceService } from "@/services/sequence.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SequencesPage() {
  let sequences: Awaited<ReturnType<typeof sequenceService.listSequences>> = [];

  try {
    sequences = await sequenceService.listSequences();
  } catch {
    sequences = [];
  }

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Sequences</h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sequences.map((sequence) => (
          <div key={sequence.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <p className="text-sm text-slate-400">{sequence.project.code}</p>
            <p className="text-lg font-semibold text-slate-100">{sequence.code}</p>
            <p className="text-sm text-slate-300">{sequence.name}</p>
            <p className="mt-2 text-xs text-slate-500">Shots: {sequence._count.shots}</p>
          </div>
        ))}
        {sequences.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-400">
            No sequences found yet.
          </div>
        ) : null}
      </div>
    </main>
  );
}
