import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstoqueNormalizado, MockEstoqueRow } from "@/lib/mock-data";

export interface LinhaEstoque {
  row: MockEstoqueRow;
  norm: EstoqueNormalizado;
}

export interface EstoqueNormalizadoResultado {
  linhas: LinhaEstoque[];
  // data do import mais recente entre os SKUs retornados (dd/MM/yyyy),
  // usada no card "Última atualização" da tela de Estoque.
  ultimaAtualizacao: string | null;
}

function paraBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

interface VEstoqueNormalizadoRow {
  produto_id: string | null;
  sku_entrada: string;
  data_referencia: string;
  bruto: number;
  pendente: number;
  normalizado: number;
  aguardando_baixa: boolean;
  unidade: string | null;
  vencimento_proximo: string | null;
  deficit: number;
  em_ruptura: boolean;
}

export async function getEstoqueNormalizado(supabase: SupabaseClient): Promise<EstoqueNormalizadoResultado> {
  const [{ data: linhas, error: erroEstoque }, { data: produtos, error: erroProdutos }] = await Promise.all([
    supabase.from("v_estoque_normalizado").select("*").returns<VEstoqueNormalizadoRow[]>(),
    supabase.from("produtos").select("id, sku, descricao, categoria"),
  ]);
  if (erroEstoque) throw erroEstoque;
  if (erroProdutos) throw erroProdutos;

  const produtoPorId = new Map((produtos ?? []).map((p) => [p.id as string, p]));

  const dataMaisRecenteIso = (linhas ?? []).reduce<string | null>(
    (max, l) => (!max || l.data_referencia > max ? l.data_referencia : max),
    null,
  );

  const mapeadas = (linhas ?? [])
    .map((l): LinhaEstoque => {
      const produto = l.produto_id ? produtoPorId.get(l.produto_id) : undefined;
      const sku = produto?.sku ?? l.sku_entrada;
      return {
        row: {
          sku,
          descricao: produto?.descricao ?? sku,
          categoria: produto?.categoria ?? null,
          quantidade: l.normalizado,
          unidade: l.unidade ?? "UN",
          vencimentoProximo: l.vencimento_proximo ? paraBr(l.vencimento_proximo) : null,
        },
        norm: {
          bruto: l.bruto,
          pendente: l.pendente,
          normalizado: l.normalizado,
          aguardandoBaixa: l.aguardando_baixa,
          deficit: l.deficit,
          emRuptura: l.em_ruptura,
        },
      };
    })
    .sort((a, b) => a.row.sku.localeCompare(b.row.sku));

  return {
    linhas: mapeadas,
    ultimaAtualizacao: dataMaisRecenteIso ? paraBr(dataMaisRecenteIso) : null,
  };
}
