import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em andamento", className: "bg-warning/15 text-warning" },
  concluida: { label: "Concluída", className: "bg-success/15 text-success" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
} as const;

export function NegociacaoStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
