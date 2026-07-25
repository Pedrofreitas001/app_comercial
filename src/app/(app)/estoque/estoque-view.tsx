"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { mockEstoque } from "@/lib/mock-data";

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
                <TableHead className="text-center">Disponível</TableHead>
                <TableHead>Vencimento mais próximo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((row) => {
                const status = statusEstoque(row.quantidade);
                return (
                  <TableRow key={row.sku}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                    <TableCell className="max-w-[280px] truncate font-medium">{row.descricao}</TableCell>
                    <TableCell className="text-muted-foreground">{row.categoria}</TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {formatNumber(row.quantidade)} {row.unidade}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.vencimentoProximo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
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
