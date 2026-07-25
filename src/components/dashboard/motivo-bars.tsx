export function MotivoBars({ data }: { data: { motivo: string; valor: number }[] }) {
  const total = data.reduce((acc, item) => acc + item.valor, 0);
  const max = Math.max(...data.map((item) => item.valor), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const pct = total ? Math.round((item.valor / total) * 100) : 0;
        return (
          <div key={item.motivo} className="grid grid-cols-[170px_1fr_48px] items-center gap-4 sm:grid-cols-[220px_1fr_56px]">
            <span className="truncate text-sm text-foreground">{item.motivo}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${Math.max((item.valor / max) * 100, 2)}%` }}
              />
            </div>
            <span className="text-right text-sm font-medium tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
