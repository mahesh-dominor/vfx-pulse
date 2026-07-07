interface Props {
  missingUpdates: number;
}

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

export default function MissingUpdates({ missingUpdates }: Props) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-white">
          Missing Updates
        </h2>

        <button className="text-cyan-400 text-sm hover:text-cyan-300">
          View All
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1">
        {artists.slice(0, missingUpdates || artists.length).map((artist) => (
          <div
            key={artist.name}
            className="flex justify-between items-center border-b border-slate-800 pb-3 last:border-b-0"
          >
            <div>
              <p className="text-white text-sm font-medium">{artist.name}</p>
              <p className="text-slate-400 text-xs">
                {artist.department}
              </p>
            </div>

            <span className="text-slate-500 text-xs">
              {artist.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
