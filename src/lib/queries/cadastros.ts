import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, Produto } from "@/lib/mock-data";

export type ClienteRow = Cliente & { id: string };
export type ProdutoRow = Produto & { id: string };

function mapCliente(row: {
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
}): ClienteRow {
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

export async function getClientes(supabase: SupabaseClient): Promise<ClienteRow[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, codigo_cliente, nome, nome_resumido, nome_fantasia, rede, canal, cidade, estado, cnpj, vendedor_nome_origem, gerente_nome_origem, tipo_frete, tabela_preco, status",
    )
    .order("nome");
  if (error) throw error;
  return (data ?? []).map(mapCliente);
}

export async function criarCliente(
  supabase: SupabaseClient,
  input: { codigo: string; nome: string; nomeResumido: string; cidade: string | null; estado: string | null },
) {
  const { error } = await supabase.from("clientes").insert({
    codigo_cliente: input.codigo,
    nome: input.nome,
    nome_resumido: input.nomeResumido,
    cidade: input.cidade,
    estado: input.estado,
    status: "ativo",
  });
  if (error) throw error;
}

export async function atualizarNomeResumido(supabase: SupabaseClient, id: string, nomeResumido: string) {
  const { error } = await supabase.from("clientes").update({ nome_resumido: nomeResumido }).eq("id", id);
  if (error) throw error;
}

function mapProduto(row: {
  id: string;
  sku: string;
  sku_entrada: string[] | null;
  descricao: string;
  categoria: string | null;
  linha: string | null;
  marca: string | null;
  preco: number | null;
  status: "ativo" | "inativo";
}): ProdutoRow {
  return {
    id: row.id,
    sku: row.sku,
    skuEntrada: row.sku_entrada ?? [],
    descricao: row.descricao,
    categoria: row.categoria,
    linha: row.linha,
    marca: row.marca,
    preco: row.preco,
    status: row.status,
  };
}

export async function getProdutos(supabase: SupabaseClient): Promise<ProdutoRow[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, sku, sku_entrada, descricao, categoria, linha, marca, preco, status")
    .order("descricao");
  if (error) throw error;
  return (data ?? []).map(mapProduto);
}
