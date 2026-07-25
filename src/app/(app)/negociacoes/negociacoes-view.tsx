"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TicketsTable } from "@/components/tickets-table";
import { formatBRL } from "@/lib/format";
import { mockTickets, mockVendedores, ticketTotais } from "@/lib/mock-data";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "rascunho", label: "Rascunho" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

export function NegociacoesView() {
  const [vendedor, setVendedor] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const tickets = useMemo(() => {
    return mockTickets.filter((ticket) => {
      if (vendedor !== "todos" && ticket.vendedor !== vendedor) return false;
      if (status !== "todos" && ticket.status !== status) return false;
      if (busca) {
        const alvo = `${ticket.codigo} ${ticket.cliente} ${ticket.nf ?? ""}`.toLowerCase();
        if (!alvo.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [vendedor, status, busca]);

  const resumo = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        if (ticket.status === "cancelada") return acc;
        const totais = ticketTotais(ticket);
        acc.vendido += totais.totalVendido;
        acc.perdido += totais.valorPerdido;
        return acc;
      },
      { vendido: 0, perdido: 0 },
    );
  }, [tickets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por código, cliente ou NF..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={vendedor} onValueChange={(v) => setVendedor(v ?? "todos")}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os vendedores</SelectItem>
            {mockVendedores.map((nome) => (
              <SelectItem key={nome} value={nome}>
                {nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {tickets.length} negociações · {formatBRL(resumo.vendido)} vendido
          {resumo.perdido > 0 && ` · ${formatBRL(resumo.perdido)} perdido`}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TicketsTable tickets={tickets} />
        </CardContent>
      </Card>
    </div>
  );
}
