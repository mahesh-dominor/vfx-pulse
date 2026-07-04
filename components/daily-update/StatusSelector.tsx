export default function StatusSelector() {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Status
      </label>

      <select className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white">
        <option>WIP</option>
        <option>Internal Review</option>
        <option>Client Review</option>
        <option>Approved</option>
        <option>Blocked</option>
      </select>
    </div>
  );
}