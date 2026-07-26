import Link from "next/link";
import { CircleCheck, Clock, Gift, PackageX } from "lucide-react";
import type { AtencaoItem } from "@/lib/mock-data";

const TIPO_CONFIG = {
  ruptura: { icon: PackageX, className: "bg-warning/10 text-warning" },
  bonificacao: { icon: Gift, className: "bg-destructive/10 text-destructive" },
  rascunho: { icon: Clock, className: "bg-muted-foreground/10 text-muted-foreground" },
} as const;

export function AtencaoList({ items }: { items: AtencaoItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CircleCheck className="size-6 text-success" />
        <p className="text-sm text-muted-foreground">Nada pendente por aqui — tudo em dia.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => {
        const config = TIPO_CONFIG[item.tipo];
        const Icon = config.icon;
        return (
          <li key={item.id}>
            <Link
              href={`/negociacoes/${item.ticketId}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.className}`}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {item.codigo}
                  <span className="truncate font-normal text-muted-foreground">{item.cliente}</span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">{item.detalhe}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
