"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", hours: 280 },
  { day: "Tue", hours: 310 },
  { day: "Wed", hours: 295 },
  { day: "Thu", hours: 340 },
  { day: "Fri", hours: 312 },
  { day: "Sat", hours: 85 },
];

export default function HoursTrend() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-6">
        Hours Trend
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #475569",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#06b6d4"
            dot={{ fill: "#06b6d4", r: 4 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
