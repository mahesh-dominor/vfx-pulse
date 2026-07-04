export default function HoursInput() {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Hours Worked
      </label>

      <input
        type="number"
        defaultValue={8}
        className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white"
      />
    </div>
  );
}