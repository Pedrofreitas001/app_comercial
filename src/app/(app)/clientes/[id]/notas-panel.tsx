"use client";

import { useMemo, useState } from "react";
import { CalendarRange, NotebookPen, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NOTA_CATEGORIAS, categoriaConfig, type NotaCategoria } from "@/lib/notas";
import type { NotaCliente } from "@/lib/queries/cliente-fup";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type Periodo = "todos" | "7d" | "30d" | "90d" | "mes" | "mesPassado";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "todos", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "mes", label: "Este mês" },
  { value: "mesPassado", label: "Mês passado" },
];

// Compara só a data (zera hora): uma nota de hoje às 23h tem que entrar em
// "últimos 7 dias" independentemente da hora em que o filtro é aplicado.
function dentroDoPeriodo(dataIso: string, periodo: Periodo): boolean {
  if (periodo === "todos") return true;
  const d = new Date(dataIso);
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  if (periodo === "mes") return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
  if (periodo === "mesPassado") {
    const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return d.getFullYear() === anterior.getFullYear() && d.getMonth() === anterior.getMonth();
  }

  const dias = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - (dias - 1));
  return dia >= inicio && dia <= hoje;
}

interface Props {
  clienteId: string;
  notas: NotaCliente[];
  autor: string;
  usuarioId: string;
  podeEscrever: boolean;
}

