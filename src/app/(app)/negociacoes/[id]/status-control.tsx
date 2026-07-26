"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS: { value: TicketStatus; label: string; className: string }[] = [
  { value: "rascunho", label: "Rascunho", className: "text-muted-foreground" },
  { value: "em_andamento", label: "Em andamento", className: "text-warning" },
  { value: "concluida", label: "Concluída", className: "text-success" },
  { value: "faturada", label: "Faturada", className: "text-primary" },
  { value: "cancelada", label: "Cancelada", className: "text-destructive" },
];

const TRIGGER_TONE: Record<TicketStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-transparent",
  em_andamento: "bg-warning/15 text-warning border-transparent",
  concluida: "bg-success/15 text-success border-transparent",
  faturada: "bg-primary/15 text-primary border-transparent",
  cancelada: "bg-destructive/10 text-destructive border-transparent",
};

export function StatusControl({ ticketId, statusInicial }: { ticketId: string; statusInicial: TicketStatus }) {
  const [status, setStatus] = useState<TicketStatus>(statusInicial);

  async function handleChange(value: TicketStatus) {
    const anterior = status;
    setStatus(value);
    const supabase = createClient();
    const { error } = await supabase.from("negociacoes").update({ status: value }).eq("id", ticketId);
    if (error) {
      setStatus(anterior);
      toast.error("Não foi possível alterar o status", { description: error.message });
      return;
    }
    const label = STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
    toast.success(`Status alterado para "${label}"`, {
      description:
        value === "faturada"
          ? "A partir da fatura, os itens deste pedido passam a abater o estoque disponível."
          : undefined,
    });
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as TicketStatus)}>
      <SelectTrigger
        size="sm"
        className={cn("h-7 rounded-full px-3 text-xs font-medium shadow-none", TRIGGER_TONE[status])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className={cn("font-medium", option.className)}>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
