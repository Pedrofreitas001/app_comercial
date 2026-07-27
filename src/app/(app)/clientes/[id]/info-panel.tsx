"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { atualizarCliente, type ClienteEditavel } from "@/lib/queries/cliente-fup";
import type { ClienteRow } from "@/lib/queries/cadastros";

// Campos livres de propósito: a base vem de planilha e o time precisa poder
// corrigir/preencher o que veio vazio, sem depender de um cadastro auxiliar.
const CAMPOS: { chave: keyof ClienteEditavel; label: string; placeholder?: string; maxLength?: number }[] = [
  { chave: "nomeResumido", label: "Nome resumido", placeholder: "Nome curto usado nas telas" },
  { chave: "nomeFantasia", label: "Nome fantasia" },
  { chave: "rede", label: "Rede" },
  { chave: "canal", label: "Canal", placeholder: "Ex.: Varejo, Distribuidor" },
  { chave: "cidade", label: "Cidade" },
  { chave: "estado", label: "UF", maxLength: 2 },
  { chave: "cnpj", label: "CNPJ" },
  { chave: "vendedorNomeOrigem", label: "Vendedor" },
  { chave: "gerenteNomeOrigem", label: "Gerente" },
  { chave: "tipoFrete", label: "Tipo de frete", placeholder: "Ex.: CIF, FOB" },
  { chave: "tabelaPreco", label: "Tabela de preço" },
];

function paraEditavel(cliente: ClienteRow): ClienteEditavel {
  return {
    nomeResumido: cliente.nomeResumido,
    nomeFantasia: cliente.nomeFantasia,
    rede: cliente.rede,
    canal: cliente.canal,
    cidade: cliente.cidade,
    estado: cliente.estado,
    cnpj: cliente.cnpj,
    vendedorNomeOrigem: cliente.vendedorNomeOrigem,
    gerenteNomeOrigem: cliente.gerenteNomeOrigem,
    tipoFrete: cliente.tipoFrete,
    tabelaPreco: cliente.tabelaPreco,
  };
}

export function InfoPanel({ cliente, podeEditar }: { cliente: ClienteRow; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState<ClienteEditavel>(() => paraEditavel(cliente));
  const [salvando, setSalvando] = useState(false);

  function cancelar() {
    setCampos(paraEditavel(cliente));
    setEditando(false);
  }

  async function salvar() {
    if (!campos.nomeResumido.trim()) {
      toast.error("O nome resumido não pode ficar vazio.");
      return;
    }
    setSalvando(true);
    try {
      const supabase = createClient();
      // Campo em branco volta como null, não como string vazia — assim a tela
      // mostra "—" em vez de um espaço mudo.
      const limpo = Object.fromEntries(
        Object.entries(campos).map(([k, v]) => [k, typeof v === "string" && !v.trim() ? null : v]),
      ) as ClienteEditavel;
      limpo.nomeResumido = campos.nomeResumido.trim();
      await atualizarCliente(supabase, cliente.id, limpo);
      toast.success("Informações atualizadas");
      setEditando(false);
      router.refresh();
    } catch (e) {
      toast.error("Não foi possível salvar", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Informações do cliente</CardTitle>
          <CardDescription>
            {editando
              ? "Preencha o que veio vazio da planilha ou corrija o que está errado."
              : "Dados cadastrais da base."}
          </CardDescription>
        </div>
        {podeEditar &&
          (editando ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" onClick={cancelar} disabled={salvando}>
                <X data-icon="inline-start" />
                Cancelar
              </Button>
              <Button size="sm" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditando(true)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          ))}
      </CardHeader>
      <CardContent className="space-y-3">
        {editando ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código</Label>
              <Input value={cliente.codigo} disabled className="bg-muted font-mono text-xs" />
            </div>
            {CAMPOS.map(({ chave, label, placeholder, maxLength }) => (
              <div key={chave} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  value={campos[chave] ?? ""}
                  onChange={(e) => setCampos((prev) => ({ ...prev, [chave]: e.target.value }))}
                  placeholder={placeholder}
                  maxLength={maxLength}
                />
              </div>
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Código</dt>
              <dd className="font-mono text-sm font-medium">{cliente.codigo}</dd>
            </div>
            {CAMPOS.filter((c) => c.chave !== "nomeResumido").map(({ chave, label }) => (
              <div key={chave}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{campos[chave] || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
        <Separator />
        <p className="text-xs text-muted-foreground">Razão social: {cliente.nome}</p>
      </CardContent>
    </Card>
  );
}
