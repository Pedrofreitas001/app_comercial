import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface LinhaImportada {
  codigo: string;
  produto: string;
  quantidade: number;
}

interface BodyImportacao {
  arquivoNome: string;
  linhas: LinhaImportada[];
}

// Grava a importacao diaria de estoque. So' admin/gerente podem confirmar
// (mesma regra de clientes_insert/produtos_insert). A escrita em `estoque`
// exige a service_role key - a tabela nao tem policy de insert/update para
// o role authenticated (ver 0002_rls.sql), de proposito: so' passa por aqui.
export async function POST(request: Request) {
  const supabaseSessao = await createClient();
  const {
    data: { user },
  } = await supabaseSessao.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: usuario } = await supabaseSessao
    .from("usuarios")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!usuario || (usuario.role !== "admin" && usuario.role !== "gerente")) {
    return NextResponse.json({ error: "Sem permissão para importar estoque." }, { status: 403 });
  }

  const body = (await request.json()) as BodyImportacao;
  if (!body?.linhas?.length) {
    return NextResponse.json({ error: "Nenhuma linha para importar." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: produtos, error: erroProdutos } = await supabase
    .from("produtos")
    .select("id, sku, sku_entrada");
  if (erroProdutos) {
    return NextResponse.json({ error: erroProdutos.message }, { status: 500 });
  }

  const produtoPorCodigo = new Map<string, string>();
  for (const p of produtos ?? []) {
    produtoPorCodigo.set(p.sku, p.id);
    for (const entrada of p.sku_entrada ?? []) {
      produtoPorCodigo.set(entrada, p.id);
    }
  }

  const { data: batch, error: erroBatch } = await supabase
    .from("import_batches")
    .insert({
      tipo: "estoque",
      arquivo_nome: body.arquivoNome,
      iniciado_por: user.id,
      status: "em_andamento",
      linhas_totais: body.linhas.length,
    })
    .select("id")
    .single();
  if (erroBatch || !batch) {
    return NextResponse.json({ error: erroBatch?.message ?? "Falha ao registrar a importação." }, { status: 500 });
  }

  const dataReferencia = new Date().toISOString().slice(0, 10);
  const encontrados = body.linhas.filter((l) => produtoPorCodigo.has(l.codigo));
  const naoEncontrados = body.linhas.length - encontrados.length;

  const linhasEstoque = encontrados.map((l) => ({
    produto_id: produtoPorCodigo.get(l.codigo)!,
    sku_entrada: l.codigo,
    quantidade_disponivel: l.quantidade,
    data_referencia: dataReferencia,
    origem: "stralog_import",
    import_batch_id: batch.id,
  }));

  const { error: erroEstoque } = await supabase
    .from("estoque")
    .upsert(linhasEstoque, { onConflict: "sku_entrada,data_referencia" });

  await supabase
    .from("import_batches")
    .update({
      status: erroEstoque ? "erro" : "concluido",
      linhas_importadas: encontrados.length,
      linhas_erro: naoEncontrados,
      concluido_em: new Date().toISOString(),
    })
    .eq("id", batch.id);

  if (erroEstoque) {
    return NextResponse.json({ error: erroEstoque.message }, { status: 500 });
  }

  return NextResponse.json({ importadas: encontrados.length, naoEncontrados });
}
