import Link from "next/link";

import type { QuickActionItem } from "@/types/dashboard";

type QuickActionsCardProps = {
  actions: QuickActionItem[];
};

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="rounded-lg border border-slate-700 bg-[#0E1625] px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
