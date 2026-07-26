// Tickets/dashboard ainda são ficticios (validam o design antes do Supabase
// existir). Clientes, produtos e estoque já vêm da base real do cliente —
// ver src/lib/data/*.json (gerados de base_cliente.xlsx, DIM_V1.xlsx e do
// export STRALOG). O catálogo de produtos é cumulativo: todo SKU que aparece
// no estoque STRALOG mas não está no DIM_V1 entra como produto "órfão" (ver
// script de geração) — assim nenhum SKU em estoque fica sem cadastro.
import clientesData from "@/lib/data/clientes.json";
import produtosData from "@/lib/data/produtos.json";
import estoqueData from "@/lib/data/estoque.json";
import { formatBRL } from "@/lib/format";

export interface Cliente {
  codigo: string;
  nome: string; // razão social
  nomeResumido: string; // editável — evita a razão social gigante nas telas
  nomeFantasia: string | null;
  rede: string | null;
  canal: string | null;
  cidade: string | null;
  estado: string | null;
  cnpj: string | null;
  vendedorNomeOrigem: string | null;
  gerenteNomeOrigem: string | null;
  tipoFrete: string | null;
  tabelaPreco: string | null;
  status: "ativo" | "inativo";
}

export interface Produto {
  sku: string; // SKU_saida (código de venda canônico)
  skuEntrada: string[]; // código(s) do WMS/STRALOG que resolvem para este SKU
  descricao: string;
  categoria: string | null;
  linha: string | null;
  marca: string | null;
  preco: number | null; // sem fonte na base DIM_V1 — nulo até preenchido manualmente
  status: "ativo" | "inativo";
}

export type TicketStatus = "rascunho" | "em_andamento" | "concluida" | "faturada" | "cancelada";

export interface MockItemNegociacao {
  id?: string; // id da linha em itens_negociacao (ausente nos itens de exemplo)
  sku: string;
  descricao: string;
  categoria?: string | null;
  precoTabela: number;
  precoNegociado: number;
  qtdV1: number; // quantidade da negociação preliminar
  qtdFinal: number; // quantidade final (após ajuste por ruptura/motivo)
  estoqueDisponivel: number;
  motivo: string | null;
}

// Bonificação é um acordo sobre o TOTAL do pedido, mas composto por produtos
// específicos escolhidos numa lista (SKU + quantidade + preço base) — peças e
// faturamento totais são contabilizados a partir desses itens, não digitados
// à parte.
export interface BonificacaoItem {
  sku: string;
  qtd: number;
  precoBase: number; // preço unitário usado para valorar este item da bonificação
  descricao?: string; // preenchido quando vem do banco - evita depender do catálogo mockado pra exibir
}

export interface MockBonificacao {
  itens: BonificacaoItem[];
  dataPagamento: string | null; // dd/MM/yyyy
  paga: boolean;
  observacoes: string | null;
}

export function bonificacaoTotais(bonificacao: MockBonificacao | null) {
  if (!bonificacao) return { pecas: 0, valor: 0 };
  return bonificacao.itens.reduce(
    (acc, item) => {
      acc.pecas += item.qtd;
      acc.valor += item.qtd * item.precoBase;
      return acc;
    },
    { pecas: 0, valor: 0 },
  );
}

// Nota de acompanhamento — o vendedor registra contexto ao longo da
// negociação (ligação, e-mail, decisão do cliente etc), não é um campo único.
export interface NotaTicket {
  id: string;
  autor: string;
  data: string; // dd/MM/yyyy HH:mm
  texto: string;
}

