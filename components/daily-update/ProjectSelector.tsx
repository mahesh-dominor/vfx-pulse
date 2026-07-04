export default function ProjectSelector() {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Project
      </label>

      <select className="w-full h-12 rounded-xl bg-[#151F31] border border-slate-700 px-4 text-white">
        <option>HEDA</option>
        <option>CADS2</option>
        <option>SWAG</option>
        <option>BR70</option>
      </select>
    </div>
  );
}