"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, TriangleAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  MOTIVO_SEM_ESTOQUE,
  MOTIVOS,
  estoqueDisponivelDe,
  estoqueNormalizadoDe,
  mockClientes,
  mockProdutos,
  mockVendedores,
  produtoCatalogo,
  proximoCodigoTicket,
} from "@/lib/mock-data";
import { formatBRLPreco, formatNumber } from "@/lib/format";

interface ItemForm {
  key: string;
  sku: string;
  precoNegociado: number;
  qtdV1: number;
  qtdFinal: number;
  motivo: string | null;
  finalTocado: boolean;
}

function novoItem(): ItemForm {
  return {
    key: Math.random().toString(36).slice(2),
    sku: "",
    precoNegociado: 0,
    qtdV1: 1,
    qtdFinal: 1,
    motivo: null,
    finalTocado: false,
  };
}

interface BonifItemForm {
  key: string;
  sku: string;
  qtd: number;
  precoBase: number;
}

function novoItemBoni(): BonifItemForm {
  return { key: Math.random().toString(36).slice(2), sku: "", qtd: 1, precoBase: 0 };
}

const clienteOptions = mockClientes.map((c) => ({
  value: c.codigo,
  label: c.nomeResumido,
  sublabel: [c.cidade && c.estado ? `${c.cidade}/${c.estado}` : null, c.codigo].filter(Boolean).join(" · "),
}));

const produtoOptions = mockProdutos.map((p) => ({
  value: p.sku,
  label: p.descricao,
  sublabel: [p.sku, p.categoria].filter(Boolean).join(" · "),
}));