export interface ArquivoTicket {
  id: string;
  nome: string;
  tipo: string; // rótulo simplificado do tipo (PDF, Imagem, Excel, Word...)
  tamanho: string; // ex: "1,2 MB"
  autor: string;
  data: string; // dd/MM/yyyy
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
  notas: NotaTicket[];
  arquivos: ArquivoTicket[];
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

function parseData(data: string) {
  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function hoje(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

// Dias corridos entre `data` e hoje — usado para sinalizar negociações
// paradas (ex.: rascunho sem avanço há muito tempo).
export function diasDesde(data: string): number {
  const ms = hoje().getTime() - parseData(data).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Filtro de período — usado no dashboard e nas listas de negociações e
// bonificações, sempre calculado a partir de ticket.data (data da negociação).
export type PeriodoPreset = "todos" | "7d" | "30d" | "mes" | "mesPassado";

export const PERIODO_OPTIONS: { value: PeriodoPreset; label: string }[] = [
  { value: "todos", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "mes", label: "Este mês" },
  { value: "mesPassado", label: "Mês passado" },
];

export function dataDentroDoPeriodo(data: string, preset: PeriodoPreset): boolean {
  if (preset === "todos") return true;
  const d = parseData(data);
  const hj = hoje();
  if (preset === "7d") {
    const inicio = new Date(hj);
    inicio.setDate(hj.getDate() - 6);
    return d >= inicio && d <= hj;
  }
  if (preset === "30d") {
    const inicio = new Date(hj);
    inicio.setDate(hj.getDate() - 29);
    return d >= inicio && d <= hj;
  }
  if (preset === "mes") {
    return d.getFullYear() === hj.getFullYear() && d.getMonth() === hj.getMonth();
  }
  if (preset === "mesPassado") {
    const mesPassado = new Date(hj.getFullYear(), hj.getMonth() - 1, 1);
    return d.getFullYear() === mesPassado.getFullYear() && d.getMonth() === mesPassado.getMonth();
  }
  return true;
}

export type BonifStatus = "pago" | "pendente" | "atrasada";

export function bonifStatus(bonificacao: MockBonificacao | null): BonifStatus | null {
  if (!bonificacao || bonificacao.itens.length === 0) return null;
  if (bonificacao.paga) return "pago";
  if (bonificacao.dataPagamento && parseData(bonificacao.dataPagamento) < hoje()) {
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

// Dias parados sem avanço para um rascunho ser sinalizado no card "Precisa
// de atenção" do dashboard — evita alarme falso em rascunhos recém-criados.
const DIAS_RASCUNHO_PARADO = 3;

export interface AtencaoItem {
  id: string;
  ticketId: string;
  codigo: string;
  cliente: string;
  tipo: "ruptura" | "bonificacao" | "rascunho";
  detalhe: string;
}

// Reúne, a partir dos mesmos dados já calculados no dashboard, o que
// precisa de uma ação do vendedor/gestor hoje: ruptura ainda em negociação,
// bonificação atrasada e rascunho esquecido. Fonte única para o card do
// dashboard não divergir do que cada tela individual mostra.
export function listarAtencao(tickets: MockTicket[]): AtencaoItem[] {
  const itens: AtencaoItem[] = [];

  for (const ticket of tickets) {
    if (ticket.status === "cancelada") continue;

    if (ticket.status === "em_andamento") {
      const totais = ticketTotais(ticket);
      if (totais.valorPerdido > 0) {
        itens.push({
          id: `${ticket.id}-ruptura`,
          ticketId: ticket.id,
          codigo: ticket.codigo,
          cliente: ticket.cliente,
          tipo: "ruptura",
          detalhe: `${formatBRL(totais.valorPerdido)} em aberto por falta de estoque`,
        });
      }
    }

    if (ticket.status === "rascunho") {
      const dias = diasDesde(ticket.data);
      if (dias >= DIAS_RASCUNHO_PARADO) {
        itens.push({
          id: `${ticket.id}-rascunho`,
          ticketId: ticket.id,
          codigo: ticket.codigo,
          cliente: ticket.cliente,
          tipo: "rascunho",
          detalhe: `Rascunho parado há ${dias} dias sem avanço`,
        });
      }
    }

    if (ticket.bonificacao && bonifStatus(ticket.bonificacao) === "atrasada") {
      const valor = bonificacaoTotais(ticket.bonificacao).valor;
      itens.push({
        id: `${ticket.id}-bonificacao`,
        ticketId: ticket.id,
        codigo: ticket.codigo,
        cliente: ticket.cliente,
        tipo: "bonificacao",
        detalhe: `Bonificação de ${formatBRL(valor)} atrasada`,
      });
    }
  }

  const prioridade: Record<AtencaoItem["tipo"], number> = { ruptura: 0, bonificacao: 1, rascunho: 2 };
  return itens.sort((a, b) => prioridade[a.tipo] - prioridade[b.tipo]);
}

export const mockVendedores = ["Andre Benah", "Camila Rocha", "Paulo Menezes"];

// Aceita tanto o SKU de venda (SKU_saida) quanto um código de entrada do WMS —
// é assim que o "Código" do export STRALOG encontra o produto certo.
export function produtoCatalogo(codigo: string) {
  return mockProdutos.find((p) => p.sku === codigo || p.skuEntrada.includes(codigo)) ?? null;
}

// Estoque disponível "agora" para o SKU — é isto que o vendedor vê ao montar
// a negociação, e o que embasa o apontamento de ruptura no momento do acordo.
// Usa o valor JÁ NORMALIZADO (bruto - vendido ainda não abatido pelo WMS),
// nao o bruto do ultimo import - e a foto mais realista do que resta.
export function estoqueDisponivelDe(sku: string) {
  return estoqueNormalizadoDe(sku).normalizado;
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
    status: "faturada",
    nf: "246511",
    observacoes: "Pedido mensal. Cliente pediu prioridade na linha Divine.",
    notas: [
      {
        id: "n1",
        autor: "Andre Benah",
        data: "23/07/2026 09:14",
        texto: "Cliente pediu para priorizar a linha Divine neste pedido - ja avisei o Supply sobre a ruptura da ampola.",
      },
      {
        id: "n2",
        autor: "Andre Benah",
        data: "24/07/2026 11:02",
        texto: "Fechado com desconto de 7% na linha Divine. Bonificacao combinada para entrega junto com a proxima NF.",
      },
    ],
    arquivos: [
      {
        id: "a1",
        nome: "pedido-makibella-julho.pdf",
        tipo: "PDF",
        tamanho: "482 KB",
        autor: "Andre Benah",
        data: "24/07/2026",
      },
    ],
    bonificacao: {
      itens: [
        { sku: "DC821693", qtd: 12, precoBase: 18.9 },
        { sku: "CR823055", qtd: 4, precoBase: 64.5 },
      ],
      dataPagamento: "15/08/2026",
      paga: false,
      observacoes: "Acordado sobre o total do pedido; entrega junto com a proxima NF.",
    },
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
        sku: "DC821693",
        descricao: "DIVINE POWER DOSE CONDITIONING 13ML",
        precoTabela: 19.9,
        precoNegociado: 18.9,
        qtdV1: 120,
        qtdFinal: 120,
        estoqueDisponivel: 264,
        motivo: null,
      },
      {
        sku: "CR823055",
        descricao: "CRONOGRAMA CAPILAR COLOR CONDICIONANTE 3X13ML",
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
    status: "faturada",
    nf: "246498",
    observacoes: null,
    notas: [],
    arquivos: [],
    bonificacao: {
      itens: [{ sku: "RC821174", qtd: 6, precoBase: 42.0 }],
      dataPagamento: "24/07/2026",
      paga: true,
      observacoes: null,
    },
    itens: [
      {
        sku: "DE821556",
        descricao: "AMPOLA CONDICIONANTE DEFENSE POWER DOSE 13ML",
        precoTabela: 21.3,
        precoNegociado: 19.9,
        qtdV1: 96,
        qtdFinal: 96,
        estoqueDisponivel: 310,
        motivo: null,
      },
      {
        sku: "RC821174",
        descricao: "MASCARA CAPILAR REVIVAL RECONSTRUTORA 200G",
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
    notas: [],
    arquivos: [],
    bonificacao: {
      itens: [{ sku: "DC821693", qtd: 10, precoBase: 19.9 }],
      dataPagamento: "20/07/2026",
      paga: false,
      observacoes: "Pagamento atrasou por pendencia de estoque.",
    },
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
        sku: "DC821693",
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
    status: "faturada",
    nf: "246402",
    observacoes: null,
    notas: [],
    arquivos: [],
    bonificacao: null,
    itens: [
      {
        sku: "RC821174",
        descricao: "MASCARA CAPILAR REVIVAL RECONSTRUTORA 200G",
        precoTabela: 42.0,
        precoNegociado: 42.0,
        qtdV1: 24,
        qtdFinal: 20,
        estoqueDisponivel: 20,
        motivo: MOTIVO_SEM_ESTOQUE,
      },
      {
        sku: "DE821556",
        descricao: "AMPOLA CONDICIONANTE DEFENSE POWER DOSE 13ML",
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
    notas: [],
    arquivos: [],
    bonificacao: null,
    itens: [
      {
        sku: "CR823055",
        descricao: "CRONOGRAMA CAPILAR COLOR CONDICIONANTE 3X13ML",
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
    status: "faturada",
    nf: "246301",
    observacoes: null,
    notas: [],
    arquivos: [],
    bonificacao: {
      itens: [{ sku: "CR823055", qtd: 2, precoBase: 64.5 }],
      dataPagamento: "28/07/2026",
      paga: false,
      observacoes: null,
    },
    itens: [
      {
        sku: "DC821693",
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
        sku: "CR823055",
        descricao: "CRONOGRAMA CAPILAR COLOR CONDICIONANTE 3X13ML",
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
    status: "faturada",
    nf: "246187",
    observacoes: null,
    notas: [],
    arquivos: [],
    bonificacao: {
      itens: [{ sku: "DE821556", qtd: 20, precoBase: 18.9 }],
      dataPagamento: "22/07/2026",
      paga: true,
      observacoes: null,
    },
    itens: [
      {
        sku: "DE821556",
        descricao: "AMPOLA CONDICIONANTE DEFENSE POWER DOSE 13ML",
        precoTabela: 21.3,
        precoNegociado: 18.9,
        qtdV1: 200,
        qtdFinal: 200,
        estoqueDisponivel: 400,
        motivo: null,
      },
      {
        sku: "RC821174",
        descricao: "MASCARA CAPILAR REVIVAL RECONSTRUTORA 200G",
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
    notas: [],
    arquivos: [],
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
  data: string;
  pecas: number;
  valor: number;
  itens: BonificacaoItem[];
  dataPagamento: string | null;
  status: BonifStatus;
  observacoes: string | null;
}

export function listarBonificacoes(tickets: MockTicket[]): BonificacaoRow[] {
  return tickets
    .filter((ticket) => ticket.status !== "cancelada" && ticket.bonificacao)
    .map((ticket) => {
      const totais = bonificacaoTotais(ticket.bonificacao);
      return {
        ticketId: ticket.id,
        codigo: ticket.codigo,
        cliente: ticket.cliente,
        vendedor: ticket.vendedor,
        data: ticket.data,
        pecas: totais.pecas,
        valor: totais.valor,
        itens: ticket.bonificacao!.itens,
        dataPagamento: ticket.bonificacao!.dataPagamento,
        status: bonifStatus(ticket.bonificacao)!,
        observacoes: ticket.bonificacao!.observacoes,
      };
    });
}

export const mockDistribuicaoMotivo = [
  { motivo: "Sem estoque", valor: 62 },
  { motivo: "Substituição de SKU", valor: 15 },
  { motivo: "Cliente desistiu", valor: 10 },
  { motivo: "Preço", valor: 8 },
  { motivo: "Campanha encerrada", valor: 3 },
  { motivo: "Outro", valor: 2 },
];

// Catálogo completo importado da base real (ver src/lib/data/README) —
// base_cliente.xlsx (2730 clientes) e DIM_V1.xlsx (440 produtos, deduplicados
// por SKU_saida). Editável em Cadastros; nomeResumido é ajustável por linha.
export const mockClientes: Cliente[] = clientesData as Cliente[];
export const mockProdutos: Produto[] = produtosData as Produto[];

export interface MockEstoqueRow {
  sku: string;
  descricao: string;
  categoria: string | null;
  quantidade: number;
  unidade: string;
  vencimentoProximo: string | null; // dd/MM/yyyy do lote que vence antes
}

export const mockEstoqueDataReferencia = "24/07/2026";

// Estoque real: agregado da aba "Filtrada" do export STRALOG (status BOM,
// somado por SKU canônico) — ver src/lib/data/estoque.json. O catálogo de
// produtos acima já é cumulativo com esse mesmo export (SKUs órfãos do
// estoque entram no catálogo), então todo SKU aqui tem produto correspondente.
export const mockEstoque: MockEstoqueRow[] = estoqueData as MockEstoqueRow[];

// =========================================================================
// Normalização de estoque: o STRALOG (operador logístico) pode demorar pra
// dar baixa depois que uma negociação já vendeu o produto — o app monitora
// isso comparando o que foi vendido desde a última importação com o que o
// proprio import ainda reporta. Enquanto o WMS não abater, mostramos
// "aguardando baixa no operador logístico" com a quantidade pendente, e
// usamos o estoque JÁ NORMALIZADO (bruto - pendente) para apontar ruptura
// nas próximas negociações — é a foto mais realista do que sobrou.
// =========================================================================
// Soma qtdFinal de negociações FATURADAS com data >= última importação de
// estoque — ou seja, vendas já faturadas que o STRALOG ainda não teve chance
// de abater. Só a partir do faturamento a venda vira baixa de estoque: uma
// negociação apenas "concluída" (acordo fechado, NF ainda não emitida) não
// reserva nem abate o estoque disponível para as próximas negociações.
// Canoniza o SKU do item (pode ter sido lançado com um código de entrada)
// pra não perder venda na contagem por causa do alias.
export function vendidoDesdeImportacao(sku: string): number {
  const referencia = parseData(mockEstoqueDataReferencia);
  let total = 0;
  for (const ticket of mockTickets) {
    if (ticket.status !== "faturada") continue;
    if (parseData(ticket.data) < referencia) continue;
    for (const item of ticket.itens) {
      const canonico = produtoCatalogo(item.sku)?.sku ?? item.sku;
      if (canonico === sku) total += item.qtdFinal;
    }
  }
  return total;
}

export interface EstoqueNormalizado {
  bruto: number;
  pendente: number;
  normalizado: number;
  aguardandoBaixa: boolean;
  // deficit > 0 significa que ja' provisionamos mais baixa do que o STRALOG
  // reporta disponivel - nao da' pra abater mais do que existe. Isso e' uma
  // ruptura confirmada (nao so' "aguardando baixa"): so' resolve com um novo
  // import de estoque mostrando reposicao.
  deficit: number;
  emRuptura: boolean;
}

export function estoqueNormalizadoDe(sku: string): EstoqueNormalizado {
  const bruto = mockEstoque.find((e) => e.sku === sku)?.quantidade ?? 0;
  const pendente = vendidoDesdeImportacao(sku);
  return {
    bruto,
    pendente,
    normalizado: Math.max(bruto - pendente, 0),
    aguardandoBaixa: pendente > 0,
    deficit: Math.max(pendente - bruto, 0),
    emRuptura: pendente > bruto,
  };
}
