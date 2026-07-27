"use client";

import { useState } from "react";
import { NotebookPen, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { NotaCliente } from "@/lib/queries/cliente-fup";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Timeline de acompanhamento (FUP) do cliente. Campo de escrita sempre
// visível — a ideia é convidar o vendedor a registrar o contexto conforme a
// conversa evolui, não esconder atrás de um botão.
export function NotasPanel({
  clienteId,
  notas: notasIniciais,
  autor,
  usuarioId,
  podeEscrever,
}: {
  clienteId: string;
  notas: NotaCliente[];
  autor: string;
  usuarioId: string;
  podeEscrever: boolean;
}) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    if (!texto.trim()) {
      toast.error("Escreva algo antes de salvar a nota.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cliente_notas")
      .insert({ cliente_id: clienteId, usuario_id: usuarioId, texto: texto.trim() })
      .select("id, texto, created_at")
      .single();
    setSalvando(false);

    if (error || !data) {
      toast.error("Não foi possível salvar a nota", { description: error?.message });
      return;
    }

    const criada = new Date(data.created_at);
    const p = (n: number) => String(n).padStart(2, "0");
    const dataFormatada = `${p(criada.getDate())}/${p(criada.getMonth() + 1)}/${criada.getFullYear()} ${p(criada.getHours())}:${p(criada.getMinutes())}`;
    // Mais recente no topo, igual à ordenação vinda do banco.
    setNotas((prev) => [{ id: data.id, autor, data: dataFormatada, texto: data.texto }, ...prev]);
    setTexto("");
    toast.success("Nota adicionada");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="size-4 text-muted-foreground" />
          Acompanhamento da negociação
        </CardTitle>
        <CardDescription>
          Registre ligações, decisões do cliente e combinados — é o que o time vê ao abrir este cliente depois.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {podeEscrever && (
          <div className="space-y-2">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: cliente confirmou por telefone, aguardando aprovação do financeiro..."
              className="min-h-[72px]"
            />
            <div className="flex justify-end">
              <Button onClick={adicionar} size="sm" disabled={salvando}>
                <Send data-icon="inline-start" />
                {salvando ? "Salvando..." : "Adicionar nota"}
              </Button>
            </div>
          </div>
        )}

        {notas.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center">
            <p className="text-sm font-medium">Nenhuma nota ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {podeEscrever
                ? "Comece registrando o contexto deste cliente acima."
                : "Ninguém registrou acompanhamento para este cliente."}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notas.map((nota) => (
              <li key={nota.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">{iniciais(nota.autor)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{nota.autor}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{nota.data}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">{nota.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
