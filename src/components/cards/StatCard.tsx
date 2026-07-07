import { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: Props) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>

        <div className={`${iconBg} p-4 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>

      <p className="text-cyan-400 text-sm">{subtitle}</p>
    </div>
  );
}
