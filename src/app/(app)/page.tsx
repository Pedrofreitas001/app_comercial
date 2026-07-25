import { ArrowRight, Gift, Handshake, PackageX, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { MotivoBars } from "@/components/dashboard/motivo-bars";
import { RankedList } from "@/components/dashboard/ranked-list";
import { TicketsTable } from "@/components/tickets-table";
import { formatBRL, formatNumber } from "@/lib/format";
import {
  bonifStatus,
  bonificacaoTotais,
  itemTotais,
  mockDistribuicaoMotivo,
  mockMensal,
  mockTickets,
  ticketTotais,
} from "@/lib/mock-data";

function aggregate() {
  const ativos = mockTickets.filter((t) => t.status !== "cancelada");
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

export default function DashboardPage() {
  const agg = aggregate();
  const conversao = agg.totalV1 > 0 ? Math.round((agg.totalFinal / agg.totalV1) * 100) : 0;
  const ultimas = mockTickets.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão comercial</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento das negociações da semana.</p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
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
        <CardHeader>
          <CardTitle className="text-base">Negociado vs. vendido por mês</CardTitle>
          <CardDescription>Evolução do volume comercial nos últimos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={mockMensal} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top SKUs</CardTitle>
            <CardDescription>Por valor vendido</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedList items={agg.topSkus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top clientes</CardTitle>
            <CardDescription>Por valor vendido</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedList items={agg.topClientes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top vendedores</CardTitle>
            <CardDescription>Por valor vendido</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedList items={agg.topVendedores} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivos de ajuste nas negociações</CardTitle>
          <CardDescription>
            Distribuição dos motivos informados quando a quantidade final difere da negociada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MotivoBars data={mockDistribuicaoMotivo} />
        </CardContent>
      </Card>

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
    </div>
  );
}
