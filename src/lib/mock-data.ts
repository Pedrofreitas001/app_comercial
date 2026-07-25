// Dados fictícios só para validar o design antes do Supabase estar
// configurado. Substituídos por dados reais nas próximas etapas.

export type TicketStatus = "rascunho" | "em_andamento" | "concluida" | "cancelada";

export interface MockItemNegociacao {
  sku: string;
  descricao: string;
  precoTabela: number;
  precoNegociado: number;
  qtdV1: number; // quantidade da negociação preliminar
  qtdFinal: number; // quantidade final (após ajuste por ruptura/motivo)
  estoqueDisponivel: number;
  motivo: string | null;
}

// Bonificação é um acordo sobre o TOTAL do pedido (não por SKU):
// peças acordadas + faturamento correspondente, com data e status de pagamento.
export interface MockBonificacao {
  pecas: number;
  valor: number;
  dataPagamento: string | null; // dd/MM/yyyy
  paga: boolean;
  observacoes: string | null;
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
  bonificacao: MockBonificacao | null;
  itens: MockItemNegociacao[];
}

export const MOTIVO_SEM_ESTOQUE = "Sem estoque";

// Lista fixa de motivos (espec. MVP1, seção 13) — espelha a tabela motivos_perda.
export const MOTIVOS = [
  MOTIVO_SEM_ESTOQUE,
  "Substituição de SKU",
  "Cliente desistiu",
  "Preço",
  "Campanha encerrada",
  "Outro",
] as const;

// "Hoje" fixo dos dados de exemplo, para os status de bonificação serem estáveis.
export const MOCK_HOJE = "25/07/2026";

