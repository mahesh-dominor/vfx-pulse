export default function CommentBox() {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Today's Progress
      </label>

      <textarea
        rows={6}
        className="w-full rounded-xl bg-[#151F31] border border-slate-700 p-4 text-white"
        placeholder="Describe today's work..."
      />
    </div>
  );
}