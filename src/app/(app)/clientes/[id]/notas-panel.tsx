"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Send, Star } from "lucide-react";
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

  const contagens = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const n of notas) mapa.set(n.categoria, (mapa.get(n.categoria) ?? 0) + 1);
    return { porCategoria: mapa, destaques: notas.filter((n) => n.importante).length };
  }, [notas]);

  const visiveis = useMemo(() => {
    if (filtro === "todas") return notas;
    if (filtro === "destaques") return notas.filter((n) => n.importante);
    return notas.filter((n) => n.categoria === filtro);
  }, [notas, filtro]);

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
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: cliente confirmou por telefone, aguardando aprovação do financeiro..."
              className="min-h-[120px] bg-background"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoria} onValueChange={(v) => setCategoria(v as NotaCategoria)}>
                <SelectTrigger className="h-9 w-full bg-background sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTA_CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.descricao}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* size="lg" = h-9, mesma altura do seletor de categoria */}
              <Button
                type="button"
                size="lg"
                variant={importante ? "default" : "outline"}
                onClick={() => setImportante((v) => !v)}
                title="Destaques ficam marcados e podem ser filtrados"
              >
                <Star data-icon="inline-start" className={importante ? "fill-current" : undefined} />
                {importante ? "Destaque" : "Marcar destaque"}
              </Button>

              <Button onClick={adicionar} size="lg" disabled={salvando} className="ml-auto">
                <Send data-icon="inline-start" />
                {salvando ? "Salvando..." : "Adicionar nota"}
              </Button>
            </div>
          </div>
        )}

        {notas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <FiltroChip ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>
              Todas ({notas.length})
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

        {visiveis.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm font-medium">
              {notas.length === 0 ? "Nenhuma nota ainda" : "Nenhuma nota neste filtro"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notas.length > 0
                ? "Troque o filtro para ver as outras notas."
                : podeEscrever
                  ? "Comece registrando o contexto deste cliente acima."
                  : "Ninguém registrou acompanhamento para este cliente."}
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
