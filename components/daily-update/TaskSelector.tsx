export default function TaskSelector() {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Task
      </label>

      <select className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white">
        <option>Compositing</option>
        <option>Prep</option>
        <option>Lighting</option>
        <option>Animation</option>
        <option>FX</option>
      </select>
    </div>
  );
}