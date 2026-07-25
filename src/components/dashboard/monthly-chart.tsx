"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, formatBRLCompact } from "@/lib/format";

export function MonthlyChart({
  data,
}: {
  data: { mes: string; negociado: number; vendido: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(value: number) => formatBRLCompact(value)}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            formatBRL(Number(value)),
            name === "negociado" ? "Preliminar" : "Final",
          ]}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
              {value === "negociado" ? "Preliminar" : "Final"}
            </span>
          )}
        />
        <Bar dataKey="negociado" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="vendido" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
