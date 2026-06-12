"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CountryData {
  name: string;
  value: number;
}

interface CountryChartProps {
  data: CountryData[];
}

const COLORS = ["#4fb1d3", "#F59E0B", "#34A853", "#F78687", "#8B5CF6", "#94a3b8"];

function formatRSD(value: number | undefined) {
  if (value == null) return "-";
  return value.toLocaleString("sr-Latn-RS") + " din";
}

export default function CountryChart({ data }: CountryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatRSD(value as number | undefined), "Prihod"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "13px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