// Timeline de acompanhamento (FUP) do cliente. Cada nota carrega dois eixos
// independentes: a categoria (que tipo de contato foi) e o destaque (o que não
// pode passar batido) — o destaque não reordena a timeline, só filtra e marca.
export function NotasPanel({ clienteId, notas: notasIniciais, autor, usuarioId, podeEscrever }: Props) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<NotaCategoria>("contato");
  const [importante, setImportante] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState<string>("todas");
  const [periodo, setPeriodo] = useState<Periodo>("todos");

  const catSelecionada = categoriaConfig(categoria);

  // O período é aplicado primeiro: as contagens dos chips têm que refletir o
  // recorte de data, senão o chip diz "Proposta (3)" e a lista mostra 1.
  const noPeriodo = useMemo(
    () => notas.filter((n) => dentroDoPeriodo(n.dataIso, periodo)),
    [notas, periodo],
  );

  const contagens = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const n of noPeriodo) mapa.set(n.categoria, (mapa.get(n.categoria) ?? 0) + 1);
    return { porCategoria: mapa, destaques: noPeriodo.filter((n) => n.importante).length };
  }, [noPeriodo]);

  const visiveis = useMemo(() => {
    if (filtro === "todas") return noPeriodo;
    if (filtro === "destaques") return noPeriodo.filter((n) => n.importante);
    return noPeriodo.filter((n) => n.categoria === filtro);
  }, [noPeriodo, filtro]);

  async function adicionar() {
    if (!texto.trim()) {
      toast.error("Escreva algo antes de salvar a nota.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cliente_notas")
      .insert({
        cliente_id: clienteId,
        usuario_id: usuarioId,
        texto: texto.trim(),
        categoria,
        importante,
      })
      .select("id, texto, created_at, categoria, importante")
      .single();
    setSalvando(false);

    if (error || !data) {
      toast.error("Não foi possível salvar a nota", { description: error?.message });
      return;
    }

    const criada = new Date(data.created_at);
    const p = (n: number) => String(n).padStart(2, "0");
    const dataFormatada = `${p(criada.getDate())}/${p(criada.getMonth() + 1)}/${criada.getFullYear()} ${p(criada.getHours())}:${p(criada.getMinutes())}`;
    setNotas((prev) => [
      {
        id: data.id,
        autor,
        data: dataFormatada,
        dataIso: data.created_at,
        texto: data.texto,
        categoria: data.categoria,
        importante: data.importante,
      },
      ...prev,
    ]);
    setTexto("");
    setImportante(false);
    // Categoria fica como estava: quem registra várias visitas seguidas não
    // precisa reescolher a cada nota.
    toast.success(importante ? "Nota adicionada como destaque" : "Nota adicionada");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="size-4 text-muted-foreground" />
          Acompanhamento da negociação
        </CardTitle>
        <CardDescription>
          Registre ligações, decisões do cliente e combinados — classifique para achar depois.
        </CardDescription>
      </CardHeader>
      {/* min-h dá corpo ao card mesmo com poucas notas, pra não ficar um
          retângulo achatado ao lado do painel de arquivos. */}
      <CardContent className="flex min-h-[560px] flex-col gap-5">
        {podeEscrever && (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-foreground/[0.04]">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: cliente confirmou por telefone, aguardando aprovação do financeiro..."
              // Sem borda/ring próprios: o campo é a parte de cima do bloco,
              // não uma caixa dentro de outra caixa.
              className="min-h-[168px] resize-y rounded-none border-0 bg-transparent px-4 py-3.5 text-sm shadow-none focus-visible:ring-0"
            />

            <div className="space-y-3 border-t bg-muted/30 px-4 py-3.5">
              {/* Pills no lugar de um select: com 6 categorias cabe tudo à
                  vista, escolhe em 1 clique e nada é truncado — além de já
                  ensinar a cor que a nota vai ter na timeline. */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Classificação</p>
                  <p className="text-xs text-muted-foreground">{catSelecionada.descricao}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NOTA_CATEGORIAS.map((c) => {
                    const ativa = c.value === categoria;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategoria(c.value)}
                        aria-pressed={ativa}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                          ativa
                            ? cn(c.className, "ring-2 ring-foreground/15")
                            : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground",
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setImportante((v) => !v)}
                  aria-pressed={importante}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    importante
                      ? "bg-warning/15 text-warning ring-2 ring-warning/40"
                      : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground",
                  )}
                >
                  <Star className={cn("size-3.5", importante && "fill-current")} />
                  {importante ? "Marcada como destaque" : "Marcar destaque"}
                </button>

                <Button onClick={adicionar} size="lg" disabled={salvando}>
                  <Send data-icon="inline-start" />
                  {salvando ? "Salvando..." : "Adicionar nota"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {notas.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
                <SelectTrigger size="sm" className="w-44 bg-background">
                  <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {PERIODOS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {noPeriodo.length === notas.length
                  ? `${notas.length} nota(s)`
                  : `${noPeriodo.length} de ${notas.length} nota(s)`}
              </p>
            </div>

            {noPeriodo.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <FiltroChip ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>
                  Todas ({noPeriodo.length})
                </FiltroChip>
                {contagens.destaques > 0 && (
                  <FiltroChip ativo={filtro === "destaques"} onClick={() => setFiltro("destaques")}>
                    <Star className="size-3 fill-current" />
                    Destaques ({contagens.destaques})
                  </FiltroChip>
                )}
                {NOTA_CATEGORIAS.filter((c) => contagens.porCategoria.has(c.value)).map((c) => (
                  <FiltroChip key={c.value} ativo={filtro === c.value} onClick={() => setFiltro(c.value)}>
                    {c.label} ({contagens.porCategoria.get(c.value)})
                  </FiltroChip>
                ))}
              </div>
            )}
          </div>
        )}

        {visiveis.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm font-medium">
              {notas.length === 0
                ? "Nenhuma nota ainda"
                : noPeriodo.length === 0
                  ? "Nenhuma nota neste período"
                  : "Nenhuma nota neste filtro"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notas.length === 0
                ? podeEscrever
                  ? "Comece registrando o contexto deste cliente acima."
                  : "Ninguém registrou acompanhamento para este cliente."
                : noPeriodo.length === 0
                  ? "Amplie o período para ver as notas mais antigas."
                  : "Troque a classificação para ver as outras notas."}
            </p>
          </div>
        ) : (
          <ul className="flex-1 space-y-4">
            {visiveis.map((nota) => {
              const cat = categoriaConfig(nota.categoria);
              return (
                <li key={nota.id} className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">{iniciais(nota.autor)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-lg px-3 py-2",
                      nota.importante ? "bg-warning/10 ring-1 ring-warning/40" : "bg-muted/50",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{nota.autor}</span>
                        <Badge variant="outline" className={cat.className}>
                          {cat.label}
                        </Badge>
                        {nota.importante && (
                          <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Destaque" />
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{nota.data}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{nota.texto}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FiltroChip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        ativo
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
