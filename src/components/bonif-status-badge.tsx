import { Badge } from "@/components/ui/badge";
import type { BonifStatus } from "@/lib/mock-data";

const CONFIG: Record<BonifStatus, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-success/10 text-success" },
  pendente: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  atrasada: { label: "Atrasada", className: "bg-warning/10 text-warning" },
};

export function BonifStatusBadge({ status }: { status: BonifStatus }) {
  const config = CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
