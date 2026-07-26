"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Gift, Handshake, PackageX, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/kpi-card";
import { MotivoBars } from "@/components/dashboard/motivo-bars";
import { RankedList } from "@/components/dashboard/ranked-list";
import { PeriodoFilter } from "@/components/periodo-filter";
import { TicketsTable } from "@/components/tickets-table";
import { formatBRL, formatNumber } from "@/lib/format";
import {
  bonifStatus,
  bonificacaoTotais,
  dataDentroDoPeriodo,
  itemTotais,
  mockDistribuicaoMotivo,
  mockTickets,
  ticketTotais,
  type MockTicket,
  type PeriodoPreset,
} from "@/lib/mock-data";

function aggregate(tickets: MockTicket[]) {
  const ativos = tickets.filter((t) => t.status !== "cancelada");
  let totalV1 = 0;
  let totalFinal = 0;
  let valorPerdido = 0;
  let unidadesPerdidas = 0;
  let valorBonificado = 0;
  let valorBonifAberto = 0;
  let bonifAtrasadas = 0;

  const porSku = new Map<string, { label: string; valor: number }>();
  const porCliente = new Map<string, { label: string; valor: number }>();
  const porVendedor = new Map<string, { label: string; valor: number }>();

  for (const ticket of ativos) {
    const totais = ticketTotais(ticket);
    totalV1 += totais.totalV1;
    totalFinal += totais.totalFinal;
    valorPerdido += totais.valorPerdido;
    unidadesPerdidas += totais.unidadesPerdidas;

    if (ticket.bonificacao) {
      const boniValor = bonificacaoTotais(ticket.bonificacao).valor;
      valorBonificado += boniValor;
      const status = bonifStatus(ticket.bonificacao);
      if (status && status !== "pago") {
        valorBonifAberto += boniValor;
        if (status === "atrasada") bonifAtrasadas += 1;
      }
    }

    const cliente = porCliente.get(ticket.cliente) ?? { label: ticket.cliente, valor: 0 };
    cliente.valor += totais.totalFinal;
    porCliente.set(ticket.cliente, cliente);

    const vendedor = porVendedor.get(ticket.vendedor) ?? { label: ticket.vendedor, valor: 0 };
    vendedor.valor += totais.totalFinal;
    porVendedor.set(ticket.vendedor, vendedor);

    for (const item of ticket.itens) {
      const t = itemTotais(item);
      const sku = porSku.get(item.sku) ?? { label: item.descricao, valor: 0 };
      sku.valor += t.totalFinal;
      porSku.set(item.sku, sku);
    }
  }

  const top = (map: Map<string, { label: string; valor: number }>) =>
    [...map.values()].sort((a, b) => b.valor - a.valor).slice(0, 5);

  return {
    totalV1,
    totalFinal,
    valorPerdido,
    unidadesPerdidas,
    valorBonificado,
    valorBonifAberto,
    bonifAtrasadas,
    negociacoes: ativos.length,
    clientes: new Set(ativos.map((t) => t.clienteCodigo)).size,
    skusAfetados: new Set(
      ativos.flatMap((t) => t.itens.filter((i) => itemTotais(i).valorPerdido > 0).map((i) => i.sku)),
    ).size,
    topSkus: top(porSku),
    topClientes: top(porCliente),
    topVendedores: top(porVendedor),
  };
}

export function DashboardView() {
  const [periodo, setPeriodo] = useState<PeriodoPreset>("todos");

  const tickets = useMemo(
    () => mockTickets.filter((t) => dataDentroDoPeriodo(t.data, periodo)),
    [periodo],
  );
  const agg = useMemo(() => aggregate(tickets), [tickets]);
  const conversao = agg.totalV1 > 0 ? Math.round((agg.totalFinal / agg.totalV1) * 100) : 0;
  const ultimas = tickets.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PeriodoFilter value={periodo} onChange={setPeriodo} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Negociação preliminar"
          value={formatBRL(agg.totalV1)}
          hint={`${agg.negociacoes} negociações · ${agg.clientes} clientes`}
          icon={Handshake}
        />
        <KpiCard
          label="Negociação final"
          value={formatBRL(agg.totalFinal)}
          hint={`${conversao}% do preliminar`}
          icon={ShoppingCart}
          tone="success"
        />
        <KpiCard
          label="Bonificação acordada"
          value={formatBRL(agg.valorBonificado)}
          hint={
            agg.valorBonifAberto > 0
              ? `${formatBRL(agg.valorBonifAberto)} a pagar${
                  agg.bonifAtrasadas > 0 ? ` · ${agg.bonifAtrasadas} atrasada(s)` : ""
                }`
              : "tudo pago"
          }
          icon={Gift}
          tone={agg.bonifAtrasadas > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Demanda perdida"
          value={formatBRL(agg.valorPerdido)}
          hint={`${formatNumber(agg.unidadesPerdidas)} un. · ${agg.skusAfetados} SKUs afetados`}
          icon={PackageX}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Últimas negociações</CardTitle>
            <CardDescription>Clique no código para abrir o raio-x do pedido.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/negociacoes" />}>
            Ver todas
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          <TicketsTable tickets={ultimas} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destaques</CardTitle>
            <CardDescription>Por valor vendido no período</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="skus">
              <TabsList>
                <TabsTrigger value="skus">SKUs</TabsTrigger>
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
                <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
              </TabsList>
              <TabsContent value="skus" className="pt-4">
                <RankedList items={agg.topSkus} />
              </TabsContent>
              <TabsContent value="clientes" className="pt-4">
                <RankedList items={agg.topClientes} />
              </TabsContent>
              <TabsContent value="vendedores" className="pt-4">
                <RankedList items={agg.topVendedores} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivos de ajuste</CardTitle>
            <CardDescription>Quando a quantidade final difere da negociada</CardDescription>
          </CardHeader>
          <CardContent>
            <MotivoBars data={mockDistribuicaoMotivo} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
