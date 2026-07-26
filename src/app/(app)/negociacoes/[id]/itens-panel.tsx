"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, TriangleAlert, Trash2, X } from "lucide-react";
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
import { SkuTooltip } from "@/components/sku-tooltip";
import { formatBRLPreco, formatNumber } from "@/lib/format";
import { MOTIVO_SEM_ESTOQUE, MOTIVOS, itemTotais, type MockItemNegociacao } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { salvarItens, type ItemEditavel } from "@/lib/queries/negociacoes";
import type { ProdutoRow } from "@/lib/queries/cadastros";
import type { LinhaEstoque } from "@/lib/queries/estoque";

interface LinhaForm {
  key: string;
  id?: string;
  sku: string;
  descricao: string;
  categoria: string | null;
  precoTabela: number;
  precoNegociado: number;
  qtdV1: number;
  qtdFinal: number;
  estoqueDisponivel: number;
  motivo: string | null;
}

function paraForm(itens: MockItemNegociacao[]): LinhaForm[] {
  return itens.map((item) => ({
    key: item.id ?? Math.random().toString(36).slice(2),
    id: item.id,
    sku: item.sku,
    descricao: item.descricao,
    categoria: item.categoria ?? null,
    precoTabela: item.precoTabela,
    precoNegociado: item.precoNegociado,
    qtdV1: item.qtdV1,
    qtdFinal: item.qtdFinal,
    estoqueDisponivel: item.estoqueDisponivel,
    motivo: item.motivo,
  }));
}

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

interface Props {
  ticketId: string;
  itens: MockItemNegociacao[];
  produtos: ProdutoRow[];
  linhasEstoque: LinhaEstoque[];
  motivos: { codigo: string; label: string }[];
  podeEditar: boolean;
}

