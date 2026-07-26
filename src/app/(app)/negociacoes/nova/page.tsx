import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getClientes, getProdutos } from "@/lib/queries/cadastros";
import { getEstoqueNormalizado } from "@/lib/queries/estoque";
import { NovaNegociacaoForm } from "./nova-negociacao-form";

export default async function NovaNegociacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [clientes, produtos, { linhas }, { data: usuario }, { data: motivos }] = await Promise.all([
    getClientes(supabase),
    getProdutos(supabase),
    getEstoqueNormalizado(supabase),
    supabase.from("usuarios").select("id, nome_completo").eq("id", user!.id).single(),
    supabase.from("motivos_perda").select("codigo, label"),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          nativeButton={false}
          render={<Link href="/negociacoes" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Negociações
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nova negociação</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os produtos negociados — o sistema acompanha o total e aponta ruptura na hora.
        </p>
      </div>
      <NovaNegociacaoForm
        clientes={clientes}
        produtos={produtos}
        linhasEstoque={linhas}
        vendedor={{ id: usuario!.id, nome: usuario!.nome_completo }}
        motivos={motivos ?? []}
      />
    </div>
  );
}
