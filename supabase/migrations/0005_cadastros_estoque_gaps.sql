-- Sales Brain MVP1 - ajustes de schema encontrados ao ligar os dados reais
-- (base_cliente.xlsx, DIM_V1.xlsx, export STRALOG). Rodar depois de 0004.
-- Seguro: tabelas ainda vazias de dados reais nesta fase.

-- =========================================================================
-- clientes: nome_resumido - nome curto editavel pelo admin, pra nao estourar
-- a UI com a razao social inteira (campo que a tela de Cadastros usa).
-- =========================================================================
alter table clientes add column if not exists nome_resumido text;

-- =========================================================================
-- produtos.sku_entrada precisa ser lista: dos 441 produtos reais (DIM_V1),
-- 94 tem mais de um codigo de entrada do WMS mapeando pro mesmo SKU de
-- venda (sku_saida). Uma coluna text unica perderia esses aliases.
-- =========================================================================
alter table produtos drop column if exists sku_entrada;
alter table produtos add column sku_entrada text[];
drop index if exists idx_produtos_sku_entrada;
create index idx_produtos_sku_entrada on produtos using gin (sku_entrada);

-- =========================================================================
-- estoque: campos de exibicao que a tela de Estoque usa (unidade de medida
-- e vencimento do lote mais proximo) e que a versao "limpa" da tabela ainda
-- nao tinha - hoje calculados na agregacao por SKU do export STRALOG; no
-- futuro o wizard de import por lote (estoque_lotes_raw) preenche os dois.
-- =========================================================================
alter table estoque add column if not exists unidade text;
alter table estoque add column if not exists vencimento_proximo date;

-- v_estoque_normalizado: adiciona os dois campos acima e os indicadores de
-- ruptura confirmada (deficit/em_ruptura) que a tela de Estoque usa - so'
-- pode ANEXAR colunas no final (create or replace view nao deixa reordenar
-- as que ja existem).
create or replace view v_estoque_normalizado with (security_invoker = true) as
select
  ea.produto_id,
  ea.sku_entrada,
  ea.data_referencia,
  ea.quantidade_disponivel as bruto,
  coalesce(pendente.qtd, 0) as pendente,
  greatest(ea.quantidade_disponivel - coalesce(pendente.qtd, 0), 0) as normalizado,
  coalesce(pendente.qtd, 0) > 0 as aguardando_baixa,
  ea.unidade,
  ea.vencimento_proximo,
  greatest(coalesce(pendente.qtd, 0) - ea.quantidade_disponivel, 0) as deficit,
  coalesce(pendente.qtd, 0) > ea.quantidade_disponivel as em_ruptura
from v_estoque_atual ea
left join lateral (
  select sum(i.qtd_final) as qtd
  from itens_negociacao i
  join negociacoes n on n.id = i.negociacao_id
  where i.produto_id = ea.produto_id
    and n.status = 'faturada'
    and n.data >= ea.data_referencia
) pendente on true;