export function NovaNegociacaoForm() {
  const router = useRouter();
  const [clienteCodigo, setClienteCodigo] = useState("");
  const [vendedor, setVendedor] = useState(mockVendedores[0]);
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [temBonificacao, setTemBonificacao] = useState(false);
  const [itensBoni, setItensBoni] = useState<BonifItemForm[]>([]);
  const [boniData, setBoniData] = useState("");
  const [salvando, setSalvando] = useState(false);

  const boniTotais = useMemo(
    () =>
      itensBoni.reduce(
        (acc, item) => ({ pecas: acc.pecas + item.qtd, valor: acc.valor + item.qtd * item.precoBase }),
        { pecas: 0, valor: 0 },
      ),
    [itensBoni],
  );

  function atualizarItemBoni(key: string, patch: Partial<BonifItemForm>) {
    setItensBoni((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function onSkuBoniChange(key: string, sku: string) {
    const produto = produtoCatalogo(sku);
    atualizarItemBoni(key, { sku, precoBase: produto?.preco ?? 0 });
  }

  function removerItemBoni(key: string) {
    setItensBoni((prev) => prev.filter((item) => item.key !== key));
  }

  const cliente = mockClientes.find((c) => c.codigo === clienteCodigo) ?? null;

  function atualizarItem(key: string, patch: Partial<ItemForm> | ((item: ItemForm) => Partial<ItemForm>)) {
    setItens((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) } : item)),
    );
  }

  function onSkuChange(key: string, sku: string) {
    const produto = produtoCatalogo(sku);
    const estoque = estoqueDisponivelDe(sku);
    atualizarItem(key, (item) => {
      const qtdV1 = item.qtdV1 || 1;
      const emRuptura = qtdV1 > estoque;
      return {
        sku,
        precoNegociado: produto?.preco ?? 0,
        qtdV1,
        qtdFinal: emRuptura ? estoque : qtdV1,
        motivo: emRuptura ? MOTIVO_SEM_ESTOQUE : null,
        finalTocado: false,
      };
    });
  }

  function onQtdV1Change(key: string, value: number) {
    atualizarItem(key, (item) => {
      if (item.finalTocado) return { qtdV1: value };
      const estoque = item.sku ? estoqueDisponivelDe(item.sku) : Infinity;
      const emRuptura = item.sku && value > estoque;
      return {
        qtdV1: value,
        qtdFinal: emRuptura ? estoque : value,
        motivo: emRuptura ? MOTIVO_SEM_ESTOQUE : null,
      };
    });
  }

  function onQtdFinalChange(key: string, value: number) {
    atualizarItem(key, (item) => ({ qtdFinal: value, finalTocado: value !== item.qtdV1 }));
  }

  function removerItem(key: string) {
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  const resumo = useMemo(() => {
    let totalV1 = 0;
    let totalFinal = 0;
    let ruptura = 0;
    for (const item of itens) {
      if (!item.sku) continue;
      totalV1 += item.qtdV1 * item.precoNegociado;
      totalFinal += item.qtdFinal * item.precoNegociado;
      if (item.motivo === MOTIVO_SEM_ESTOQUE) {
        ruptura += Math.max(item.qtdV1 - item.qtdFinal, 0) * item.precoNegociado;
      }
    }
    return { totalV1, totalFinal, ruptura };
  }, [itens]);

  const itensValidos = itens.filter((item) => item.sku);
  const pendencias = itensValidos.filter((item) => item.qtdFinal !== item.qtdV1 && !item.motivo);
  const bonificacaoIncompleta = temBonificacao && itensBoni.filter((item) => item.sku).length === 0;
  const podeSalvar =
    Boolean(clienteCodigo) && itensValidos.length > 0 && pendencias.length === 0 && !bonificacaoIncompleta;

  function salvar() {
    if (!podeSalvar) {
      toast.error("Revise a negociação", {
        description: bonificacaoIncompleta
          ? "Escolha ao menos um produto na bonificação, ou remova a opção."
          : "Selecione um cliente e informe o motivo em todo item com quantidade divergente.",
      });
      return;
    }
    setSalvando(true);
    const codigo = proximoCodigoTicket();
    setTimeout(() => {
      setSalvando(false);
      toast.success(`Negociação ${codigo} registrada`, {
        description: "Exemplo — será gravada no banco quando o Supabase estiver conectado.",
      });
      router.push("/negociacoes");
    }, 400);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da negociação</CardTitle>
          <CardDescription>Cliente, vendedor e contexto do acordo.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Combobox
              options={clienteOptions}
              value={clienteCodigo}
              onChange={setClienteCodigo}
              placeholder="Selecione o cliente"
              searchPlaceholder="Buscar por nome ou código..."
              emptyText="Nenhum cliente encontrado."
            />
            {cliente && (
              <p className="text-xs text-muted-foreground">
                {cliente.rede ?? cliente.nome} · {cliente.canal ?? "canal não informado"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Vendedor</Label>
            <Select value={vendedor} onValueChange={(v) => setVendedor(v ?? mockVendedores[0])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockVendedores.map((nome) => (
                  <SelectItem key={nome} value={nome}>
                    {nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs-negociacao">Observações</Label>
            <Input
              id="obs-negociacao"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Contexto do acordo (opcional)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
          <CardDescription>
            Escolha o SKU e a quantidade negociada — o total atualiza sozinho. Se a quantidade
            final ficar abaixo do estoque disponível, a ruptura é apontada na hora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {itens.map((item) => {
            const produto = produtoCatalogo(item.sku);
            const norm = item.sku ? estoqueNormalizadoDe(item.sku) : null;
            const divergente = item.sku && item.qtdFinal !== item.qtdV1;
            const totalItem = item.qtdFinal * item.precoNegociado;
            const precisaMotivo = divergente && !item.motivo;

            return (
              <div key={item.key} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5 lg:col-span-2">
                      <Label className="text-xs text-muted-foreground">SKU / Produto</Label>
                      <Combobox
                        options={produtoOptions}
                        value={item.sku}
                        onChange={(sku) => onSkuChange(item.key, sku)}
                        placeholder="Selecione o produto"
                        searchPlaceholder="Buscar por SKU ou descrição..."
                        emptyText="Nenhum produto encontrado."
                      />
                      {produto && norm && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Tabela {formatBRLPreco(produto.preco ?? 0)}</span>
                          <span>STRALOG {formatNumber(norm.bruto)} un.</span>
                          <span
                            className={
                              norm.emRuptura
                                ? "font-medium text-destructive"
                                : norm.aguardandoBaixa
                                  ? "font-medium text-warning"
                                  : "font-medium text-foreground"
                            }
                          >
                            Provisionado {formatNumber(norm.normalizado)} un.
                          </span>
                          {norm.emRuptura ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive">
                              <TriangleAlert data-icon="inline-start" />
                              Ruptura confirmada — déficit de {formatNumber(norm.deficit)} un., aguardando
                              reposição no STRALOG
                            </Badge>
                          ) : (
                            norm.aguardandoBaixa && (
                              <Badge variant="outline" className="bg-warning/10 text-warning">
                                <TriangleAlert data-icon="inline-start" />
                                {formatNumber(norm.pendente)} un. aguardando baixa no STRALOG
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Preço negociado</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.precoNegociado}
                        onChange={(event) =>
                          atualizarItem(item.key, { precoNegociado: Number(event.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Qtd negociada (V1)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.qtdV1}
                        onChange={(event) => onQtdV1Change(item.key, Number(event.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="mt-6 shrink-0 text-muted-foreground"
                    onClick={() => removerItem(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>

                {item.sku && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Qtd final</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.qtdFinal}
                          onChange={(event) => onQtdFinalChange(item.key, Number(event.target.value) || 0)}
                          className={divergente ? "border-warning text-warning" : undefined}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Motivo</Label>
                        <Select
                          value={item.motivo ?? "__none"}
                          onValueChange={(v) => atualizarItem(item.key, { motivo: v === "__none" ? null : v })}
                          disabled={!divergente}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {!divergente && <SelectItem value="__none">—</SelectItem>}
                            {MOTIVOS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total do item</p>
                        <p className="text-sm font-semibold tabular-nums">{formatBRLPreco(totalItem)}</p>
                      </div>
                      <div className="space-y-1">
                        {divergente && item.motivo === MOTIVO_SEM_ESTOQUE && (
                          <Badge variant="outline" className="bg-warning/10 text-warning">
                            <TriangleAlert data-icon="inline-start" />
                            Ruptura no momento da negociação
                          </Badge>
                        )}
                        {precisaMotivo && (
                          <p className="text-xs font-medium text-warning">Selecione o motivo da divergência</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <Button variant="outline" onClick={() => setItens((prev) => [...prev, novoItem()])}>
            <Plus data-icon="inline-start" />
            Adicionar item
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 rounded-lg bg-muted/50 px-5 py-4 text-sm">
            <span className="text-muted-foreground">
              Negociação preliminar:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatBRLPreco(resumo.totalV1)}
              </span>
            </span>
            {resumo.ruptura > 0 && (
              <span className="text-muted-foreground">
                Ruptura:{" "}
                <span className="font-medium text-warning tabular-nums">
                  −{formatBRLPreco(resumo.ruptura)}
                </span>
              </span>
            )}
            <span className="text-muted-foreground">
              Total final:{" "}
              <span className="text-base font-semibold text-foreground tabular-nums">
                {formatBRLPreco(resumo.totalFinal)}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" />
              Bonificação
            </CardTitle>
            <CardDescription>Acordo sobre o total do pedido, não por SKU (opcional).</CardDescription>
          </div>
          <Button
            variant={temBonificacao ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              const nova = !temBonificacao;
              setTemBonificacao(nova);
              if (nova && itensBoni.length === 0) setItensBoni([novoItemBoni()]);
            }}
          >
            {temBonificacao ? "Remover bonificação" : "Adicionar bonificação"}
          </Button>
        </CardHeader>
        {temBonificacao && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {itensBoni.map((item) => (
                <div key={item.key} className="flex items-start gap-2 rounded-lg border bg-card p-3">
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_140px]">
                    <Combobox
                      options={produtoOptions}
                      value={item.sku}
                      onChange={(sku) => onSkuBoniChange(item.key, sku)}
                      placeholder="Selecione o produto"
                      searchPlaceholder="Buscar por SKU ou descrição..."
                      emptyText="Nenhum produto encontrado."
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.qtd}
                      onChange={(e) => atualizarItemBoni(item.key, { qtd: Number(e.target.value) || 0 })}
                      placeholder="Qtd"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.precoBase}
                      onChange={(e) => atualizarItemBoni(item.key, { precoBase: Number(e.target.value) || 0 })}
                      placeholder="Preço base"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removerItemBoni(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItensBoni((prev) => [...prev, novoItemBoni()])}
              >
                <Plus data-icon="inline-start" />
                Adicionar produto
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Peças acordadas</p>
                <p className="text-sm font-semibold tabular-nums">{formatNumber(boniTotais.pecas)} un.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Faturamento acordado</p>
                <p className="text-sm font-semibold tabular-nums">{formatBRLPreco(boniTotais.valor)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data a pagar</Label>
                <Input type="date" value={boniData} onChange={(e) => setBoniData(e.target.value)} className="h-8" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/negociacoes")}>
          Cancelar
        </Button>
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar negociação"}
        </Button>
      </div>
    </div>
  );
}
