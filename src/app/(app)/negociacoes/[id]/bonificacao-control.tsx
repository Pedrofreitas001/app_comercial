"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CircleCheck, Gift, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BonifStatusBadge } from "@/components/bonif-status-badge";
import { formatBRLPreco, formatNumber } from "@/lib/format";
import {
  bonifStatus,
  mockProdutos,
  produtoCatalogo,
  type BonificacaoItem,
  type MockBonificacao,
} from "@/lib/mock-data";

const produtoOptions = mockProdutos.map((p) => ({
  value: p.sku,
  label: p.descricao,
  sublabel: [p.sku, p.categoria].filter(Boolean).join(" · "),
}));

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

interface ItemState extends BonificacaoItem {
  key: string;
}

function toItemState(itens: BonificacaoItem[]): ItemState[] {
  return itens.map((item) => ({
    ...item,
    // canoniza pro SKU de venda (SKU_saida) - o combobox só lista codigos
    // canonicos, e o item pode ter vindo salvo com um codigo de entrada.
    sku: produtoCatalogo(item.sku)?.sku ?? item.sku,
    key: Math.random().toString(36).slice(2),
  }));
}

// Controle da bonificação acordada sobre o TOTAL do pedido: produtos
// escolhidos numa lista (SKU + quantidade + preço base) contabilizam peças e
// faturamento automaticamente. Estado local por enquanto — será gravado no
// banco quando o Supabase estiver conectado.
export function BonificacaoControl({ bonificacao }: { bonificacao: MockBonificacao | null }) {
  const [ativa, setAtiva] = useState(bonificacao !== null);
  const [itens, setItens] = useState<ItemState[]>(toItemState(bonificacao?.itens ?? []));
  const [paga, setPaga] = useState(bonificacao?.paga ?? false);
  const [dataPagamento, setDataPagamento] = useState(bonificacao?.dataPagamento ?? "");
  const [obs, setObs] = useState(bonificacao?.observacoes ?? "");

  const totais = useMemo(
    () => itens.reduce((acc, item) => ({ pecas: acc.pecas + item.qtd, valor: acc.valor + item.qtd * item.precoBase }), {
      pecas: 0,
      valor: 0,
    }),
    [itens],
  );

  const status = bonifStatus({ itens, dataPagamento: dataPagamento || null, paga, observacoes: obs || null });

  function adicionarItem() {
    setItens((prev) => [...prev, { key: Math.random().toString(36).slice(2), sku: "", qtd: 1, precoBase: 0 }]);
  }

  function atualizarItem(key: string, patch: Partial<ItemState>) {
    setItens((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function onSkuChange(key: string, sku: string) {
    const produto = produtoCatalogo(sku);
    atualizarItem(key, { sku, precoBase: produto?.preco ?? 0 });
  }

  function removerItem(key: string) {
    setItens((prev) => prev.filter((item) => item.key !== key));
  }

  function togglePagamento() {
    const nova = !paga;
    setPaga(nova);
    toast.success(nova ? "Bonificação marcada como paga" : "Pagamento da bonificação reaberto", {
      description: "Exemplo — será gravado no banco quando o Supabase estiver conectado.",
    });
  }

  function salvar() {
    toast.success("Bonificação salva", {
      description: "Exemplo — será gravada no banco quando o Supabase estiver conectado.",
    });
  }

  if (!ativa) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" />
              Bonificação do pedido
            </CardTitle>
            <CardDescription>Acordo de bonificação sobre o total do pedido.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAtiva(true);
              if (itens.length === 0) adicionarItem();
            }}
          >
            <Plus data-icon="inline-start" />
            Adicionar bonificação
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-muted-foreground" />
            Bonificação do pedido
          </CardTitle>
          <CardDescription>Escolha os produtos bonificados — peças e faturamento somam sozinhos.</CardDescription>
        </div>
        {status && <BonifStatusBadge status={status} />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.key} className="flex items-start gap-2 rounded-lg border bg-card p-3">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_140px]">
                <Combobox
                  options={produtoOptions}
                  value={item.sku}
                  onChange={(sku) => onSkuChange(item.key, sku)}
                  placeholder="Selecione o produto"
                  searchPlaceholder="Buscar por SKU ou descrição..."
                  emptyText="Nenhum produto encontrado."
                />
                <Input
                  type="number"
                  min={1}
                  value={item.qtd}
                  onChange={(e) => atualizarItem(item.key, { qtd: Number(e.target.value) || 0 })}
                  placeholder="Qtd"
                />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.precoBase}
                  onChange={(e) => atualizarItem(item.key, { precoBase: Number(e.target.value) || 0 })}
                  placeholder="Preço base"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={() => removerItem(item.key)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={adicionarItem}>
            <Plus data-icon="inline-start" />
            Adicionar produto
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Campo label="Peças acordadas">{formatNumber(totais.pecas)} un.</Campo>
          <Campo label="Faturamento acordado">{formatBRLPreco(totais.valor)}</Campo>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Data a pagar</p>
            <div className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
              <Input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <Campo label="Pagamento">
            <Button size="sm" variant={paga ? "outline" : "default"} onClick={togglePagamento}>
              {paga ? (
                <>
                  <RotateCcw data-icon="inline-start" />
                  Reabrir
                </>
              ) : (
                <>
                  <CircleCheck data-icon="inline-start" />
                  Marcar como paga
                </>
              )}
            </Button>
          </Campo>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="obs-boni" className="text-xs text-muted-foreground">
            Anotações da bonificação
          </Label>
          <div className="flex gap-2">
            <Input
              id="obs-boni"
              value={obs}
              onChange={(event) => setObs(event.target.value)}
              placeholder="Ex.: entrega junto com a próxima NF"
            />
            <Button variant="secondary" onClick={salvar}>
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
