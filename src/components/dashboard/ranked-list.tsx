import { formatBRLCompact } from "@/lib/format";

export function RankedList({
  items,
}: {
  items: { label: string; sublabel?: string; valor: number }[];
}) {
  const max = Math.max(...items.map((item) => item.valor), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatBRLCompact(item.valor)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((item.valor / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
