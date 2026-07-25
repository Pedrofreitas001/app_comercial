import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card
      className={cn(
        "gap-2 border-l-2",
        tone === "warning" && "border-l-warning",
        tone === "success" && "border-l-success",
        tone === "default" && "border-l-primary/25",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-[13px] font-medium text-muted-foreground">{label}</CardTitle>
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "success" && "bg-success/10 text-success",
            tone === "default" && "bg-primary/8 text-primary",
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-[28px] font-bold tracking-tight tabular-nums">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
