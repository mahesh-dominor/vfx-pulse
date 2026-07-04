import {
  Search,
  Bell,
  Filter,
  CalendarDays,
} from "lucide-react";

export default function Header() {
  return (
    <header className="h-24 bg-[#0E1628] border-b border-slate-800 px-10 flex items-center justify-between sticky top-0 z-50">

      {/* Left */}

      <div>
        <h1 className="text-5xl font-bold text-white">
          Dashboard
        </h1>

        <p className="text-slate-400 mt-1">
          Overview of today's production activity
        </p>
      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        {/* Search */}

        <div className="flex items-center gap-3 bg-[#151F31] border border-slate-700 rounded-2xl px-5 h-14 w-[460px]">

          <Search
            size={18}
            className="text-slate-500"
          />

          <input
            placeholder="Search shots, artists, projects..."
            className="bg-transparent outline-none text-white w-full placeholder:text-slate-500"
          />

        </div>

        {/* Filter */}

        <button className="h-14 px-5 rounded-xl bg-[#151F31] border border-slate-700 flex items-center gap-2 hover:border-cyan-400 transition">

          <Filter size={18} />

          Filters

        </button>

        {/* Date */}

        <button className="h-14 px-5 rounded-xl bg-[#151F31] border border-slate-700 flex items-center gap-2">

          <CalendarDays size={18} />

          Friday, 6 June 2025

        </button>

        {/* Notification */}

        <button className="relative w-14 h-14 rounded-xl bg-[#151F31] border border-slate-700 flex items-center justify-center">

          <Bell />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>

        </button>

        {/* User */}

        <div className="flex items-center gap-3 bg-[#151F31] border border-slate-700 rounded-2xl px-4 h-14">

          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-black">
            MR
          </div>

          <div>

            <p className="text-white text-sm font-semibold">
              Mahesh R
            </p>

            <p className="text-slate-400 text-xs">
              Admin
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}