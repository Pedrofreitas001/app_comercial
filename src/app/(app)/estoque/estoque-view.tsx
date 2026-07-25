"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowRight, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { estoqueNormalizadoDe, mockEstoque, type MockEstoqueRow } from "@/lib/mock-data";

const PAGE_SIZE = 15;

function statusEstoque(quantidade: number) {
  if (quantidade === 0) return { label: "Zerado", className: "bg-destructive/10 text-destructive" };
  if (quantidade <= 30) return { label: "Baixo", className: "bg-warning/10 text-warning" };
  return { label: "Disponível", className: "bg-success/10 text-success" };
}

interface Linha {
  row: MockEstoqueRow;
  norm: ReturnType<typeof estoqueNormalizadoDe>;
}

const SITUACAO_OPTIONS = [
  { value: "todas", label: "Todas as situações" },
  { value: "ruptura", label: "Em ruptura" },
  { value: "aguardando", label: "Aguardando baixa" },
  { value: "zerado", label: "Zerado" },
  { value: "baixo", label: "Baixo" },
  { value: "disponivel", label: "Disponível" },
];

export function EstoqueView() {
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("todas");
  const [pageIndex, setPageIndex] = useState(0);

  const dados = useMemo<Linha[]>(() => {
    const linhas = mockEstoque.map((row) => ({ row, norm: estoqueNormalizadoDe(row.sku) }));
    // alertas (ruptura, depois aguardando baixa) sempre no topo, pra nao
    // precisar procurar entre centenas de SKUs disponiveis.
    return linhas.sort((a, b) => {
      const peso = (l: Linha) => (l.norm.emRuptura ? 2 : l.norm.aguardandoBaixa ? 1 : 0);
      return peso(b) - peso(a) || a.row.sku.localeCompare(b.row.sku);
    });
  }, []);

  function bucketDe(norm: Linha["norm"]) {
    if (norm.emRuptura) return "ruptura";
    if (norm.aguardandoBaixa) return "aguardando";
    if (norm.normalizado === 0) return "zerado";
    if (norm.normalizado <= 30) return "baixo";
    return "disponivel";
  }

  const dadosFiltrados = useMemo(() => {
    if (situacao === "todas") return dados;
    return dados.filter((l) => bucketDe(l.norm) === situacao);
  }, [dados, situacao]);

  const columns = useMemo<ColumnDef<Linha>[]>(
    () => [
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.row.sku}</span>
        ),
      },
      {
        id: "produto",
        header: "Produto",
        cell: ({ row }) => (
          <div className="min-w-0 max-w-[260px] space-y-0.5">
            <p className="truncate font-medium" title={row.original.row.descricao}>
              {row.original.row.descricao}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.original.row.categoria ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "estoque",
        header: "STRALOG → Provisionado",
        cell: ({ row }) => {
          const { norm } = row.original;
          return (
            <div className="flex items-center justify-center gap-1.5 tabular-nums">
              <span className="text-muted-foreground">{formatNumber(norm.bruto)}</span>
              <ArrowRight className="size-3 text-muted-foreground/60" />
              <span
                className={
                  norm.emRuptura ? "font-medium text-destructive" : norm.aguardandoBaixa ? "font-medium text-warning" : "font-medium"
                }
              >
                {formatNumber(norm.normalizado)}
              </span>
            </div>
          );
        },
      },
      {
        id: "vencimento",
        header: "Vencimento",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.row.vencimentoProximo ?? "—"}</span>
        ),
      },
      {
        id: "situacao",
        header: "Situação",
        cell: ({ row }) => {
          const { norm } = row.original;
          const status = statusEstoque(norm.normalizado);
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              {norm.emRuptura ? (
                <Tooltip>
                  <TooltipTrigger
                    render={<Badge variant="outline" className="cursor-help bg-destructive/10 text-destructive" />}
                  >
                    <TriangleAlert data-icon="inline-start" />
                    Ruptura · déficit {formatNumber(norm.deficit)} un.
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-64">
                    Já provisionamos {formatNumber(norm.pendente)} un. vendidas, {formatNumber(norm.deficit)} un.
                    além do que o STRALOG reporta disponível. Só se resolve com um novo import mostrando
                    reposição.
                  </TooltipContent>
                </Tooltip>
              ) : (
                norm.aguardandoBaixa && (
                  <Tooltip>
                    <TooltipTrigger
                      render={<Badge variant="outline" className="cursor-help bg-warning/10 text-warning" />}
                    >
                      <Clock data-icon="inline-start" />
                      Aguardando baixa · {formatNumber(norm.pendente)} un.
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-64">
                      {formatNumber(norm.pendente)} un. já negociadas desde a última importação do STRALOG
                      ainda não foram abatidas pelo operador logístico.
                    </TooltipContent>
                  </Tooltip>
                )
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: dadosFiltrados,
    columns,
    state: { globalFilter: busca, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    onGlobalFilterChange: setBusca,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      if (!value) return true;
      const { row: r } = row.original as Linha;
      const alvo = `${r.sku} ${r.descricao}`.toLowerCase();
      return alvo.includes(String(value).toLowerCase());
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por SKU ou produto..."
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value);
            setPageIndex(0);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={situacao}
          onValueChange={(v) => {
            setSituacao(v ?? "todas");
            setPageIndex(0);
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITUACAO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {table.getFilteredRowModel().rows.length} de {dados.length} SKUs
          {situacao !== "todas" && ` (filtro: ${SITUACAO_OPTIONS.find((o) => o.value === situacao)?.label})`}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className={header.id === "estoque" ? "text-center" : undefined}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum SKU encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
