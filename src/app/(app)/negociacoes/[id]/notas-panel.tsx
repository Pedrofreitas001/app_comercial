"use client";

import { useState } from "react";
import { NotebookPen, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { NotaTicket } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Painel de notas: fica sempre aberto pra escrever (não é um campo escondido
// atrás de um botão) — a ideia é convidar o vendedor a registrar o contexto
// conforme a negociação evolui, não só uma observação estática no fim.
export function NotasPanel({
  ticketId,
  notas: notasIniciais,
  autor,
  usuarioId,
}: {
  ticketId: string;
  notas: NotaTicket[];
  autor: string;
  usuarioId: string;
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
      .from("notas")
      .insert({ negociacao_id: ticketId, usuario_id: usuarioId, texto: texto.trim() })
      .select("id, texto, created_at")
      .single();
    setSalvando(false);

    if (error || !data) {
      toast.error("Não foi possível salvar a nota", { description: error?.message });
      return;
    }

    const criada = new Date(data.created_at);
    const dataFormatada = `${String(criada.getDate()).padStart(2, "0")}/${String(criada.getMonth() + 1).padStart(2, "0")}/${criada.getFullYear()} ${String(criada.getHours()).padStart(2, "0")}:${String(criada.getMinutes()).padStart(2, "0")}`;
    setNotas((prev) => [...prev, { id: data.id, autor, data: dataFormatada, texto: data.texto }]);
    setTexto("");
    toast.success("Nota adicionada");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="size-4 text-muted-foreground" />
          Notas da negociação
        </CardTitle>
        <CardDescription>
          Registre ligações, decisões do cliente e combinados — é o que o time vê ao abrir este pedido depois.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notas.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center">
            <p className="text-sm font-medium">Nenhuma nota ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Comece registrando o contexto desta negociação abaixo.
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
                  <p className="mt-0.5 text-sm text-foreground/90">{nota.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: cliente confirmou por telefone, aguardando aprovação do financeiro..."
            className="min-h-[72px] flex-1"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={adicionar} size="sm" disabled={salvando}>
            <Send data-icon="inline-start" />
            {salvando ? "Salvando..." : "Adicionar nota"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
