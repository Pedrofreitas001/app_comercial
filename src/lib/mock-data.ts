// Dados fictícios só para validar o design antes do Supabase estar
// configurado. Substituídos por dados reais nas próximas etapas.

export type TicketStatus = "rascunho" | "em_andamento" | "concluida" | "cancelada";

export interface MockItemNegociacao {
  sku: string;
  descricao: string;
  qtdNegociada: number;
  qtdVendida: number;
  qtdBonificada: number;
  estoqueDisponivel: number;
  precoNegociado: number;
  motivo: string | null;
}

export interface MockTicket {
  id: string;
  codigo: string;
  cliente: string;
  clienteCodigo: string;
  cidadeUf: string;
  canal: string;
  vendedor: string;
  data: string; // dd/MM/yyyy
  status: TicketStatus;
  nf: string | null;
  observacoes: string | null;
  itens: MockItemNegociacao[];
}

export const MOTIVO_SEM_ESTOQUE = "Sem estoque";

export function itemTotais(item: MockItemNegociacao) {
  const totalNegociado = item.qtdNegociada * item.precoNegociado;
  const totalVendido = item.qtdVendida * item.precoNegociado;
  const unidadesPerdidas =
    item.motivo === MOTIVO_SEM_ESTOQUE ? Math.max(item.qtdNegociada - item.qtdVendida, 0) : 0;
  const valorPerdido = unidadesPerdidas * item.precoNegociado;
  return { totalNegociado, totalVendido, unidadesPerdidas, valorPerdido };
}

export function ticketTotais(ticket: MockTicket) {
  return ticket.itens.reduce(
    (acc, item) => {
      const t = itemTotais(item);
      acc.totalNegociado += t.totalNegociado;
      acc.totalVendido += t.totalVendido;
      acc.unidadesPerdidas += t.unidadesPerdidas;
      acc.valorPerdido += t.valorPerdido;
      return acc;
    },
    { totalNegociado: 0, totalVendido: 0, unidadesPerdidas: 0, valorPerdido: 0 },
  );
}

export const mockVendedores = ["Andre Benah", "Camila Rocha", "Paulo Menezes"];