function parseData(data: string) {
  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

export type BonifStatus = "pago" | "pendente" | "atrasada";

export function bonifStatus(bonificacao: MockBonificacao | null): BonifStatus | null {
  if (!bonificacao || bonificacao.pecas <= 0) return null;
  if (bonificacao.paga) return "pago";
  if (bonificacao.dataPagamento && parseData(bonificacao.dataPagamento) < parseData(MOCK_HOJE)) {
    return "atrasada";
  }
  return "pendente";
}

export function itemTotais(item: MockItemNegociacao) {
  const totalV1 = item.qtdV1 * item.precoNegociado;
  const totalFinal = item.qtdFinal * item.precoNegociado;
  const unidadesPerdidas =
    item.motivo === MOTIVO_SEM_ESTOQUE ? Math.max(item.qtdV1 - item.qtdFinal, 0) : 0;
  const valorPerdido = unidadesPerdidas * item.precoNegociado;
  const descontoPct =
    item.precoTabela > 0 ? Math.round((1 - item.precoNegociado / item.precoTabela) * 100) : 0;
  return { totalV1, totalFinal, unidadesPerdidas, valorPerdido, descontoPct };
}

export function ticketTotais(ticket: MockTicket) {
  return ticket.itens.reduce(
    (acc, item) => {
      const t = itemTotais(item);
      acc.totalV1 += t.totalV1;
      acc.totalFinal += t.totalFinal;
      acc.unidadesPerdidas += t.unidadesPerdidas;
      acc.valorPerdido += t.valorPerdido;
      return acc;
    },
    { totalV1: 0, totalFinal: 0, unidadesPerdidas: 0, valorPerdido: 0 },
  );
}

export const mockVendedores = ["Andre Benah", "Camila Rocha", "Paulo Menezes"];

// Foto do catálogo STRALOG usada nos itens de exemplo. Cada item de negociação
// guarda o catálogo/data em que o SKU foi escolhido pelo vendedor.
export const mockCatalogoRef = "Catálogo STRALOG · 24/07/2026";

export function produtoCatalogo(sku: string) {
  return mockProdutos.find((p) => p.sku === sku) ?? null;
}

// Estoque disponível "agora" para o SKU — é isto que o vendedor vê ao montar
// a negociação, e o que embasa o apontamento de ruptura no momento do acordo.
export function estoqueDisponivelDe(sku: string) {
  return mockEstoque.find((e) => e.sku === sku)?.quantidade ?? 0;
}

export function proximoCodigoTicket() {
  const proximo = mockTickets.length + 1;
  return `NEG-2026-${String(148 + proximo).padStart(4, "0")}`;
}

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
    bonificacao: { pecas: 16, valor: 485.0, dataPagamento: "15/08/2026", paga: false, observacoes: "Acordado sobre o total do pedido; entrega junto com a proxima NF." },
    itens: [
      {
        sku: "D82399",
        descricao: "DIVINE POWER DOSE - AMPOLA 13ML",
        precoTabela: 18.9,
        precoNegociado: 17.5,
        qtdV1: 240,
        qtdFinal: 180,
        estoqueDisponivel: 180,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
      {
        sku: "DC82169",
        descricao: "DIVINE POWER DOSE CONDITIONING 13ML",
        precoTabela: 19.9,
        precoNegociado: 18.9,
        qtdV1: 120,
        qtdFinal: 120,
        estoqueDisponivel: 264,
        motivo: null,
      },
      {
        sku: "C82071",
        descricao: "CRONOGRAMA CAPILAR COLOR",
        precoTabela: 64.5,
        precoNegociado: 59.9,
        qtdV1: 36,
        qtdFinal: 36,
        estoqueDisponivel: 88,
        motivo: null,
      },
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
    bonificacao: { pecas: 6, valor: 252.0, dataPagamento: "24/07/2026", paga: true, observacoes: null },
    itens: [
      {
        sku: "A55012",
        descricao: "AMPOLA DE TRATAMENTO INTENSIVO",
        precoTabela: 21.3,
        precoNegociado: 19.9,
        qtdV1: 96,
        qtdFinal: 96,
        estoqueDisponivel: 310,
        motivo: null,
      },
      {
        sku: "B90044",
        descricao: "MASCARA RECONSTRUCAO PROFUNDA",
        precoTabela: 42.0,
        precoNegociado: 39.0,
        qtdV1: 48,
        qtdFinal: 48,
        estoqueDisponivel: 150,
        motivo: null,
      },
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
    bonificacao: { pecas: 10, valor: 199.0, dataPagamento: "20/07/2026", paga: false, observacoes: "Pagamento atrasou por pendencia de estoque." },
    itens: [
      {
        sku: "D82399",
        descricao: "DIVINE POWER DOSE - AMPOLA 13ML",
        precoTabela: 18.9,
        precoNegociado: 16.8,
        qtdV1: 300,
        qtdFinal: 200,
        estoqueDisponivel: 200,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
      {
        sku: "DC82169",
        descricao: "DIVINE POWER DOSE CONDITIONING 13ML",
        precoTabela: 19.9,
        precoNegociado: 17.9,
        qtdV1: 150,
        qtdFinal: 150,
        estoqueDisponivel: 264,
        motivo: null,
      },
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
    bonificacao: null,
    itens: [
      {
        sku: "B90044",
        descricao: "MASCARA RECONSTRUCAO PROFUNDA",
        precoTabela: 42.0,
        precoNegociado: 42.0,
        qtdV1: 24,
        qtdFinal: 20,
        estoqueDisponivel: 20,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
      {
        sku: "A55012",
        descricao: "AMPOLA DE TRATAMENTO INTENSIVO",
        precoTabela: 21.3,
        precoNegociado: 21.3,
        qtdV1: 48,
        qtdFinal: 48,
        estoqueDisponivel: 310,
        motivo: null,
      },
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
    bonificacao: null,
    itens: [
      {
        sku: "C82071",
        descricao: "CRONOGRAMA CAPILAR COLOR",
        precoTabela: 64.5,
        precoNegociado: 64.5,
        qtdV1: 12,
        qtdFinal: 12,
        estoqueDisponivel: 88,
        motivo: null,
      },
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
    bonificacao: { pecas: 2, valor: 129.0, dataPagamento: "28/07/2026", paga: false, observacoes: null },
    itens: [
      {
        sku: "DC82169",
        descricao: "DIVINE POWER DOSE CONDITIONING 13ML",
        precoTabela: 19.9,
        precoNegociado: 18.5,
        qtdV1: 200,
        qtdFinal: 150,
        estoqueDisponivel: 150,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
      {
        sku: "D82399",
        descricao: "DIVINE POWER DOSE - AMPOLA 13ML",
        precoTabela: 18.9,
        precoNegociado: 17.9,
        qtdV1: 100,
        qtdFinal: 80,
        estoqueDisponivel: 320,
        motivo: "Preço",
      },
      {
        sku: "C82071",
        descricao: "CRONOGRAMA CAPILAR COLOR",
        precoTabela: 64.5,
        precoNegociado: 61.0,
        qtdV1: 24,
        qtdFinal: 24,
        estoqueDisponivel: 90,
        motivo: null,
      },
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
    bonificacao: { pecas: 20, valor: 378.0, dataPagamento: "22/07/2026", paga: true, observacoes: null },
    itens: [
      {
        sku: "A55012",
        descricao: "AMPOLA DE TRATAMENTO INTENSIVO",
        precoTabela: 21.3,
        precoNegociado: 18.9,
        qtdV1: 200,
        qtdFinal: 200,
        estoqueDisponivel: 400,
        motivo: null,
      },
      {
        sku: "B90044",
        descricao: "MASCARA RECONSTRUCAO PROFUNDA",
        precoTabela: 42.0,
        precoNegociado: 38.0,
        qtdV1: 60,
        qtdFinal: 30,
        estoqueDisponivel: 30,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
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
    bonificacao: null,
    itens: [
      {
        sku: "D82399",
        descricao: "DIVINE POWER DOSE - AMPOLA 13ML",
        precoTabela: 18.9,
        precoNegociado: 18.9,
        qtdV1: 60,
        qtdFinal: 0,
        estoqueDisponivel: 320,
        motivo: "Cliente desistiu",
      },
    ],
  },
];

// Linhas de bonificação (uma por pedido) para a tela de administração.
export interface BonificacaoRow {
  ticketId: string;
  codigo: string;
  cliente: string;
  vendedor: string;
  pecas: number;
  valor: number;
  dataPagamento: string | null;
  status: BonifStatus;
  observacoes: string | null;
}

export function listarBonificacoes(): BonificacaoRow[] {
  return mockTickets
    .filter((ticket) => ticket.status !== "cancelada" && ticket.bonificacao)
    .map((ticket) => ({
      ticketId: ticket.id,
      codigo: ticket.codigo,
      cliente: ticket.cliente,
      vendedor: ticket.vendedor,
      pecas: ticket.bonificacao!.pecas,
      valor: ticket.bonificacao!.valor,
      dataPagamento: ticket.bonificacao!.dataPagamento,
      status: bonifStatus(ticket.bonificacao)!,
      observacoes: ticket.bonificacao!.observacoes,
    }));
}

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
