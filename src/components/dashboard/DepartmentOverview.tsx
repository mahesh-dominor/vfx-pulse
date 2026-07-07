"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Comp", value: 124.5, color: "#22c55e" },
  { name: "Prep", value: 68.0, color: "#3b82f6" },
  { name: "Lighting", value: 56.5, color: "#f59e0b" },
  { name: "Animation", value: 38.0, color: "#8b5cf6" },
  { name: "FX", value: 25.5, color: "#ef4444" },
];

export default function DepartmentOverview() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-6">
        Department Hours
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex justify-between text-sm">
            <span className="text-slate-400">{item.name}</span>
            <span className="text-white">{item.value}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
