import * as XLSX from "xlsx";

// Parser do export diário do WMS STRALOG (aba "Filtrada" ou "Original").
// Roda no navegador (preview) — a mesma regra será usada depois no Route
// Handler server-side que grava de fato na tabela `estoque`.

export interface EstoqueParseLinha {
  codigo: string;
  produto: string;
  status: string | null;
  quantidade: number;
}

export interface EstoqueParseAgregado {
  codigo: string;
  produto: string;
  quantidade: number;
}

export interface EstoqueParseResult {
  planilhaUsada: string;
  linhasTotais: number;
  linhasValidas: number;
  linhasIgnoradas: number;
  linhasForaDoStatusBom: number;
  agregados: EstoqueParseAgregado[];
}

// Faixa Unicode dos acentos combinantes (U+0300-U+036F), construida por
// codigo para evitar caracteres combinantes literais no arquivo fonte.
const DIACRITICOS = new RegExp(`[\\u0300-\\u036f]`, "g");

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .trim();
}

function acharLinhaCabecalho(linhas: unknown[][]): number {
  for (let i = 0; i < Math.min(linhas.length, 6); i++) {
    const linha = linhas[i] ?? [];
    const temCodigo = linha.some((c) => normalizar(c) === "codigo");
    const temQuantidade = linha.some((c) => normalizar(c).includes("quantidade") && normalizar(c).includes("dispon"));
    if (temCodigo && temQuantidade) return i;
  }
  return -1;
}

function acharColuna(cabecalho: unknown[], alvo: (h: string) => boolean): number {
  return cabecalho.findIndex((c) => alvo(normalizar(c)));
}

export function parseEstoqueStralog(buffer: ArrayBuffer): EstoqueParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const nomeAba = workbook.SheetNames.includes("Filtrada")
    ? "Filtrada"
    : workbook.SheetNames.includes("Original")
      ? "Original"
      : workbook.SheetNames[0];

  const planilha = workbook.Sheets[nomeAba];
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(planilha, { header: 1, defval: null, blankrows: false });

  const idxCabecalho = acharLinhaCabecalho(linhas);
  if (idxCabecalho === -1) {
    throw new Error(
      `Não encontrei as colunas "Código" e "Quantidade Disponível" na aba "${nomeAba}". Confirme se o arquivo é o export do STRALOG.`,
    );
  }

  const cabecalho = linhas[idxCabecalho];
  const idxCodigo = acharColuna(cabecalho, (h) => h === "codigo");
  const idxProduto = acharColuna(cabecalho, (h) => h === "produto");
  const idxStatus = acharColuna(cabecalho, (h) => h === "status");
  const idxQuantidade = acharColuna(cabecalho, (h) => h.includes("quantidade") && h.includes("dispon"));

  const dados = linhas.slice(idxCabecalho + 1);
  const linhasValidas: EstoqueParseLinha[] = [];
  let ignoradas = 0;

  for (const linha of dados) {
    const codigoRaw = linha[idxCodigo];
    const quantidadeRaw = linha[idxQuantidade];
    const codigo = typeof codigoRaw === "string" ? codigoRaw.trim() : codigoRaw != null ? String(codigoRaw) : "";
    const quantidade = typeof quantidadeRaw === "number" ? quantidadeRaw : Number(quantidadeRaw);

    // descarta linhas de rodape/total (ex: "Valor Estoque: R$ ...") e linhas sem
    // codigo ou quantidade valida - nao sao produtos.
    const pareceRodape = /valor estoque|r\$/i.test(codigo);
    if (!codigo || pareceRodape || !Number.isFinite(quantidade)) {
      if (codigo || quantidadeRaw != null) ignoradas += 1;
      continue;
    }

    linhasValidas.push({
      codigo,
      produto: idxProduto >= 0 ? String(linha[idxProduto] ?? "") : "",
      status: idxStatus >= 0 ? String(linha[idxStatus] ?? "").trim() : null,
      quantidade,
    });
  }

  const linhasBom = linhasValidas.filter((l) => l.status === null || normalizar(l.status) === "bom");
  const foraDoStatusBom = linhasValidas.length - linhasBom.length;

  const porSku = new Map<string, EstoqueParseAgregado>();
  for (const linha of linhasBom) {
    const atual = porSku.get(linha.codigo);
    if (atual) {
      atual.quantidade += linha.quantidade;
    } else {
      porSku.set(linha.codigo, { codigo: linha.codigo, produto: linha.produto, quantidade: linha.quantidade });
    }
  }

  return {
    planilhaUsada: nomeAba,
    linhasTotais: dados.length,
    linhasValidas: linhasValidas.length,
    linhasIgnoradas: ignoradas,
    linhasForaDoStatusBom: foraDoStatusBom,
    agregados: [...porSku.values()].sort((a, b) => a.codigo.localeCompare(b.codigo)),
  };
}
