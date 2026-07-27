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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { atualizarStatusCliente } from "@/lib/queries/cliente-fup";

type Status = "ativo" | "inativo";

const OPCOES: { value: Status; label: string; className: string }[] = [
  { value: "ativo", label: "Ativo", className: "text-success" },
  { value: "inativo", label: "Inativo", className: "text-muted-foreground" },
];

const TONE: Record<Status, string> = {
  ativo: "bg-success/15 text-success border-transparent",
  inativo: "bg-muted text-muted-foreground border-transparent",
};

export function StatusControl({
  clienteId,
  statusInicial,
  podeEditar,
}: {
  clienteId: string;
  statusInicial: Status;
  podeEditar: boolean;
}) {
  const [status, setStatus] = useState<Status>(statusInicial);

  if (!podeEditar) {
    return (
      <Badge variant="outline" className={TONE[status]}>
        {status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    );
  }

  async function handleChange(valor: Status) {
    const anterior = status;
    setStatus(valor);
    try {
      await atualizarStatusCliente(createClient(), clienteId, valor);
      toast.success(valor === "ativo" ? "Cliente reativado" : "Cliente marcado como inativo");
    } catch (e) {
      setStatus(anterior);
      toast.error("Não foi possível alterar o status", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as Status)}>
      <SelectTrigger
        size="sm"
        className={cn("h-7 rounded-full px-3 text-xs font-medium shadow-none", TONE[status])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className={cn("font-medium", o.className)}>{o.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
