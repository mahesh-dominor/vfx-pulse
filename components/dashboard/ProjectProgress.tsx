export default function ProjectProgress() {
  const projects = [
    { name: "CADS2", progress: 78 },
    { name: "HEDA", progress: 92 },
    { name: "SWAG", progress: 63 },
    { name: "BR70", progress: 45 },
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">
          Project Progress
        </h2>

        <button className="text-cyan-400 text-sm">
          View All
        </button>
      </div>

      <div className="space-y-6">

        {projects.map((project) => (

          <div key={project.name}>

            <div className="flex justify-between text-sm mb-2">

              <span className="text-slate-300">
                {project.name}
              </span>

              <span className="text-white">
                {project.progress}%
              </span>

            </div>

            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">

              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-green-400"
                style={{ width: `${project.progress}%` }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}