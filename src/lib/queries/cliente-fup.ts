import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClienteRow } from "@/lib/queries/cadastros";

export interface NotaCliente {
  id: string;
  autor: string;
  data: string; // dd/MM/yyyy HH:mm
  texto: string;
}

export interface ArquivoCliente {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  autor: string;
  data: string; // dd/MM/yyyy
}

export interface ClienteDetalhe extends ClienteRow {
  notas: NotaCliente[];
  arquivos: ArquivoCliente[];
}

function paraBrData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function paraBrDataHora(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getClienteDetalhe(supabase: SupabaseClient, id: string): Promise<ClienteDetalhe | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select(
      `id, codigo_cliente, nome, nome_resumido, nome_fantasia, rede, canal, cidade, estado, cnpj,
       vendedor_nome_origem, gerente_nome_origem, tipo_frete, tabela_preco, status,
       notas:cliente_notas ( id, texto, created_at, autor:usuarios ( nome_completo ) ),
       arquivos:cliente_arquivos ( id, nome, tipo, tamanho_bytes, data, autor:usuarios ( nome_completo ) )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
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
    notas: { id: string; texto: string; created_at: string; autor: { nome_completo: string } | null }[];
    arquivos: {
      id: string;
      nome: string;
      tipo: string;
      tamanho_bytes: number | null;
      data: string;
      autor: { nome_completo: string } | null;
    }[];
  };

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
    // Mais recente primeiro: o FUP é lido de cima pra baixo.
    notas: row.notas
      .map((n) => ({
        id: n.id,
        autor: n.autor?.nome_completo ?? "—",
        data: paraBrDataHora(n.created_at),
        texto: n.texto,
        _ord: n.created_at,
      }))
      .sort((a, b) => b._ord.localeCompare(a._ord))
      .map(({ _ord, ...nota }) => nota),
    arquivos: row.arquivos
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        tipo: a.tipo,
        tamanho: formatarTamanho(a.tamanho_bytes),
        autor: a.autor?.nome_completo ?? "—",
        data: paraBrData(a.data),
        _ord: a.data,
      }))
      .sort((a, b) => b._ord.localeCompare(a._ord))
      .map(({ _ord, ...arquivo }) => arquivo),
  };
}

// Contagem de notas/arquivos por cliente, pra lista mostrar quem já tem
// acompanhamento registrado sem precisar abrir cada um.
export interface ResumoFup {
  notas: number;
  arquivos: number;
  ultimaNota: string | null; // dd/MM/yyyy
}

export async function getResumoFupPorCliente(supabase: SupabaseClient): Promise<Map<string, ResumoFup>> {
  const [{ data: notas, error: erroNotas }, { data: arquivos, error: erroArquivos }] = await Promise.all([
    supabase.from("cliente_notas").select("cliente_id, created_at"),
    supabase.from("cliente_arquivos").select("cliente_id"),
  ]);
  if (erroNotas) throw erroNotas;
  if (erroArquivos) throw erroArquivos;

  const mapa = new Map<string, ResumoFup>();
  const garantir = (id: string) => {
    if (!mapa.has(id)) mapa.set(id, { notas: 0, arquivos: 0, ultimaNota: null });
    return mapa.get(id)!;
  };

  for (const n of notas ?? []) {
    const r = garantir(n.cliente_id as string);
    r.notas += 1;
    const iso = n.created_at as string;
    if (!r.ultimaNota || iso > r.ultimaNota) r.ultimaNota = iso;
  }
  for (const a of arquivos ?? []) {
    garantir(a.cliente_id as string).arquivos += 1;
  }
  for (const r of mapa.values()) {
    if (r.ultimaNota) r.ultimaNota = paraBrData(r.ultimaNota);
  }
  return mapa;
}

export async function adicionarNotaCliente(
  supabase: SupabaseClient,
  clienteId: string,
  usuarioId: string,
  texto: string,
) {
  const { data, error } = await supabase
    .from("cliente_notas")
    .insert({ cliente_id: clienteId, usuario_id: usuarioId, texto })
    .select("id, texto, created_at")
    .single();
  if (error) throw error;
  return data;
}
