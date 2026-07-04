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
    <div className="bg-[#151F31] border border-slate-800 rounded-2xl px-6 py-5 hover:border-cyan-500 transition duration-300 shadow-lg">

      <div className="flex justify-between">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-5xl font-bold text-white mt-3">
            {value}
          </h2>

        </div>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconBg} shadow-lg`}
        >
          {icon}
        </div>

      </div>

      <div className="mt-5">

        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-green-400"
            style={{ width: "72%" }}
          />

        </div>

        <p className="text-green-400 text-sm mt-2">
          {subtitle}
        </p>

      </div>

    </div>
  );
}