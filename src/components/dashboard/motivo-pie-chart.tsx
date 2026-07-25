"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Paleta categorica validada (dataviz skill): ordem fixa, nao ciclica.
const MOTIVO_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

export function MotivoPieChart({ data }: { data: { motivo: string; valor: number }[] }) {
  const total = data.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="motivo" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.motivo} fill={MOTIVO_COLORS[index % MOTIVO_COLORS.length]} stroke="var(--card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value}%`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-sm">
        {data.map((item, index) => (
          <li key={item.motivo} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: MOTIVO_COLORS[index % MOTIVO_COLORS.length] }}
              />
              {item.motivo}
            </span>
            <span className="font-medium text-muted-foreground">
              {total ? Math.round((item.valor / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
