import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  CalendarDays,
  FolderKanban,
  Clapperboard,
  Users,
  Building2,
  BarChart3,
  Shield,
  UserCog,
  Settings,
  History,
} from "lucide-react";

const menu = [
  {
    title: "MAIN",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", active: true },
      { icon: ClipboardList, label: "Daily Update" },
      { icon: CheckSquare, label: "My Updates" },
      { icon: CalendarDays, label: "Calendar" },
    ],
  },
  {
    title: "MANAGE",
    items: [
      { icon: FolderKanban, label: "Projects" },
      { icon: Clapperboard, label: "Shots" },
      { icon: Users, label: "Artists" },
      { icon: Building2, label: "Departments" },
      { icon: BarChart3, label: "Reports" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: UserCog, label: "Users" },
      { icon: Shield, label: "Roles & Permissions" },
      { icon: Settings, label: "Settings" },
      { icon: History, label: "Activity Logs" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-[#0E1628] border-r border-slate-800 flex flex-col">

      <div className="p-6 border-b border-slate-800">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-xl border-2 border-white flex items-center justify-center font-bold text-xl">
            MR
          </div>

          <div>
            <h1 className="text-white font-bold text-xl">
              MR Production
            </h1>

            <p className="text-slate-400 text-sm">
              Track. Plan. Deliver.
            </p>

          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">

        {menu.map((section) => (
          <div key={section.title} className="mb-8">

            <p className="text-xs text-slate-500 font-semibold mb-3">
              {section.title}
            </p>

            <div className="space-y-2">

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      item.active
                        ? "bg-cyan-500 text-black font-semibold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}

            </div>

          </div>
        ))}

      </div>

      <div className="p-4 border-t border-slate-800">

        <button className="w-full rounded-xl bg-slate-800 text-slate-300 py-3 hover:bg-slate-700">
          Need Help?
        </button>

      </div>

    </aside>
  );
}