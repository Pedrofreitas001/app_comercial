import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { getClienteDetalhe } from "@/lib/queries/cliente-fup";
import { NotasPanel } from "./notas-panel";
import { ArquivosPanel } from "./arquivos-panel";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [cliente, { data: usuario }] = await Promise.all([
    getClienteDetalhe(supabase, id),
    supabase.from("usuarios").select("id, nome_completo, role").eq("id", user!.id).single(),
  ]);
  if (!cliente) notFound();

  const podeEscrever = usuario?.role !== "leitura";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href="/clientes" />}>
          <ArrowLeft data-icon="inline-start" />
          Clientes
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nomeResumido}</h1>
          <Badge
            variant="outline"
            className={
              cliente.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            }
          >
            {cliente.status === "ativo" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {cliente.nome} · {cliente.codigo}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <Campo label="Código">{cliente.codigo}</Campo>
            <Campo label="CNPJ">{cliente.cnpj ?? "—"}</Campo>
            <Campo label="Cidade/UF">
              {cliente.cidade ?? "—"}
              {cliente.estado ? `/${cliente.estado}` : ""}
            </Campo>
            <Campo label="Canal">{cliente.canal ?? "—"}</Campo>
            <Campo label="Rede">{cliente.rede ?? "—"}</Campo>
            <Campo label="Nome fantasia">{cliente.nomeFantasia ?? "—"}</Campo>
            <Campo label="Vendedor">{cliente.vendedorNomeOrigem ?? "—"}</Campo>
            <Campo label="Gerente">{cliente.gerenteNomeOrigem ?? "—"}</Campo>
            <Campo label="Tipo de frete">{cliente.tipoFrete ?? "—"}</Campo>
            <Campo label="Tabela de preço">{cliente.tabelaPreco ?? "—"}</Campo>
          </dl>
          <Separator />
          <p className="text-xs text-muted-foreground">Razão social: {cliente.nome}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <NotasPanel
          clienteId={cliente.id}
          notas={cliente.notas}
          autor={usuario!.nome_completo}
          usuarioId={usuario!.id}
          podeEscrever={podeEscrever}
        />
        <ArquivosPanel
          clienteId={cliente.id}
          arquivos={cliente.arquivos}
          autor={usuario!.nome_completo}
          usuarioId={usuario!.id}
          podeEscrever={podeEscrever}
        />
      </div>
    </div>
  );
}
