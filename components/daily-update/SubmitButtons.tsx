export default function SubmitButtons() {
  return (
    <div className="flex justify-end gap-4">
      <button className="px-6 py-3 border border-slate-700 rounded-xl text-white">
        Save Draft
      </button>

      <button className="px-8 py-3 rounded-xl bg-cyan-500 text-black font-semibold">
        Submit Update
      </button>
    </div>
  );
}