export const mockTickets: MockTicket[] = [
  {
    id: "t1",
    codigo: "NEG-2026-0148",
    cliente: "MAKIBELLA COSMETICOS SHOP LTDA",
    clienteCodigo: "C00000488",
    cidadeUf: "São Paulo/SP",
    canal: "Médio Varejo",
    vendedor: "Andre Benah",
    data: "24/07/2026",
    status: "concluida",
    nf: "246511",
    observacoes: "Pedido mensal. Cliente pediu prioridade na linha Divine.",
    itens: [
      { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", qtdNegociada: 240, qtdVendida: 180, qtdBonificada: 12, estoqueDisponivel: 180, precoNegociado: 17.5, motivo: MOTIVO_SEM_ESTOQUE },
      { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", qtdNegociada: 120, qtdVendida: 120, qtdBonificada: 0, estoqueDisponivel: 264, precoNegociado: 18.9, motivo: null },
      { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", qtdNegociada: 36, qtdVendida: 36, qtdBonificada: 4, estoqueDisponivel: 88, precoNegociado: 59.9, motivo: null },
    ],
  },
  {
    id: "t2",
    codigo: "NEG-2026-0147",
    cliente: "STUDIO FERNANDA MAGALHAES HAIR AND MAKE UP",
    clienteCodigo: "C00001411",
    cidadeUf: "São Paulo/SP",
    canal: "Distribuidor",
    vendedor: "Camila Rocha",
    data: "24/07/2026",
    status: "concluida",
    nf: "246498",
    observacoes: null,
    itens: [
      { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", qtdNegociada: 96, qtdVendida: 96, qtdBonificada: 0, estoqueDisponivel: 310, precoNegociado: 19.9, motivo: null },
      { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", qtdNegociada: 48, qtdVendida: 48, qtdBonificada: 6, estoqueDisponivel: 150, precoNegociado: 39.0, motivo: null },
    ],
  },
  {
    id: "t3",
    codigo: "NEG-2026-0146",
    cliente: "BEAUTY SUPPLY COSMETICS SOCIEDADE UNIPES",
    clienteCodigo: "C00002190",
    cidadeUf: "Rio de Janeiro/RJ",
    canal: "Distribuidor",
    vendedor: "Paulo Menezes",
    data: "23/07/2026",
    status: "em_andamento",
    nf: null,
    observacoes: "Aguardando confirmação de cobertura de estoque da ampola.",
    itens: [
      { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", qtdNegociada: 300, qtdVendida: 200, qtdBonificada: 0, estoqueDisponivel: 200, precoNegociado: 16.8, motivo: MOTIVO_SEM_ESTOQUE },
      { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", qtdNegociada: 150, qtdVendida: 150, qtdBonificada: 10, estoqueDisponivel: 264, precoNegociado: 17.9, motivo: null },
    ],
  },
  {
    id: "t4",
    codigo: "NEG-2026-0145",
    cliente: "SALAO VIP HAIR DESIGN LTDA",
    clienteCodigo: "C00003310",
    cidadeUf: "Curitiba/PR",
    canal: "Pequeno Varejo",
    vendedor: "Andre Benah",
    data: "23/07/2026",
    status: "concluida",
    nf: "246402",
    observacoes: null,
    itens: [
      { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", qtdNegociada: 24, qtdVendida: 20, qtdBonificada: 0, estoqueDisponivel: 20, precoNegociado: 42.0, motivo: MOTIVO_SEM_ESTOQUE },
      { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", qtdNegociada: 48, qtdVendida: 48, qtdBonificada: 0, estoqueDisponivel: 310, precoNegociado: 21.3, motivo: null },
    ],
  },
  {
    id: "t5",
    codigo: "NEG-2026-0144",
    cliente: "DROGARIA CENTRAL COSMETICOS LTDA",
    clienteCodigo: "C00004021",
    cidadeUf: "Belo Horizonte/MG",
    canal: "Farma",
    vendedor: "Camila Rocha",
    data: "22/07/2026",
    status: "rascunho",
    nf: null,
    observacoes: "Cliente revendo mix antes de fechar.",
    itens: [
      { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", qtdNegociada: 12, qtdVendida: 12, qtdBonificada: 0, estoqueDisponivel: 88, precoNegociado: 64.5, motivo: null },
    ],
  },
  {
    id: "t6",
    codigo: "NEG-2026-0143",
    cliente: "MAKIBELLA COSMETICOS SHOP LTDA",
    clienteCodigo: "C00000489",
    cidadeUf: "Osasco/SP",
    canal: "Médio Varejo",
    vendedor: "Andre Benah",
    data: "21/07/2026",
    status: "concluida",
    nf: "246301",
    observacoes: null,
    itens: [
      { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", qtdNegociada: 200, qtdVendida: 150, qtdBonificada: 0, estoqueDisponivel: 150, precoNegociado: 18.5, motivo: MOTIVO_SEM_ESTOQUE },
      { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", qtdNegociada: 100, qtdVendida: 80, qtdBonificada: 0, estoqueDisponivel: 320, precoNegociado: 17.9, motivo: "Preço" },
      { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", qtdNegociada: 24, qtdVendida: 24, qtdBonificada: 2, estoqueDisponivel: 90, precoNegociado: 61.0, motivo: null },
    ],
  },
  {
    id: "t7",
    codigo: "NEG-2026-0142",
    cliente: "BEAUTY SUPPLY COSMETICS SOCIEDADE UNIPES",
    clienteCodigo: "C00002190",
    cidadeUf: "Rio de Janeiro/RJ",
    canal: "Distribuidor",
    vendedor: "Paulo Menezes",
    data: "20/07/2026",
    status: "concluida",
    nf: "246187",
    observacoes: null,
    itens: [
      { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", qtdNegociada: 200, qtdVendida: 200, qtdBonificada: 20, estoqueDisponivel: 400, precoNegociado: 18.9, motivo: null },
      { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", qtdNegociada: 60, qtdVendida: 30, qtdBonificada: 0, estoqueDisponivel: 30, precoNegociado: 38.0, motivo: MOTIVO_SEM_ESTOQUE },
    ],
  },
  {
    id: "t8",
    codigo: "NEG-2026-0141",
    cliente: "SALAO VIP HAIR DESIGN LTDA",
    clienteCodigo: "C00003310",
    cidadeUf: "Curitiba/PR",
    canal: "Pequeno Varejo",
    vendedor: "Camila Rocha",
    data: "18/07/2026",
    status: "cancelada",
    nf: null,
    observacoes: "Cliente desistiu após revisão de orçamento.",
    itens: [
      { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", qtdNegociada: 60, qtdVendida: 0, qtdBonificada: 0, estoqueDisponivel: 320, precoNegociado: 18.9, motivo: "Cliente desistiu" },
    ],
  },
];

// Série histórica para o gráfico mensal (negociado vs vendido).
export const mockMensal = [
  { mes: "Fev", negociado: 182_000, vendido: 168_400 },
  { mes: "Mar", negociado: 214_500, vendido: 189_100 },
  { mes: "Abr", negociado: 198_200, vendido: 184_600 },
  { mes: "Mai", negociado: 246_800, vendido: 214_300 },
  { mes: "Jun", negociado: 271_400, vendido: 229_800 },
  { mes: "Jul", negociado: 259_300, vendido: 226_100 },
];

export const mockDistribuicaoMotivo = [
  { motivo: "Sem estoque", valor: 62 },
  { motivo: "Substituição de SKU", valor: 15 },
  { motivo: "Cliente desistiu", valor: 10 },
  { motivo: "Preço", valor: 8 },
  { motivo: "Campanha encerrada", valor: 3 },
  { motivo: "Outro", valor: 2 },
];

export const mockClientes = [
  { codigo: "C00000488", nome: "MAKIBELLA COSMETICOS SHOP LTDA", rede: "MAKIBELLA", canal: "Médio Varejo", cidade: "São Paulo", estado: "SP", status: "ativo" },
  { codigo: "C00001411", nome: "STUDIO FERNANDA MAGALHAES HAIR AND MAKE UP LTDA", rede: "STUDIO FERNANDA MAGALHAES", canal: "Distribuidor", cidade: "São Paulo", estado: "SP", status: "ativo" },
  { codigo: "C00000489", nome: "MAKIBELLA COSMETICOS SHOP LTDA", rede: "MAKIBELLA", canal: "Médio Varejo", cidade: "Osasco", estado: "SP", status: "ativo" },
  { codigo: "C00002190", nome: "BEAUTY SUPPLY COSMETICS SOCIEDADE UNIPES", rede: "BEAUTY SUPPLY", canal: "Distribuidor", cidade: "Rio de Janeiro", estado: "RJ", status: "ativo" },
  { codigo: "C00003310", nome: "SALAO VIP HAIR DESIGN LTDA", rede: "VIP HAIR", canal: "Pequeno Varejo", cidade: "Curitiba", estado: "PR", status: "ativo" },
  { codigo: "C00004021", nome: "DROGARIA CENTRAL COSMETICOS LTDA", rede: "DROGARIA CENTRAL", canal: "Farma", cidade: "Belo Horizonte", estado: "MG", status: "inativo" },
];

export const mockProdutos = [
  { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", categoria: "Ampola de Tratamento", marca: null, preco: 18.9, status: "ativo" },
  { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", categoria: "Ampola de Tratamento", marca: null, preco: 19.9, status: "ativo" },
  { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", categoria: "Kit Tratamento", marca: null, preco: 64.5, status: "ativo" },
  { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", categoria: "Ampola de Tratamento", marca: null, preco: 21.3, status: "ativo" },
  { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", categoria: "Máscara", marca: null, preco: 42.0, status: "ativo" },
  { sku: "0.006", descricao: "SACOLA LUXO TRIPLEX", categoria: "Material de Apoio", marca: null, preco: null, status: "ativo" },
];

export interface MockEstoqueRow {
  sku: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  vencimentoProximo: string | null; // dd/MM/yyyy do lote que vence antes
}

export const mockEstoqueDataReferencia = "24/07/2026";

export const mockEstoque: MockEstoqueRow[] = [
  { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", categoria: "Ampola de Tratamento", quantidade: 273, unidade: "UN", vencimentoProximo: "01/10/2027" },
  { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", categoria: "Ampola de Tratamento", quantidade: 264, unidade: "UN", vencimentoProximo: "30/01/2029" },
  { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", categoria: "Ampola de Tratamento", quantidade: 310, unidade: "UN", vencimentoProximo: "15/03/2028" },
  { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", categoria: "Kit Tratamento", quantidade: 88, unidade: "UN", vencimentoProximo: "01/05/2028" },
  { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", categoria: "Máscara", quantidade: 20, unidade: "UN", vencimentoProximo: "12/11/2027" },
  { sku: "F11200", descricao: "FINALIZADOR LEAVE-IN 200ML", categoria: "Finalizador", quantidade: 0, unidade: "UN", vencimentoProximo: null },
  { sku: "0.006", descricao: "SACOLA LUXO TRIPLEX", categoria: "Material de Apoio", quantidade: 1450, unidade: "UN", vencimentoProximo: null },
];
