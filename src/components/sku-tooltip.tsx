"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SkuTooltip({
  sku,
  descricao,
  categoria,
}: {
  sku: string;
  descricao: string;
  categoria?: string | null;
}) {
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
          {categoria && <p className="opacity-80">{categoria}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
