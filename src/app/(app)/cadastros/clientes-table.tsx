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
import type { ClienteRow } from "@/lib/queries/cadastros";

const PAGE_SIZE = 15;

const COLUMN_WIDTHS: Record<string, string> = {
  codigo: "w-[12%]",
  nomeResumido: "w-[30%]",
  redeCanal: "w-[26%]",
  local: "w-[18%]",
  status: "w-[14%]",
};

function NovoClienteDialog({ onCriar }: { onCriar: (cliente: ClienteRow) => void }) {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [nomeResumido, setNomeResumido] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!codigo.trim() || !nome.trim()) {
      toast.error("Informe pelo menos código e razão social.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        codigo_cliente: codigo.trim(),
        nome: nome.trim(),
        nome_resumido: nomeResumido.trim() || nome.trim(),
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        status: "ativo",
      })
      .select("id, codigo_cliente, nome, nome_resumido, nome_fantasia, rede, canal, cidade, estado, cnpj, vendedor_nome_origem, gerente_nome_origem, tipo_frete, tabela_preco, status")
      .single();
    setSalvando(false);

    if (error || !data) {
      toast.error("Não foi possível cadastrar o cliente", { description: error?.message });
      return;
    }

    onCriar({
      id: data.id,
      codigo: data.codigo_cliente,
      nome: data.nome,
      nomeResumido: data.nome_resumido ?? data.nome,
      nomeFantasia: data.nome_fantasia,
      rede: data.rede,
      canal: data.canal,
      cidade: data.cidade,
      estado: data.estado,
      cnpj: data.cnpj,
      vendedorNomeOrigem: data.vendedor_nome_origem,
      gerenteNomeOrigem: data.gerente_nome_origem,
      tipoFrete: data.tipo_frete,
      tabelaPreco: data.tabela_preco,
      status: data.status,
    });
    toast.success(`Cliente ${codigo} cadastrado`);
    setCodigo("");
    setNome("");
    setNomeResumido("");
    setCidade("");
    setEstado("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Novo cliente
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Cadastro manual — o normal é vir da importação da base de clientes.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: C00001234" />
          </div>
          <div className="space-y-1.5">
            <Label>Nome resumido</Label>
            <Input
              value={nomeResumido}
              onChange={(e) => setNomeResumido(e.target.value)}
              placeholder="Preenche a partir da razão social se vazio"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Razão social</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>UF</Label>
            <Input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
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

export function ClientesTable({ clientesIniciais }: { clientesIniciais: ClienteRow[] }) {
  const [clientes, setClientes] = useState<ClienteRow[]>(clientesIniciais);
  const [busca, setBusca] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  async function atualizarNomeResumido(id: string, valor: string) {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, nomeResumido: valor } : c)));
    const supabase = createClient();
    const { error } = await supabase.from("clientes").update({ nome_resumido: valor }).eq("id", id);
    if (error) toast.error("Não foi possível salvar o nome resumido", { description: error.message });
  }

  const columns = useMemo<ColumnDef<ClienteRow>[]>(
    () => [
      {
        accessorKey: "codigo",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.codigo}</span>
        ),
      },
      {
        accessorKey: "nomeResumido",
        header: "Nome",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <Input
              defaultValue={row.original.nomeResumido}
              onBlur={(e) => atualizarNomeResumido(row.original.id, e.target.value)}
              className="h-8 w-full min-w-0 font-medium"
            />
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={
                row.original.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }
            >
              {row.original.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: clientes,
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
      const c = row.original as ClienteRow;
      const alvo = `${c.codigo} ${c.nome} ${c.nomeResumido} ${c.rede ?? ""} ${c.cidade ?? ""}`.toLowerCase();
      return alvo.includes(String(value).toLowerCase());
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por código, nome, rede, cidade..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPageIndex(0);
          }}
          className="sm:max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
          <NovoClienteDialog
            onCriar={(novo) => {
              setClientes((prev) => [novo, ...prev]);
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
