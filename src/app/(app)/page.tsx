import { Boxes, CircleDollarSign, Handshake, PackageX, TrendingDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { MonthlyLossChart } from "@/components/dashboard/monthly-loss-chart";
import { MotivoPieChart } from "@/components/dashboard/motivo-pie-chart";
import { RankedList } from "@/components/dashboard/ranked-list";
import { NegociacaoStatusBadge } from "@/components/negociacao-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatNumber } from "@/lib/format";
import {
  mockDemandaPorMes,
  mockDistribuicaoMotivo,
  mockKpis,
  mockNegociacoesRecentes,
  mockTopClientes,
  mockTopSkus,
  mockTopVendedores,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão executiva de demanda perdida por ruptura de estoque.</p>
        </div>
        <Badge variant="secondary">Dados de exemplo</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Demanda perdida (R$)" value={formatBRL(mockKpis.demandaPerdidaReais)} icon={CircleDollarSign} tone="warning" />
        <KpiCard label="Demanda perdida (un.)" value={formatNumber(mockKpis.demandaPerdidaUnidades)} icon={PackageX} tone="warning" />
        <KpiCard label="Negociações do dia" value={formatNumber(mockKpis.negociacoesHoje)} icon={Handshake} />
        <KpiCard label="Clientes atendidos" value={formatNumber(mockKpis.clientesAtendidos)} icon={Users} />
        <KpiCard label="SKUs afetados" value={formatNumber(mockKpis.skusAfetados)} icon={Boxes} tone="warning" />
        <KpiCard label="Valor potencial perdido" value={formatBRL(mockKpis.valorPotencialPerdido)} icon={TrendingDown} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Demanda perdida por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLossChart data={mockDemandaPorMes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por motivo</CardTitle>
          </CardHeader>
          <CardContent>
            <MotivoPieChart data={mockDistribuicaoMotivo} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList items={mockTopSkus.map((item) => ({ label: item.descricao, valor: item.valor }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList items={mockTopClientes.map((item) => ({ label: item.nome, valor: item.valor }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList items={mockTopVendedores.map((item) => ({ label: item.nome, valor: item.valor }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas negociações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor perdido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockNegociacoesRecentes.map((neg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{neg.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{neg.vendedor}</TableCell>
                  <TableCell className="text-muted-foreground">{neg.data}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {neg.valorPerdido > 0 ? formatBRL(neg.valorPerdido) : "—"}
                  </TableCell>
                  <TableCell>
                    <NegociacaoStatusBadge status={neg.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
