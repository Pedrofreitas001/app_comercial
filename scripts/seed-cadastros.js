// Seed de dados reais (clientes.json, produtos.json, estoque.json) pro
// Supabase. Uso pontual, roda uma vez contra um banco vazio.
//
//   node scripts/seed-cadastros.js
//
// Le as credenciais de .env.local (nao commitado) e usa a service_role key
// pra ignorar RLS - por isso NUNCA roda no browser/servidor da app, so'
// manualmente por quem tem o .env.local local.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function carregarEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const conteudo = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const linha of conteudo.split("\n")) {
    const l = linha.trim();
    if (!l || l.startsWith("#")) continue;
    const idx = l.indexOf("=");
    if (idx === -1) continue;
    env[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  }
  return env;
}

// dd/MM/yyyy -> yyyy-MM-dd (formato de data que o Postgres aceita)
function paraIso(dataBr) {
  if (!dataBr) return null;
  const [dia, mes, ano] = dataBr.split("/");
  return `${ano}-${mes}-${dia}`;
}

async function inserirEmLotes(supabase, tabela, linhas, tamanhoLote = 500) {
  for (let i = 0; i < linhas.length; i += tamanhoLote) {
    const lote = linhas.slice(i, i + tamanhoLote);
    const { error } = await supabase.from(tabela).insert(lote);
    if (error) throw new Error(`Falha inserindo em ${tabela} (lote ${i}-${i + lote.length}): ${error.message}`);
    console.log(`  ${tabela}: ${Math.min(i + lote.length, linhas.length)}/${linhas.length}`);
  }
}

async function main() {
  const env = carregarEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente em .env.local");
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { count: clientesExistentes } = await supabase.from("clientes").select("id", { count: "exact", head: true });
  const { count: produtosExistentes } = await supabase.from("produtos").select("id", { count: "exact", head: true });
  if ((clientesExistentes ?? 0) > 0 || (produtosExistentes ?? 0) > 0) {
    throw new Error(
      `Ja existem ${clientesExistentes} clientes e ${produtosExistentes} produtos no banco. ` +
        "Este script e' so' pro seed inicial (evita duplicar); rode 'delete from estoque; delete from produtos; delete from clientes;' antes se quiser reimportar.",
    );
  }

  const dataDir = path.join(__dirname, "..", "src", "lib", "data");
  const clientes = JSON.parse(fs.readFileSync(path.join(dataDir, "clientes.json"), "utf8"));
  const produtos = JSON.parse(fs.readFileSync(path.join(dataDir, "produtos.json"), "utf8"));
  const estoque = JSON.parse(fs.readFileSync(path.join(dataDir, "estoque.json"), "utf8"));

  console.log(`Lidos: ${clientes.length} clientes, ${produtos.length} produtos, ${estoque.length} linhas de estoque.`);

  console.log("Inserindo clientes...");
  await inserirEmLotes(
    supabase,
    "clientes",
    clientes.map((c) => ({
      codigo_cliente: c.codigo,
      nome: c.nome,
      nome_resumido: c.nomeResumido,
      nome_fantasia: c.nomeFantasia,
      rede: c.rede,
      canal: c.canal,
      cidade: c.cidade,
      estado: c.estado,
      cnpj: c.cnpj,
      vendedor_nome_origem: c.vendedorNomeOrigem,
      gerente_nome_origem: c.gerenteNomeOrigem,
      tipo_frete: c.tipoFrete,
      tabela_preco: c.tabelaPreco,
      status: c.status,
    })),
  );

  console.log("Inserindo produtos...");
  await inserirEmLotes(
    supabase,
    "produtos",
    produtos.map((p) => ({
      sku: p.sku,
      sku_entrada: p.skuEntrada,
      descricao: p.descricao,
      categoria: p.categoria,
      linha: p.linha,
      marca: p.marca,
      preco: p.preco,
      status: p.status,
    })),
  );

  console.log("Resolvendo produto_id por SKU para o estoque...");
  const { data: produtosSalvos, error: erroProdutos } = await supabase.from("produtos").select("id, sku");
  if (erroProdutos) throw new Error(`Falha lendo produtos de volta: ${erroProdutos.message}`);
  const idPorSku = new Map(produtosSalvos.map((p) => [p.sku, p.id]));

  const dataReferencia = "2026-07-24"; // mockEstoqueDataReferencia em mock-data.ts
  const estoqueRows = [];
  const semProduto = [];
  for (const e of estoque) {
    const produtoId = idPorSku.get(e.sku);
    if (!produtoId) {
      semProduto.push(e.sku);
      continue;
    }
    estoqueRows.push({
      produto_id: produtoId,
      sku_entrada: e.sku,
      quantidade_disponivel: e.quantidade,
      data_referencia: dataReferencia,
      origem: "seed_inicial",
      unidade: e.unidade,
      vencimento_proximo: paraIso(e.vencimentoProximo),
    });
  }
  if (semProduto.length > 0) {
    console.warn(`Aviso: ${semProduto.length} SKU(s) de estoque sem produto correspondente: ${semProduto.join(", ")}`);
  }

  console.log("Inserindo estoque...");
  await inserirEmLotes(supabase, "estoque", estoqueRows);

  console.log("Seed concluido.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
