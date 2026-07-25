"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockCatalogoRef, produtoCatalogo } from "@/lib/mock-data";

// SKU com tooltip mostrando a foto do catálogo no momento da negociação.
// No app final o vendedor escolhe o SKU numa lista vinda do catálogo STRALOG,
// e o item grava esse snapshot (descrição, categoria, data do catálogo).
export function SkuTooltip({ sku, descricao }: { sku: string; descricao: string }) {
  const produto = produtoCatalogo(sku);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-help font-mono text-xs text-foreground underline decoration-dotted decoration-muted-foreground/60 underline-offset-4" />
        }
      >
        {sku}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        <div className="space-y-1 py-0.5">
          <p className="font-medium">{descricao}</p>
          {produto?.categoria && <p className="opacity-80">{produto.categoria}</p>}
          <p className="opacity-60">{mockCatalogoRef}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
