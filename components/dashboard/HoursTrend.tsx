"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { day: "Sun", hours: 120 },
  { day: "Mon", hours: 170 },
  { day: "Tue", hours: 300 },
  { day: "Wed", hours: 270 },
  { day: "Thu", hours: 380 },
  { day: "Fri", hours: 312 },
];

export default function HoursTrend() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-lg font-semibold text-white mb-5">
        Hours Trend
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="#94A3B8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#22d3ee"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}