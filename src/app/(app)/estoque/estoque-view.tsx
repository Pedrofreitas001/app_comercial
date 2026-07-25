"use client";

import { useMemo, useState } from "react";
import { Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { estoqueNormalizadoDe, mockEstoque } from "@/lib/mock-data";

function statusEstoque(quantidade: number) {
  if (quantidade === 0) return { label: "Zerado", className: "bg-destructive/10 text-destructive" };
  if (quantidade <= 30) return { label: "Baixo", className: "bg-warning/10 text-warning" };
  return { label: "Disponível", className: "bg-success/10 text-success" };
}

export function EstoqueView() {
  const [busca, setBusca] = useState("");

  const linhas = useMemo(() => {
    if (!busca) return mockEstoque;
    const termo = busca.toLowerCase();
    return mockEstoque.filter(
      (row) => row.sku.toLowerCase().includes(termo) || row.descricao.toLowerCase().includes(termo),
    );
  }, [busca]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por SKU ou produto..."
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        className="sm:max-w-xs"
      />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Bruto (STRALOG)</TableHead>
                <TableHead className="text-center">Normalizado</TableHead>
                <TableHead>Vencimento mais próximo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((row) => {
                const norm = estoqueNormalizadoDe(row.sku);
                const status = statusEstoque(norm.normalizado);
                return (
                  <TableRow key={row.sku}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                    <TableCell className="max-w-[240px] truncate font-medium">{row.descricao}</TableCell>
                    <TableCell className="text-muted-foreground">{row.categoria}</TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {formatNumber(norm.bruto)} {row.unidade}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {formatNumber(norm.normalizado)} {row.unidade}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.vencimentoProximo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                        {norm.emRuptura ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Badge variant="outline" className="cursor-help bg-destructive/10 text-destructive" />
                              }
                            >
                              <TriangleAlert data-icon="inline-start" />
                              Ruptura · déficit {formatNumber(norm.deficit)} un.
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-64">
                              Já provisionamos {formatNumber(norm.pendente)} un. vendidas, {formatNumber(norm.deficit)}{" "}
                              un. além do que o STRALOG reporta disponível. Não é possível provisionar mais
                              baixa que isso — só se resolve com um novo import mostrando reposição.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          norm.aguardandoBaixa && (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Badge variant="outline" className="cursor-help bg-warning/10 text-warning" />
                                }
                              >
                                <Clock data-icon="inline-start" />
                                Aguardando baixa · {formatNumber(norm.pendente)} un.
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-64">
                                {formatNumber(norm.pendente)} un. já negociadas desde a última importação do
                                STRALOG ainda não foram abatidas pelo operador logístico. O estoque
                                normalizado já considera essa baixa pendente.
                              </TooltipContent>
                            </Tooltip>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum SKU encontrado para “{busca}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
