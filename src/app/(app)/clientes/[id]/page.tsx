import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getClienteDetalhe } from "@/lib/queries/cliente-fup";
import { InfoPanel } from "./info-panel";
import { StatusControl } from "./status-control";
import { NotasPanel } from "./notas-panel";
import { ArquivosPanel } from "./arquivos-panel";

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

  // Notas/arquivos: qualquer perfil menos 'leitura'.
  const podeEscrever = usuario?.role !== "leitura";
  // Cadastro do cliente é dado compartilhado — só admin/gerente altera
  // (é o que a policy clientes_update já exige no banco).
  const podeEditarCadastro = usuario?.role === "admin" || usuario?.role === "gerente";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href="/clientes" />}>
          <ArrowLeft data-icon="inline-start" />
          Clientes
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nomeResumido}</h1>
          <StatusControl
            clienteId={cliente.id}
            statusInicial={cliente.status}
            podeEditar={podeEditarCadastro}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {cliente.nome} · {cliente.codigo}
        </p>
      </div>

      <InfoPanel cliente={cliente} podeEditar={podeEditarCadastro} />

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