export function ItensPanel({ ticketId, itens: itensIniciais, produtos, linhasEstoque, motivos, podeEditar }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [linhas, setLinhas] = useState<LinhaForm[]>(() => paraForm(itensIniciais));
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const produtoPorSku = useMemo(() => new Map(produtos.map((p) => [p.sku, p])), [produtos]);
  const estoquePorSku = useMemo(() => new Map(linhasEstoque.map((l) => [l.row.sku, l.norm])), [linhasEstoque]);
  const motivoPorLabel = useMemo(() => new Map(motivos.map((m) => [m.label, m.codigo])), [motivos]);
  const produtoOptions = useMemo(
    () =>
      produtos.map((p) => ({
        value: p.sku,
        label: p.descricao,
        sublabel: [p.sku, p.categoria].filter(Boolean).join(" · "),
      })),
    [produtos],
  );

  const totais = useMemo(() => {
    let totalV1 = 0;
    let totalFinal = 0;
    let valorPerdido = 0;
    for (const l of linhas) {
      if (!l.sku) continue;
      totalV1 += l.qtdV1 * l.precoNegociado;
      totalFinal += l.qtdFinal * l.precoNegociado;
      if (l.motivo === MOTIVO_SEM_ESTOQUE) {
        valorPerdido += Math.max(l.qtdV1 - l.qtdFinal, 0) * l.precoNegociado;
      }
    }
    return { totalV1, totalFinal, valorPerdido };
  }, [linhas]);

  function atualizar(key: string, patch: Partial<LinhaForm>) {
    setLinhas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function onSkuChange(key: string, sku: string) {
    const produto = produtoPorSku.get(sku);
    atualizar(key, {
      sku,
      descricao: produto?.descricao ?? sku,
      categoria: produto?.categoria ?? null,
      precoTabela: produto?.preco ?? 0,
      precoNegociado: produto?.preco ?? 0,
      estoqueDisponivel: estoquePorSku.get(sku)?.normalizado ?? 0,
    });
  }

  function adicionar() {
    setLinhas((prev) => [
      ...prev,
      {
        key: Math.random().toString(36).slice(2),
        sku: "",
        descricao: "",
        categoria: null,
        precoTabela: 0,
        precoNegociado: 0,
        qtdV1: 1,
        qtdFinal: 1,
        estoqueDisponivel: 0,
        motivo: null,
      },
    ]);
  }

  function remover(key: string) {
    const linha = linhas.find((l) => l.key === key);
    if (linha?.id) setRemovidos((prev) => [...prev, linha.id!]);
    setLinhas((prev) => prev.filter((l) => l.key !== key));
  }

  function cancelar() {
    setLinhas(paraForm(itensIniciais));
    setRemovidos([]);
    setEditando(false);
  }

  const linhasValidas = linhas.filter((l) => l.sku);
  // O banco exige motivo sempre que a quantidade final difere da preliminar
  // (constraint chk_motivo_quando_divergencia) — barra antes de tentar salvar.
  const semMotivo = linhasValidas.filter((l) => l.qtdFinal !== l.qtdV1 && !l.motivo);

  async function salvar() {
    if (linhasValidas.length === 0) {
      toast.error("O pedido precisa de ao menos um item.");
      return;
    }
    if (semMotivo.length > 0) {
      toast.error("Informe o motivo", {
        description: "Todo item com quantidade final diferente da preliminar precisa de um motivo.",
      });
      return;
    }
    setSalvando(true);
    try {
      const supabase = createClient();
      const paraSalvar: ItemEditavel[] = linhasValidas.map((l) => ({
        id: l.id,
        produtoId: produtoPorSku.get(l.sku)!.id,
        qtdV1: l.qtdV1,
        qtdFinal: l.qtdFinal,
        precoNegociado: l.precoNegociado,
        precoTabela: l.precoTabela || null,
        estoqueDisponivel: l.estoqueDisponivel,
        motivoCodigo: l.motivo ? motivoPorLabel.get(l.motivo) ?? null : null,
      }));
      await salvarItens(supabase, ticketId, paraSalvar, removidos);
      toast.success("Itens atualizados");
      setRemovidos([]);
      setEditando(false);
      router.refresh();
    } catch (e) {
      toast.error("Não foi possível salvar os itens", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Itens acordados</CardTitle>
          <CardDescription>
            {editando
              ? "Corrija preço, quantidade ou motivo. A ruptura é recalculada ao salvar."
              : "A negociação preliminar é o acordo original; se houver ruptura, a quantidade final registra o ajuste e o motivo justifica a diferença."}
          </CardDescription>
        </div>
        {podeEditar &&
          (editando ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" onClick={cancelar} disabled={salvando}>
                <X data-icon="inline-start" />
                Cancelar
              </Button>
              <Button size="sm" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar itens"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditando(true)}>
              <Pencil data-icon="inline-start" />
              Editar itens
            </Button>
          ))}
      </CardHeader>
      <CardContent className="space-y-4">
        {linhas.map((linha) => {
          const divergencia = linha.qtdFinal !== linha.qtdV1;
          const norm = linha.sku ? estoquePorSku.get(linha.sku) : undefined;
          const totalFinal = linha.qtdFinal * linha.precoNegociado;
          const perdido =
            linha.motivo === MOTIVO_SEM_ESTOQUE
              ? Math.max(linha.qtdV1 - linha.qtdFinal, 0) * linha.precoNegociado
              : 0;
          const descontoPct =
            linha.precoTabela > 0 ? Math.round((1 - linha.precoNegociado / linha.precoTabela) * 100) : 0;
          const precisaMotivo = divergencia && !linha.motivo;

          if (!editando) {
            return (
              <div key={linha.key} className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SkuTooltip sku={linha.sku} descricao={linha.descricao} categoria={linha.categoria} />
                    <p className="font-medium">{linha.descricao}</p>
                    {divergencia && (
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        {linha.motivo ?? "sem motivo"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total negociado</p>
                    <p className="text-lg font-semibold tabular-nums">{formatBRLPreco(totalFinal)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
                  <Campo label="Preço tabela">{formatBRLPreco(linha.precoTabela)}</Campo>
                  <Campo label="Preço negociado" destaque>
                    {linha.precoNegociado > 0 ? (
                      formatBRLPreco(linha.precoNegociado)
                    ) : (
                      <span className="text-warning">não informado</span>
                    )}
                  </Campo>
                  <Campo label="Desconto">{descontoPct > 0 ? `${descontoPct}%` : "—"}</Campo>
                  <Campo label="Qtd preliminar">{formatNumber(linha.qtdV1)}</Campo>
                  <Campo label="Qtd final" destaque>
                    <span className={divergencia ? "text-warning" : undefined}>{formatNumber(linha.qtdFinal)}</span>
                  </Campo>
                  <Campo label="Motivo">
                    {divergencia ? <span className="text-warning">{linha.motivo ?? "sem motivo"}</span> : "—"}
                  </Campo>
                  <Campo label="Estoque no momento">{formatNumber(linha.estoqueDisponivel)}</Campo>
                  <Campo label="Ruptura">
                    {perdido > 0 ? <span className="text-warning">−{formatBRLPreco(perdido)}</span> : "—"}
                  </Campo>
                </div>
              </div>
            );
          }

          return (
            <div key={linha.key} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs text-muted-foreground">SKU / Produto</Label>
                    <Combobox
                      options={produtoOptions}
                      value={linha.sku}
                      onChange={(sku) => onSkuChange(linha.key, sku)}
                      placeholder="Selecione o produto"
                      searchPlaceholder="Buscar por SKU ou descrição..."
                      emptyText="Nenhum produto encontrado."
                    />
                    {norm && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Preço tabela</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={linha.precoTabela}
                      onChange={(e) => atualizar(linha.key, { precoTabela: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Preço negociado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={linha.precoNegociado}
                      onChange={(e) => atualizar(linha.key, { precoNegociado: Number(e.target.value) || 0 })}
                      className={linha.precoNegociado === 0 ? "border-warning" : undefined}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="mt-6 shrink-0 text-muted-foreground"
                  onClick={() => remover(linha.key)}
                >
                  <Trash2 />
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qtd preliminar</Label>
                  <Input
                    type="number"
                    min={0}
                    value={linha.qtdV1}
                    onChange={(e) => atualizar(linha.key, { qtdV1: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qtd final</Label>
                  <Input
                    type="number"
                    min={0}
                    value={linha.qtdFinal}
                    onChange={(e) => atualizar(linha.key, { qtdFinal: Number(e.target.value) || 0 })}
                    className={divergencia ? "border-warning text-warning" : undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Motivo</Label>
                  <Select
                    value={linha.motivo ?? "__none"}
                    onValueChange={(v) => atualizar(linha.key, { motivo: v === "__none" ? null : v })}
                    disabled={!divergencia}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {!divergencia && <SelectItem value="__none">—</SelectItem>}
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
                  <p className="text-sm font-semibold tabular-nums">{formatBRLPreco(totalFinal)}</p>
                  {precisaMotivo && (
                    <p className="text-xs font-medium text-warning">Selecione o motivo da divergência</p>
                  )}
                  {perdido > 0 && (
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      <TriangleAlert data-icon="inline-start" />
                      Ruptura −{formatBRLPreco(perdido)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {editando && (
          <Button variant="outline" size="sm" onClick={adicionar}>
            <Plus data-icon="inline-start" />
            Adicionar item
          </Button>
        )}

        <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 rounded-lg bg-muted/50 px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Preliminar:{" "}
            <span className="font-medium text-foreground tabular-nums">{formatBRLPreco(totais.totalV1)}</span>
          </span>
          {totais.valorPerdido > 0 && (
            <span className="text-muted-foreground">
              Ruptura:{" "}
              <span className="font-medium text-warning tabular-nums">−{formatBRLPreco(totais.valorPerdido)}</span>
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
  );
}
