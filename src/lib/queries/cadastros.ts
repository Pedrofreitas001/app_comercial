import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente } from "@/lib/types";

export type ClienteRow = Cliente & { id: string };

const SELECT_CLIENTE =
  "id, codigo_cliente, nome, nome_resumido, nome_fantasia, rede, canal, cidade, estado, cnpj, vendedor_nome_origem, gerente_nome_origem, tipo_frete, tabela_preco, status";

interface ClienteDbRow {
  id: string;
  codigo_cliente: string;
  nome: string;
  nome_resumido: string | null;
  nome_fantasia: string | null;
  rede: string | null;
  canal: string | null;
  cidade: string | null;
  estado: string | null;
  cnpj: string | null;
  vendedor_nome_origem: string | null;
  gerente_nome_origem: string | null;
  tipo_frete: string | null;
  tabela_preco: string | null;
  status: "ativo" | "inativo";
}

export function mapCliente(row: ClienteDbRow): ClienteRow {
  return {
    id: row.id,
    codigo: row.codigo_cliente,
    nome: row.nome,
    nomeResumido: row.nome_resumido ?? row.nome,
    nomeFantasia: row.nome_fantasia,
    rede: row.rede,
    canal: row.canal,
    cidade: row.cidade,
    estado: row.estado,
    cnpj: row.cnpj,
    vendedorNomeOrigem: row.vendedor_nome_origem,
    gerenteNomeOrigem: row.gerente_nome_origem,
    tipoFrete: row.tipo_frete,
    tabelaPreco: row.tabela_preco,
    status: row.status,
  };
}

// O Supabase limita cada resposta a 1000 linhas (max-rows do PostgREST) — um
// select simples devolveria só 1000 dos ~2.7k clientes, silenciosamente. Daí
// a busca em blocos até a página vir incompleta.
const TAMANHO_BLOCO = 1000;

export async function getClientes(supabase: SupabaseClient): Promise<ClienteRow[]> {
  const todos: ClienteRow[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_BLOCO) {
    const { data, error } = await supabase
      .from("clientes")
      .select(SELECT_CLIENTE)
      .order("nome")
      .order("id") // desempate estável: sem isso um bloco pode repetir/pular linha
      .range(inicio, inicio + TAMANHO_BLOCO - 1);
    if (error) throw error;
    const bloco = data ?? [];
    todos.push(...bloco.map(mapCliente));
    if (bloco.length < TAMANHO_BLOCO) break;
  }
  return todos;
}
