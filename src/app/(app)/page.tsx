import { ArrowRight, CircleDollarSign, Handshake, PackageX, ShoppingCart, Users } from "lucide-react";
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
  itemTotais,
  mockDistribuicaoMotivo,
  mockMensal,
  mockTickets,
  ticketTotais,
} from "@/lib/mock-data";

function aggregate() {
  const ativos = mockTickets.filter((t) => t.status !== "cancelada");
  let totalNegociado = 0;
  let totalVendido = 0;
  let valorPerdido = 0;
  let unidadesPerdidas = 0;

  const porSku = new Map<string, { label: string; valor: number; perdido: number }>();
  const porCliente = new Map<string, { label: string; valor: number; perdido: number }>();
  const porVendedor = new Map<string, { label: string; valor: number; perdido: number }>();

  for (const ticket of ativos) {
    const totais = ticketTotais(ticket);
    totalNegociado += totais.totalNegociado;
    totalVendido += totais.totalVendido;
    valorPerdido += totais.valorPerdido;
    unidadesPerdidas += totais.unidadesPerdidas;

    const cliente = porCliente.get(ticket.cliente) ?? { label: ticket.cliente, valor: 0, perdido: 0 };
    cliente.valor += totais.totalVendido;
    cliente.perdido += totais.valorPerdido;
    porCliente.set(ticket.cliente, cliente);

    const vendedor = porVendedor.get(ticket.vendedor) ?? { label: ticket.vendedor, valor: 0, perdido: 0 };
    vendedor.valor += totais.totalVendido;
    vendedor.perdido += totais.valorPerdido;
    porVendedor.set(ticket.vendedor, vendedor);

    for (const item of ticket.itens) {
      const t = itemTotais(item);
      const sku = porSku.get(item.sku) ?? { label: item.descricao, valor: 0, perdido: 0 };
      sku.valor += t.totalVendido;
      sku.perdido += t.valorPerdido;
      porSku.set(item.sku, sku);
    }
  }

  const top = (map: Map<string, { label: string; valor: number; perdido: number }>) =>
    [...map.values()].sort((a, b) => b.valor - a.valor).slice(0, 5);

  return {
    totalNegociado,
    totalVendido,
    valorPerdido,
    unidadesPerdidas,
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
  const conversao = agg.totalNegociado > 0 ? Math.round((agg.totalVendido / agg.totalNegociado) * 100) : 0;
  const ultimas = mockTickets.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão comercial</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento das negociações da semana.</p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total negociado"
          value={formatBRL(agg.totalNegociado)}
          hint={`${agg.negociacoes} negociações no período`}
          icon={Handshake}
        />
        <KpiCard
          label="Total vendido"
          value={formatBRL(agg.totalVendido)}
          hint={`${conversao}% do negociado`}
          icon={ShoppingCart}
          tone="success"
        />
        <KpiCard
          label="Clientes atendidos"
          value={formatNumber(agg.clientes)}
          hint="clientes distintos no período"
          icon={Users}
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
