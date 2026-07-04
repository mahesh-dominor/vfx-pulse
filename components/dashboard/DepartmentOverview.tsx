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
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 h-full">

      <div className="flex justify-between mb-5">
        <h2 className="text-white font-semibold text-lg">
          Department Overview
        </h2>

        <span className="text-slate-400 text-sm">
          Hours
        </span>
      </div>

      <div className="flex h-[220px]">

        <div className="w-1/2">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>

              <Pie
                data={data}
                innerRadius={45}
                outerRadius={75}
                dataKey="value"
              >
                {data.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}
              </Pie>

            </PieChart>
          </ResponsiveContainer>

        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">

          {data.map((dept) => (

            <div
              key={dept.name}
              className="flex justify-between items-center"
            >

              <div className="flex items-center gap-2">

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: dept.color }}
                />

                <span className="text-slate-300">
                  {dept.name}
                </span>

              </div>

              <span className="text-slate-400 text-sm">
                {dept.value}h
              </span>

            </div>

          ))}

        </div>

      </div>

      <div className="text-center mt-2">

        <div className="text-3xl font-bold text-white">
          {total.toFixed(1)}
        </div>

        <div className="text-slate-400">
          Total Hours
        </div>

      </div>

    </div>
  );
}