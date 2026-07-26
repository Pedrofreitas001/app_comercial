import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, Handshake, PackageX, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/kpi-card";
import { formatBRL, formatNumber } from "@/lib/format";
import { bonifStatus, bonificacaoTotais, ticketTotais } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getNegociacaoById } from "@/lib/queries/negociacoes";
import { getProdutos } from "@/lib/queries/cadastros";
import { getEstoqueNormalizado } from "@/lib/queries/estoque";
import { NfForm } from "./nf-form";
import { StatusControl } from "./status-control";
import { ItensPanel } from "./itens-panel";
import { BonificacaoControl } from "./bonificacao-control";
import { NotasPanel } from "./notas-panel";
import { ArquivosPanel } from "./arquivos-panel";

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
  const [ticket, produtos, { linhas: linhasEstoque }, { data: usuario }, { data: motivos }] = await Promise.all([
    getNegociacaoById(supabase, id),
    getProdutos(supabase),
    getEstoqueNormalizado(supabase),
    supabase.from("usuarios").select("role").eq("id", user!.id).single(),
    supabase.from("motivos_perda").select("codigo, label"),
  ]);
  if (!ticket) notFound();

  const totais = ticketTotais(ticket);
  const statusBoni = bonifStatus(ticket.bonificacao);
  const boniTotais = bonificacaoTotais(ticket.bonificacao);

  // Pedido cancelado não deve mais ser mexido; leitura só nunca edita.
  // As demais permissões (carteira do vendedor) já são garantidas por RLS.
  const podeEditar = ticket.status !== "cancelada" && usuario?.role !== "leitura";

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

      <ItensPanel
        ticketId={ticket.id}
        itens={ticket.itens}
        produtos={produtos}
        linhasEstoque={linhasEstoque}
        motivos={motivos ?? []}
        podeEditar={podeEditar}
      />

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
