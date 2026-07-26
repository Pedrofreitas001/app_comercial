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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { ProdutoRow } from "@/lib/queries/cadastros";

const PAGE_SIZE = 15;

const COLUMN_WIDTHS: Record<string, string> = {
  sku: "w-[10%]",
  descricao: "w-[32%]",
  categoria: "w-[16%]",
  linha: "w-[16%]",
  preco: "w-[14%]",
  status: "w-[12%]",
};

function NovoProdutoDialog({ onCriar }: { onCriar: (produto: ProdutoRow) => void }) {
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!sku.trim() || !descricao.trim()) {
      toast.error("Informe pelo menos SKU e descrição.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("produtos")
      .insert({
        sku: sku.trim(),
        sku_entrada: [sku.trim()],
        descricao: descricao.trim(),
        categoria: categoria.trim() || null,
        preco: preco ? Number(preco) : null,
        status: "ativo",
      })
      .select("id, sku, sku_entrada, descricao, categoria, linha, marca, preco, status")
      .single();
    setSalvando(false);

    if (error || !data) {
      toast.error("Não foi possível cadastrar o produto", { description: error?.message });
      return;
    }

    onCriar({
      id: data.id,
      sku: data.sku,
      skuEntrada: data.sku_entrada ?? [],
      descricao: data.descricao,
      categoria: data.categoria,
      linha: data.linha,
      marca: data.marca,
      preco: data.preco,
      status: data.status,
    });
    toast.success(`Produto ${sku} cadastrado`);
    setSku("");
    setDescricao("");
    setCategoria("");
    setPreco("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Novo produto
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>Cadastro manual — o normal é vir da importação do DIM_V1.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex.: D82399" />
          </div>
          <div className="space-y-1.5">
            <Label>Preço de tabela</Label>
            <Input
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Categoria</Label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProdutosTable({ produtosIniciais }: { produtosIniciais: ProdutoRow[] }) {
  const [produtos, setProdutos] = useState<ProdutoRow[]>(produtosIniciais);
  const [busca, setBusca] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  async function atualizarPreco(id: string, valor: string) {
    const preco = valor === "" ? null : Number(valor);
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, preco } : p)));
    const supabase = createClient();
    const { error } = await supabase.from("produtos").update({ preco }).eq("id", id);
    if (error) toast.error("Não foi possível salvar o preço", { description: error.message });
  }

  const columns = useMemo<ColumnDef<ProdutoRow>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
        ),
      },
      {
        accessorKey: "descricao",
        header: "Descrição",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[320px] font-medium">{row.original.descricao}</span>
        ),
      },
      {
        accessorKey: "categoria",
        header: "Categoria",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.categoria ?? "—"}</span>
        ),
      },
      {
        accessorKey: "linha",
        header: "Linha",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.linha ?? "—"}</span>,
      },
      {
        accessorKey: "preco",
        header: "Preço de tabela",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Input
              type="number"
              step="0.01"
              defaultValue={row.original.preco ?? ""}
              onBlur={(e) => atualizarPreco(row.original.id, e.target.value)}
              placeholder="—"
              className="h-8 w-28 text-center"
            />
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: () => (
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-success/10 text-success">
              Ativo
            </Badge>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: produtos,
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
      const p = row.original as ProdutoRow;
      const alvo = `${p.sku} ${p.descricao} ${p.categoria ?? ""} ${p.linha ?? ""}`.toLowerCase();
      return alvo.includes(String(value).toLowerCase());
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por SKU, descrição, categoria..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPageIndex(0);
          }}
          className="sm:max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{produtos.length} produtos no catálogo</p>
          <NovoProdutoDialog
            onCriar={(novo) => {
              setProdutos((prev) => [novo, ...prev]);
              setPageIndex(0);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className={COLUMN_WIDTHS[header.column.id]}>
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
                    Nenhum produto encontrado.
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
