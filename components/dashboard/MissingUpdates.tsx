const artists = [
  {
    name: "Amit Kumar",
    department: "Compositing",
    date: "04 Jun",
  },
  {
    name: "Pooja Singh",
    department: "Lighting",
    date: "04 Jun",
  },
  {
    name: "Rahul Sharma",
    department: "FX",
    date: "04 Jun",
  },
  {
    name: "Nikhil K",
    department: "Animation",
    date: "05 Jun",
  },
];

export default function MissingUpdates() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full">

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-white">
          Missing Updates
        </h2>

        <button className="text-cyan-400 text-sm">
          View All
        </button>
      </div>

      <div className="space-y-4">

        {artists.map((artist) => (
          <div
            key={artist.name}
            className="flex justify-between items-center border-b border-slate-800 pb-3"
          >
            <div>
              <p className="text-white">{artist.name}</p>
              <p className="text-slate-400 text-sm">
                {artist.department}
              </p>
            </div>

            <span className="text-slate-500 text-sm">
              {artist.date}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
}