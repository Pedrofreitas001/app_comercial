"use client";

import { useState } from "react";
import { CalendarClock, CircleCheck, Gift, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BonifStatusBadge } from "@/components/bonif-status-badge";
import { formatBRLPreco, formatNumber } from "@/lib/format";
import { bonifStatus, type MockBonificacao } from "@/lib/mock-data";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

// Controle da bonificação acordada sobre o TOTAL do pedido: peças, faturamento,
// data combinada e status de pagamento gerenciável. Estado local por enquanto -
// será gravado no banco quando o Supabase estiver conectado.
export function BonificacaoControl({ bonificacao }: { bonificacao: MockBonificacao | null }) {
  const [paga, setPaga] = useState(bonificacao?.paga ?? false);
  const [obs, setObs] = useState(bonificacao?.observacoes ?? "");

  if (!bonificacao) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bonificação do pedido</CardTitle>
          <CardDescription>Acordo de bonificação sobre o total do pedido.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma bonificação acordada neste pedido.
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = bonifStatus({ ...bonificacao, paga });

  function togglePagamento() {
    const nova = !paga;
    setPaga(nova);
    toast.success(nova ? "Bonificação marcada como paga" : "Pagamento da bonificação reaberto", {
      description: "Exemplo — será gravado no banco quando o Supabase estiver conectado.",
    });
  }

  function salvarObs() {
    toast.success("Anotação salva", {
      description: "Exemplo — será gravada no banco quando o Supabase estiver conectado.",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-muted-foreground" />
            Bonificação do pedido
          </CardTitle>
          <CardDescription>
            Acordo sobre o total do pedido — peças, faturamento e pagamento.
          </CardDescription>
        </div>
        {status && <BonifStatusBadge status={status} />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Campo label="Peças acordadas">{formatNumber(bonificacao.pecas)} un.</Campo>
          <Campo label="Faturamento acordado">{formatBRLPreco(bonificacao.valor)}</Campo>
          <Campo label="Data a pagar">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              {bonificacao.dataPagamento ?? "—"}
            </span>
          </Campo>
          <Campo label="Pagamento">
            <Button
              size="sm"
              variant={paga ? "outline" : "default"}
              onClick={togglePagamento}
            >
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
            <Button variant="secondary" onClick={salvarObs}>
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
