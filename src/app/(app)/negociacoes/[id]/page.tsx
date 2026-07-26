import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, Handshake, PackageX, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/kpi-card";
import { SkuTooltip } from "@/components/sku-tooltip";
import { formatBRL, formatBRLPreco, formatNumber } from "@/lib/format";
import { bonifStatus, bonificacaoTotais, itemTotais, ticketTotais } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getNegociacaoById } from "@/lib/queries/negociacoes";
import { getProdutos } from "@/lib/queries/cadastros";
import { NfForm } from "./nf-form";
import { StatusControl } from "./status-control";
import { BonificacaoControl } from "./bonificacao-control";
import { NotasPanel } from "./notas-panel";
import { ArquivosPanel } from "./arquivos-panel";

function Campo({
  label,
  children,
  destaque = false,
}: {
  label: string;
  children: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={destaque ? "text-sm font-semibold tabular-nums" : "text-sm font-medium tabular-nums"}>
        {children}
      </div>
    </div>
  );
}

export default async function NegociacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [ticket, produtos] = await Promise.all([getNegociacaoById(supabase, id), getProdutos(supabase)]);
  if (!ticket) notFound();

  const totais = ticketTotais(ticket);
  const statusBoni = bonifStatus(ticket.bonificacao);
  const boniTotais = bonificacaoTotais(ticket.bonificacao);

  return (
    <div className="space-y-6">
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
            <StatusControl ticketId={ticket.id} statusInicial={ticket.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {ticket.cliente} · {ticket.data} · {ticket.vendedor}
          </p>
        </div>
        <NfForm ticketId={ticket.id} nfInicial={ticket.nf} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Negociação preliminar"
          value={formatBRL(totais.totalV1)}
          hint={`${ticket.itens.length} itens no acordo original`}
          icon={Handshake}
        />
        <KpiCard
          label="Negociação final"
          value={formatBRL(totais.totalFinal)}
          hint={
            totais.totalV1 > 0
              ? `${Math.round((totais.totalFinal / totais.totalV1) * 100)}% do preliminar`
              : undefined
          }
          icon={ShoppingCart}
          tone="success"
        />
        <KpiCard
          label="Perdido por ruptura"
          value={totais.valorPerdido > 0 ? formatBRL(totais.valorPerdido) : "—"}
          hint={
            totais.unidadesPerdidas > 0
              ? `${formatNumber(totais.unidadesPerdidas)} unidades`
              : "sem ruptura neste pedido"
          }
          icon={PackageX}
          tone={totais.valorPerdido > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Bonificação do pedido"
          value={ticket.bonificacao ? formatBRL(boniTotais.valor) : "—"}
          hint={
            ticket.bonificacao
              ? `${formatNumber(boniTotais.pecas)} peças · ${
                  statusBoni === "pago" ? "paga" : statusBoni === "atrasada" ? "atrasada" : "pendente"
                }`
              : "sem bonificação"
          }
          icon={Gift}
          tone={statusBoni === "atrasada" ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens acordados</CardTitle>
          <CardDescription>
            A negociação preliminar é o acordo original; se houver ruptura, a quantidade final
            registra o ajuste e o motivo justifica a diferença. Passe o mouse no SKU para ver a
            categoria do catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.itens.map((item) => {
            const t = itemTotais(item);
            const divergencia = item.qtdV1 !== item.qtdFinal;
            return (
              <div key={item.sku} className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SkuTooltip sku={item.sku} descricao={item.descricao} />
                    <p className="font-medium">{item.descricao}</p>
                    {divergencia && (
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        {item.motivo ?? "sem motivo"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total negociado</p>
                    <p className="text-lg font-semibold tabular-nums">{formatBRLPreco(t.totalFinal)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
                  <Campo label="Preço tabela">{formatBRLPreco(item.precoTabela)}</Campo>
                  <Campo label="Preço negociado" destaque>
                    {formatBRLPreco(item.precoNegociado)}
                  </Campo>
                  <Campo label="Desconto">{t.descontoPct > 0 ? `${t.descontoPct}%` : "—"}</Campo>
                  <Campo label="Qtd preliminar">{formatNumber(item.qtdV1)}</Campo>
                  <Campo label="Qtd final" destaque>
                    <span className={divergencia ? "text-warning" : undefined}>
                      {formatNumber(item.qtdFinal)}
                    </span>
                  </Campo>
                  <Campo label="Motivo">
                    {divergencia ? (
                      <span className="text-warning">{item.motivo ?? "sem motivo"}</span>
                    ) : (
                      "—"
                    )}
                  </Campo>
                  <Campo label="Estoque no momento">{formatNumber(item.estoqueDisponivel)}</Campo>
                  <Campo label="Ruptura">
                    {t.valorPerdido > 0 ? (
                      <span className="text-warning">−{formatBRLPreco(t.valorPerdido)}</span>
                    ) : (
                      "—"
                    )}
                  </Campo>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 rounded-lg bg-muted/50 px-5 py-4 text-sm">
            <span className="text-muted-foreground">
              Preliminar:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatBRLPreco(totais.totalV1)}
              </span>
            </span>
            {totais.valorPerdido > 0 && (
              <span className="text-muted-foreground">
                Ruptura:{" "}
                <span className="font-medium text-warning tabular-nums">
                  −{formatBRLPreco(totais.valorPerdido)}
                </span>
              </span>
            )}
            {ticket.bonificacao && (
              <span className="text-muted-foreground">
                Bonificação:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatBRLPreco(boniTotais.valor)}
                </span>
              </span>
            )}
            <span className="text-muted-foreground">
              Total final:{" "}
              <span className="text-base font-semibold text-foreground tabular-nums">
                {formatBRLPreco(totais.totalFinal)}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      <BonificacaoControl ticketId={ticket.id} bonificacao={ticket.bonificacao} produtos={produtos} />

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
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
            <div>
              <dt className="text-muted-foreground">Cidade/UF</dt>
              <dd className="font-medium">{ticket.cidadeUf}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Canal</dt>
              <dd className="font-medium">{ticket.canal}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vendedor</dt>
              <dd className="font-medium">{ticket.vendedor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd className="font-medium">{ticket.data}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">NF</dt>
              <dd className="font-medium">
                {ticket.nf ?? <span className="italic text-muted-foreground">pendente</span>}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotasPanel
          ticketId={ticket.id}
          notas={ticket.notas}
          autor={ticket.vendedor}
          usuarioId={user!.id}
        />
        <ArquivosPanel
          ticketId={ticket.id}
          arquivos={ticket.arquivos}
          autor={ticket.vendedor}
          usuarioId={user!.id}
        />
      </div>
    </div>
  );
}
