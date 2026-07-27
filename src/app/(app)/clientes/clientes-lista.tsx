"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { NotebookPen, Paperclip, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClienteRow } from "@/lib/queries/cadastros";
import type { ResumoFup } from "@/lib/queries/cliente-fup";

const PAGE_SIZE = 15;

const COLUMN_WIDTHS: Record<string, string> = {
  codigo: "w-[12%]",
  nome: "w-[34%]",
  redeCanal: "w-[20%]",
  local: "w-[14%]",
  fup: "w-[20%]",
};

const FILTRO_OPTIONS = [
  { value: "todos", label: "Todos os clientes" },
  { value: "com", label: "Com acompanhamento" },
  { value: "sem", label: "Sem acompanhamento" },
];

export interface LinhaCliente extends ClienteRow {
  fup: ResumoFup;
}

export function ClientesLista({ clientes }: { clientes: LinhaCliente[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pageIndex, setPageIndex] = useState(0);

  const dados = useMemo(() => {
    if (filtro === "todos") return clientes;
    const temFup = (c: LinhaCliente) => c.fup.notas > 0 || c.fup.arquivos > 0;
    return clientes.filter((c) => (filtro === "com" ? temFup(c) : !temFup(c)));
  }, [clientes, filtro]);

  const columns = useMemo<ColumnDef<LinhaCliente>[]>(
    () => [
      {
        id: "codigo",
        header: "Código",
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.codigo}</span>,
      },
      {
        id: "nome",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/clientes/${row.original.id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {row.original.nomeResumido}
            </Link>
            <p className="truncate text-xs text-muted-foreground" title={row.original.nome}>
              {row.original.nome}
            </p>
          </div>
        ),
      },
      {
        id: "redeCanal",
        header: "Rede / Canal",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-muted-foreground">
            <p className="truncate">{row.original.rede ?? "—"}</p>
            <p className="truncate text-xs">{row.original.canal ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "local",
        header: "Cidade/UF",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.cidade ?? "—"}
            {row.original.estado ? `/${row.original.estado}` : ""}
          </span>
        ),
      },
      {
        id: "fup",
        header: "Acompanhamento",
        cell: ({ row }) => {
          const { notas, arquivos, destaques, ultimaNota } = row.original.fup;
          if (notas === 0 && arquivos === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {notas > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <NotebookPen className="size-3" />
                    {notas}
                  </Badge>
                )}
                {destaques > 0 && (
                  <Badge variant="outline" className="gap-1 bg-warning/10 text-warning">
                    <Star className="size-3 fill-current" />
                    {destaques}
                  </Badge>
                )}
                {arquivos > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Paperclip className="size-3" />
                    {arquivos}
                  </Badge>
                )}
              </div>
              {ultimaNota && <p className="text-xs text-muted-foreground">última em {ultimaNota}</p>}
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: dados,
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
      const c = row.original as LinhaCliente;
      const alvo = `${c.codigo} ${c.nome} ${c.nomeResumido} ${c.rede ?? ""} ${c.cidade ?? ""}`.toLowerCase();
      return alvo.includes(String(value).toLowerCase());
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por código, nome, rede, cidade..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPageIndex(0);
          }}
          className="sm:max-w-sm"
        />
        <Select
          value={filtro}
          onValueChange={(v) => {
            setFiltro(v ?? "todos");
            setPageIndex(0);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTRO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {table.getFilteredRowModel().rows.length} de {clientes.length} clientes
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className={COLUMN_WIDTHS[header.id]}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
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
