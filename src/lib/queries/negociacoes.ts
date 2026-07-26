import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ArquivoTicket,
  MockBonificacao,
  MockItemNegociacao,
  MockTicket,
  NotaTicket,
  TicketStatus,
} from "@/lib/mock-data";

const SELECT_TICKET = `
  id, codigo, data, status, nf_numero, observacoes,
  cliente:clientes ( nome, codigo_cliente, cidade, estado, canal ),
  vendedor:usuarios!vendedor_id ( nome_completo ),
  itens:itens_negociacao (
    id, qtd_negociada_v1, qtd_final, estoque_disponivel, preco_negociado, preco_tabela, motivo_codigo,
    produto:produtos ( sku, descricao, categoria ),
    motivo:motivos_perda ( label )
  ),
  bonificacao:bonificacoes (
    id, data_pagamento, paga, observacoes,
    itens:bonificacao_itens ( qtd, preco_base, produto:produtos ( sku, descricao ) )
  ),
  notas (
    id, texto, created_at,
    autor:usuarios ( nome_completo )
  ),
  arquivos (
    id, nome, tipo, tamanho_bytes, data,
    autor:usuarios ( nome_completo )
  )
`;

interface TicketRow {
  id: string;
  codigo: string;
  data: string;
  status: TicketStatus;
  nf_numero: string | null;
  observacoes: string | null;
  cliente: { nome: string; codigo_cliente: string; cidade: string | null; estado: string | null; canal: string | null } | null;
  vendedor: { nome_completo: string } | null;
  itens: {
    id: string;
    qtd_negociada_v1: number;
    qtd_final: number;
    estoque_disponivel: number;
    preco_negociado: number;
    preco_tabela: number | null;
    motivo_codigo: string | null;
    produto: { sku: string; descricao: string; categoria: string | null } | null;
    motivo: { label: string } | null;
  }[];
  bonificacao: {
    id: string;
    data_pagamento: string | null;
    paga: boolean;
    observacoes: string | null;
    itens: { qtd: number; preco_base: number; produto: { sku: string; descricao: string } | null }[];
  } | null;
  notas: { id: string; texto: string; created_at: string; autor: { nome_completo: string } | null }[];
  arquivos: {
    id: string;
    nome: string;
    tipo: string;
    tamanho_bytes: number | null;
    data: string;
    autor: { nome_completo: string } | null;
  }[];
}

