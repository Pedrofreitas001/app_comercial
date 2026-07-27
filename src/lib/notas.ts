// Categorias das notas de acompanhamento. Lista fechada, espelhada pela
// constraint chk_cliente_notas_categoria (migration 0008) — mexer aqui exige
// mexer lá também.
export type NotaCategoria = "geral" | "contato" | "proposta" | "pedido" | "problema" | "compromisso";

export interface CategoriaConfig {
  value: NotaCategoria;
  label: string;
  descricao: string;
  /** Classe do badge na timeline. */
  className: string;
}

export const NOTA_CATEGORIAS: CategoriaConfig[] = [
  {
    value: "geral",
    label: "Geral",
    descricao: "Contexto solto, sem classificação específica",
    className: "bg-muted text-muted-foreground",
  },
  {
    value: "contato",
    label: "Contato",
    descricao: "Ligação, visita, WhatsApp",
    className: "bg-primary/10 text-primary",
  },
  {
    value: "proposta",
    label: "Proposta",
    descricao: "Preço, condição, negociação em andamento",
    className: "bg-chart-3/15 text-chart-3",
  },
  {
    value: "pedido",
    label: "Pedido",
    descricao: "Pedido fechado ou faturamento",
    className: "bg-success/15 text-success",
  },
  {
    value: "problema",
    label: "Problema",
    descricao: "Reclamação, atraso, ruptura",
    className: "bg-destructive/10 text-destructive",
  },
  {
    value: "compromisso",
    label: "Compromisso",
    descricao: "Combinado com data — retornar, enviar, cobrar",
    className: "bg-warning/15 text-warning",
  },
];

const POR_VALUE = new Map(NOTA_CATEGORIAS.map((c) => [c.value, c]));

export function categoriaConfig(valor: string): CategoriaConfig {
  return POR_VALUE.get(valor as NotaCategoria) ?? NOTA_CATEGORIAS[0];
}
