import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, Handshake, PackageX, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { NegociacaoStatusBadge } from "@/components/negociacao-status-badge";
import { formatBRL, formatNumber } from "@/lib/format";
import { itemTotais, mockTickets, ticketTotais } from "@/lib/mock-data";
import { NfForm } from "./nf-form";

export function generateStaticParams() {
  return mockTickets.map((ticket) => ({ id: ticket.id }));
}

export default async function NegociacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = mockTickets.find((t) => t.id === id);
  if (!ticket) notFound();

  const totais = ticketTotais(ticket);
  const bonificadas = ticket.itens.reduce((acc, item) => acc + item.qtdBonificada, 0);
  const valorBonificado = ticket.itens.reduce(
    (acc, item) => acc + item.qtdBonificada * item.precoNegociado,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            nativeButton={false}
            render={<Link href="/negociacoes" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Negociações
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{ticket.codigo}</h1>
            <NegociacaoStatusBadge status={ticket.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {ticket.cliente} · {ticket.data} · {ticket.vendedor}
          </p>
        </div>
        <NfForm nfInicial={ticket.nf} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total negociado" value={formatBRL(totais.totalNegociado)} icon={Handshake} />
        <KpiCard
          label="Total do pedido"
          value={formatBRL(totais.totalVendido)}
          hint={
            totais.totalNegociado > 0
              ? `${Math.round((totais.totalVendido / totais.totalNegociado) * 100)}% do negociado`
              : undefined
          }
          icon={ShoppingCart}
          tone="success"
        />
        <KpiCard
          label="Perdido por ruptura"
          value={totais.valorPerdido > 0 ? formatBRL(totais.valorPerdido) : "—"}
          hint={totais.unidadesPerdidas > 0 ? `${formatNumber(totais.unidadesPerdidas)} unidades` : "sem ruptura neste pedido"}
          icon={PackageX}
          tone={totais.valorPerdido > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Bonificação"
          value={bonificadas > 0 ? `${formatNumber(bonificadas)} un.` : "—"}
          hint={bonificadas > 0 ? `${formatBRL(valorBonificado)} em produto bonificado` : "sem bonificação"}
          icon={Gift}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Itens do pedido</CardTitle>
            <CardDescription>
              Preço negociado por SKU, quantidades e situação de estoque no momento da negociação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço un.</TableHead>
                    <TableHead className="text-right">Negociado</TableHead>
                    <TableHead className="text-right">Vendido</TableHead>
                    <TableHead className="text-right">Bonif.</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Ruptura</TableHead>
                    <TableHead className="text-right">Total item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticket.itens.map((item) => {
                    const t = itemTotais(item);
                    const semEstoque = item.qtdNegociada > item.estoqueDisponivel;
                    return (
                      <TableRow key={item.sku}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="max-w-[220px] truncate font-medium">{item.descricao}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBRL(item.precoNegociado)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(item.qtdNegociada)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(item.qtdVendida)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {item.qtdBonificada > 0 ? formatNumber(item.qtdBonificada) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatNumber(item.estoqueDisponivel)}
                        </TableCell>
                        <TableCell>
                          {t.valorPerdido > 0 ? (
                            <Badge variant="outline" className="bg-warning/10 text-warning">
                              −{formatBRL(t.valorPerdido)}
                            </Badge>
                          ) : item.motivo ? (
                            <span className="text-xs text-muted-foreground">{item.motivo}</span>
                          ) : semEstoque ? (
                            <span className="text-xs text-muted-foreground">estoque justo</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">ok</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatBRL(t.totalVendido)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 text-sm">
              <span className="text-muted-foreground">
                Negociado: <span className="font-medium text-foreground tabular-nums">{formatBRL(totais.totalNegociado)}</span>
              </span>
              {totais.valorPerdido > 0 && (
                <span className="text-muted-foreground">
                  Ruptura: <span className="font-medium text-warning tabular-nums">−{formatBRL(totais.valorPerdido)}</span>
                </span>
              )}
              <span className="text-muted-foreground">
                Total do pedido:{" "}
                <span className="text-base font-semibold text-foreground tabular-nums">
                  {formatBRL(totais.totalVendido)}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{ticket.cliente}</p>
                <p className="text-muted-foreground">{ticket.clienteCodigo}</p>
              </div>
              <Separator />
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Cidade/UF</dt>
                  <dd>{ticket.cidadeUf}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Canal</dt>
                  <dd>{ticket.canal}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Vendedor</dt>
                  <dd>{ticket.vendedor}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Data</dt>
                  <dd>{ticket.data}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">NF</dt>
                  <dd>{ticket.nf ?? <span className="italic text-muted-foreground">pendente</span>}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {ticket.observacoes ?? "Sem observações registradas."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
