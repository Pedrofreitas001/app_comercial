"use client";

import { useState } from "react";
import { NotebookPen, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { NotaTicket } from "@/lib/mock-data";

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
export function NotasPanel({ notas: notasIniciais, autor }: { notas: NotaTicket[]; autor: string }) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");

  function adicionar() {
    if (!texto.trim()) {
      toast.error("Escreva algo antes de salvar a nota.");
      return;
    }
    const agora = new Date();
    const data = `${String(agora.getDate()).padStart(2, "0")}/${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()} ${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    setNotas((prev) => [...prev, { id: Math.random().toString(36).slice(2), autor, data, texto: texto.trim() }]);
    setTexto("");
    toast.success("Nota adicionada", {
      description: "Exemplo — será gravada no banco quando o Supabase estiver conectado.",
    });
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
          <Button onClick={adicionar} size="sm">
            <Send data-icon="inline-start" />
            Adicionar nota
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
