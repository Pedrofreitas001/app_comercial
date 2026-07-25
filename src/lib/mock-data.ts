// Dados fictícios só para validar visualmente o design antes do Supabase
// estar configurado. Substituídos por dados reais nas próximas etapas.

export const mockKpis = {
  demandaPerdidaReais: 187_420,
  demandaPerdidaUnidades: 3_842,
  negociacoesHoje: 14,
  clientesAtendidos: 9,
  skusAfetados: 22,
  valorPotencialPerdido: 264_900,
};

export const mockDemandaPorMes = [
  { mes: "Fev", valor: 21400 },
  { mes: "Mar", valor: 28900 },
  { mes: "Abr", valor: 19800 },
  { mes: "Mai", valor: 34200 },
  { mes: "Jun", valor: 41100 },
  { mes: "Jul", valor: 39700 },
];

export const mockTopSkus = [
  { sku: "D82399", descricao: "DIVINE POWER DOSE - AMPOLA 13ML", valor: 24800 },
  { sku: "DC82169", descricao: "DIVINE POWER DOSE CONDITIONING 13ML", valor: 18650 },
  { sku: "C82071", descricao: "CRONOGRAMA CAPILAR COLOR", valor: 15300 },
  { sku: "A55012", descricao: "AMPOLA DE TRATAMENTO INTENSIVO", valor: 11200 },
  { sku: "B90044", descricao: "MASCARA RECONSTRUCAO PROFUNDA", valor: 9400 },
];

export const mockTopClientes = [
  { nome: "MAKIBELLA COSMETICOS SHOP LTDA", valor: 32100 },
  { nome: "STUDIO FERNANDA MAGALHAES HAIR", valor: 21800 },
  { nome: "BEAUTY SUPPLY COSMETICS", valor: 19500 },
  { nome: "SALAO VIP HAIR DESIGN", valor: 14200 },
  { nome: "DROGARIA CENTRAL COSMETICOS", valor: 10900 },
];

export const mockTopVendedores = [
  { nome: "Andre Benah", valor: 41200 },
  { nome: "Camila Rocha", valor: 33500 },
  { nome: "Paulo Menezes", valor: 27900 },
];

export const mockDistribuicaoMotivo = [
  { motivo: "Sem estoque", valor: 62 },
  { motivo: "Substituição de SKU", valor: 15 },
  { motivo: "Cliente desistiu", valor: 10 },
  { motivo: "Preço", valor: 8 },
  { motivo: "Campanha encerrada", valor: 3 },
  { motivo: "Outro", valor: 2 },
];

export const mockNegociacoesRecentes = [
  {
    cliente: "MAKIBELLA COSMETICOS SHOP LTDA",
    vendedor: "Andre Benah",
    data: "24/07/2026",
    valorPerdido: 4820,
    status: "concluida" as const,
  },
  {
    cliente: "STUDIO FERNANDA MAGALHAES HAIR",
    vendedor: "Camila Rocha",
    data: "24/07/2026",
    valorPerdido: 0,
    status: "concluida" as const,
  },
  {
    cliente: "BEAUTY SUPPLY COSMETICS",
    vendedor: "Paulo Menezes",
    data: "23/07/2026",
    valorPerdido: 2150,
    status: "em_andamento" as const,
  },
  {
    cliente: "SALAO VIP HAIR DESIGN",
    vendedor: "Andre Benah",
    data: "23/07/2026",
    valorPerdido: 980,
    status: "concluida" as const,
  },
  {
    cliente: "DROGARIA CENTRAL COSMETICOS",
    vendedor: "Camila Rocha",
    data: "22/07/2026",
    valorPerdido: 0,
    status: "rascunho" as const,
  },
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
