"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleCheck, CircleDollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { BonifStatusBadge } from "@/components/bonif-status-badge";
import { formatBRL, formatBRLPreco, formatNumber } from "@/lib/format";
import { listarBonificacoes, mockVendedores, produtoCatalogo } from "@/lib/mock-data";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todas as situações" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasada", label: "Atrasadas" },
  { value: "pago", label: "Pagas" },
];

export function BonificacoesView() {
  const [vendedor, setVendedor] = useState("todos");
  const [status, setStatus] = useState("todos");

  const todas = useMemo(() => listarBonificacoes(), []);

  const linhas = useMemo(() => {
    return todas.filter((row) => {
      if (vendedor !== "todos" && row.vendedor !== vendedor) return false;
      if (status !== "todos" && row.status !== status) return false;
      return true;
    });
  }, [todas, vendedor, status]);

  const resumo = useMemo(() => {
    return todas.reduce(
      (acc, row) => {
        acc.total += row.valor;
        acc.pecas += row.pecas;
        if (row.status === "pago") acc.pago += row.valor;
        else {
          acc.aberto += row.valor;
          if (row.status === "atrasada") acc.atrasadas += 1;
        }
        return acc;
      },
      { total: 0, pecas: 0, pago: 0, aberto: 0, atrasadas: 0 },
    );
  }, [todas]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Bonificação acordada"
          value={formatBRL(resumo.total)}
          hint={`${todas.length} pedidos · ${formatNumber(resumo.pecas)} peças`}
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Já pago"
          value={formatBRL(resumo.pago)}
          hint={
            resumo.total > 0 ? `${Math.round((resumo.pago / resumo.total) * 100)}% do acordado` : undefined
          }
          icon={CircleCheck}
          tone="success"
        />
        <KpiCard
          label="Em aberto"
          value={formatBRL(resumo.aberto)}
          hint={resumo.atrasadas > 0 ? `${resumo.atrasadas} atrasada(s)` : "nenhuma atrasada"}
          icon={Clock}
          tone={resumo.atrasadas > 0 ? "warning" : "default"}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          {linhas.length} bonificação(ões) listada(s)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {linhas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma bonificação encontrada com os filtros atuais.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead className="text-center">Peças</TableHead>
                  <TableHead className="text-center">Faturamento</TableHead>
                  <TableHead>Data a pagar</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((row) => (
                  <TableRow key={row.ticketId}>
                    <TableCell>
                      <Link
                        href={`/negociacoes/${row.ticketId}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.codigo}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">{row.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{row.vendedor}</TableCell>
                    <TableCell className="max-w-[220px] text-muted-foreground">
                      <span className="line-clamp-2">
                        {row.itens
                          .map((item) => `${produtoCatalogo(item.sku)?.descricao ?? item.sku} ×${item.qtd}`)
                          .join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{formatNumber(row.pecas)} un.</TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {formatBRLPreco(row.valor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.dataPagamento ?? "—"}</TableCell>
                    <TableCell>
                      <BonifStatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
