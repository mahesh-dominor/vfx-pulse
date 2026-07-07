import { sequenceService } from "@/services/sequence.service";

export default async function SequencesPage() {
  const sequences = await sequenceService.listSequences();

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
      </div>
    </main>
  );
}