function paraBrData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function paraBrDataHora(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapItem(item: TicketRow["itens"][number]): MockItemNegociacao {
  return {
    id: item.id,
    sku: item.produto?.sku ?? "",
    descricao: item.produto?.descricao ?? "",
    categoria: item.produto?.categoria ?? null,
    precoTabela: item.preco_tabela ?? 0,
    precoNegociado: item.preco_negociado,
    qtdV1: item.qtd_negociada_v1,
    qtdFinal: item.qtd_final,
    estoqueDisponivel: item.estoque_disponivel,
    motivo: item.motivo?.label ?? null,
  };
}

function mapBonificacao(b: TicketRow["bonificacao"]): MockBonificacao | null {
  if (!b) return null;
  return {
    itens: b.itens.map((i) => ({
      sku: i.produto?.sku ?? "",
      descricao: i.produto?.descricao,
      qtd: i.qtd,
      precoBase: i.preco_base,
    })),
    dataPagamento: b.data_pagamento ? paraBrData(b.data_pagamento) : null,
    paga: b.paga,
    observacoes: b.observacoes,
  };
}

function mapNota(n: TicketRow["notas"][number]): NotaTicket {
  return {
    id: n.id,
    autor: n.autor?.nome_completo ?? "—",
    data: paraBrDataHora(n.created_at),
    texto: n.texto,
  };
}

function mapArquivo(a: TicketRow["arquivos"][number]): ArquivoTicket {
  return {
    id: a.id,
    nome: a.nome,
    tipo: a.tipo,
    tamanho: formatarTamanho(a.tamanho_bytes),
    autor: a.autor?.nome_completo ?? "—",
    data: paraBrData(a.data),
  };
}

export function mapTicket(row: TicketRow): MockTicket {
  return {
    id: row.id,
    codigo: row.codigo,
    cliente: row.cliente?.nome ?? "—",
    clienteCodigo: row.cliente?.codigo_cliente ?? "",
    cidadeUf: row.cliente?.cidade && row.cliente?.estado ? `${row.cliente.cidade}/${row.cliente.estado}` : "—",
    canal: row.cliente?.canal ?? "—",
    vendedor: row.vendedor?.nome_completo ?? "—",
    data: paraBrData(row.data),
    status: row.status,
    nf: row.nf_numero,
    observacoes: row.observacoes,
    notas: row.notas.map(mapNota).sort((a, b) => a.data.localeCompare(b.data)),
    arquivos: row.arquivos.map(mapArquivo),
    bonificacao: mapBonificacao(row.bonificacao),
    itens: row.itens.map(mapItem),
  };
}

export async function getNegociacoes(supabase: SupabaseClient): Promise<MockTicket[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select(SELECT_TICKET)
    .order("data", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as TicketRow[]).map(mapTicket);
}

export async function getNegociacaoById(supabase: SupabaseClient, id: string): Promise<MockTicket | null> {
  const { data, error } = await supabase.from("negociacoes").select(SELECT_TICKET).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapTicket(data as unknown as TicketRow);
}

export async function atualizarStatus(supabase: SupabaseClient, id: string, status: TicketStatus) {
  const { error } = await supabase.from("negociacoes").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function atualizarNf(supabase: SupabaseClient, id: string, nf: string) {
  const { error } = await supabase.from("negociacoes").update({ nf_numero: nf }).eq("id", id);
  if (error) throw error;
}

export async function adicionarNota(supabase: SupabaseClient, negociacaoId: string, usuarioId: string, texto: string) {
  const { error } = await supabase.from("notas").insert({ negociacao_id: negociacaoId, usuario_id: usuarioId, texto });
  if (error) throw error;
}

export interface NovoItemInput {
  produtoId: string;
  qtdV1: number;
  qtdFinal: number;
  precoNegociado: number;
  precoTabela: number | null;
  estoqueDisponivel: number;
  motivoCodigo: string | null;
}

export interface NovaBonificacaoInput {
  dataPagamento: string | null;
  observacoes: string | null;
  itens: { produtoId: string; qtd: number; precoBase: number }[];
}

export async function criarNegociacao(
  supabase: SupabaseClient,
  input: {
    clienteId: string;
    vendedorId: string;
    observacoes: string | null;
    itens: NovoItemInput[];
    bonificacao: NovaBonificacaoInput | null;
  },
): Promise<{ id: string; codigo: string }> {
  const { data: negociacao, error: erroNegociacao } = await supabase
    .from("negociacoes")
    .insert({
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
      created_by: input.vendedorId,
      observacoes: input.observacoes,
      status: "rascunho",
    })
    .select("id, codigo")
    .single();
  if (erroNegociacao || !negociacao) throw erroNegociacao ?? new Error("Falha ao criar negociação.");

  const { error: erroItens } = await supabase.from("itens_negociacao").insert(
    input.itens.map((item) => ({
      negociacao_id: negociacao.id,
      produto_id: item.produtoId,
      qtd_negociada_v1: item.qtdV1,
      qtd_final: item.qtdFinal,
      preco_negociado: item.precoNegociado,
      preco_tabela: item.precoTabela,
      estoque_disponivel: item.estoqueDisponivel,
      motivo_codigo: item.motivoCodigo,
    })),
  );
  if (erroItens) throw erroItens;

  if (input.bonificacao && input.bonificacao.itens.length > 0) {
    const { data: bonificacao, error: erroBoni } = await supabase
      .from("bonificacoes")
      .insert({
        negociacao_id: negociacao.id,
        data_pagamento: input.bonificacao.dataPagamento,
        observacoes: input.bonificacao.observacoes,
      })
      .select("id")
      .single();
    if (erroBoni || !bonificacao) throw erroBoni ?? new Error("Falha ao criar bonificação.");

    const { error: erroBoniItens } = await supabase.from("bonificacao_itens").insert(
      input.bonificacao.itens.map((item) => ({
        bonificacao_id: bonificacao.id,
        produto_id: item.produtoId,
        qtd: item.qtd,
        preco_base: item.precoBase,
      })),
    );
    if (erroBoniItens) throw erroBoniItens;
  }

  return negociacao;
}

// Substitui a bonificação inteira do pedido (upsert do cabeçalho + troca
// completa dos itens) — mais simples e seguro que tentar diff incremental,
// já que a tela sempre edita a lista toda de uma vez.
export async function salvarBonificacao(
  supabase: SupabaseClient,
  negociacaoId: string,
  input: NovaBonificacaoInput,
): Promise<string> {
  const { data: bonificacao, error: erroUpsert } = await supabase
    .from("bonificacoes")
    .upsert(
      { negociacao_id: negociacaoId, data_pagamento: input.dataPagamento, observacoes: input.observacoes },
      { onConflict: "negociacao_id" },
    )
    .select("id")
    .single();
  if (erroUpsert || !bonificacao) throw erroUpsert ?? new Error("Falha ao salvar bonificação.");

  const { error: erroDelete } = await supabase.from("bonificacao_itens").delete().eq("bonificacao_id", bonificacao.id);
  if (erroDelete) throw erroDelete;

  if (input.itens.length > 0) {
    const { error: erroInsert } = await supabase.from("bonificacao_itens").insert(
      input.itens.map((item) => ({
        bonificacao_id: bonificacao.id,
        produto_id: item.produtoId,
        qtd: item.qtd,
        preco_base: item.precoBase,
      })),
    );
    if (erroInsert) throw erroInsert;
  }

  return bonificacao.id;
}

export async function marcarBonificacaoPaga(supabase: SupabaseClient, negociacaoId: string, paga: boolean) {
  const { error } = await supabase.from("bonificacoes").update({ paga }).eq("negociacao_id", negociacaoId);
  if (error) throw error;
}

// =========================================================================
// Edição dos itens de um pedido já criado (corrigir preço, quantidade,
// motivo; incluir ou remover item).
// =========================================================================

export interface ItemEditavel {
  id?: string; // sem id = item novo, a inserir
  produtoId: string;
  qtdV1: number;
  qtdFinal: number;
  precoNegociado: number;
  precoTabela: number | null;
  estoqueDisponivel: number;
  motivoCodigo: string | null;
}

// Aplica as alterações da tela de itens: atualiza os existentes, insere os
// novos e remove os que saíram. Faz o delete por último para que, se algo
// falhar antes, o pedido não fique sem itens.
export async function salvarItens(
  supabase: SupabaseClient,
  negociacaoId: string,
  itens: ItemEditavel[],
  idsRemovidos: string[],
) {
  const existentes = itens.filter((item) => item.id);
  const novos = itens.filter((item) => !item.id);

  for (const item of existentes) {
    const { error } = await supabase
      .from("itens_negociacao")
      .update({
        produto_id: item.produtoId,
        qtd_negociada_v1: item.qtdV1,
        qtd_final: item.qtdFinal,
        preco_negociado: item.precoNegociado,
        preco_tabela: item.precoTabela,
        estoque_disponivel: item.estoqueDisponivel,
        motivo_codigo: item.motivoCodigo,
      })
      .eq("id", item.id!);
    if (error) throw error;
  }

  if (novos.length > 0) {
    const { error } = await supabase.from("itens_negociacao").insert(
      novos.map((item) => ({
        negociacao_id: negociacaoId,
        produto_id: item.produtoId,
        qtd_negociada_v1: item.qtdV1,
        qtd_final: item.qtdFinal,
        preco_negociado: item.precoNegociado,
        preco_tabela: item.precoTabela,
        estoque_disponivel: item.estoqueDisponivel,
        motivo_codigo: item.motivoCodigo,
      })),
    );
    if (error) throw error;
  }

  if (idsRemovidos.length > 0) {
    const { error } = await supabase.from("itens_negociacao").delete().in("id", idsRemovidos);
    if (error) throw error;
  }
}
