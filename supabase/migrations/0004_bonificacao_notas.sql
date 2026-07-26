-- Sales Brain MVP1 - bonificacao itemizada (ticket-level) + notas
-- Rodar depois de 0001/0002/0003. Seguro mesmo com dados reais ja existentes
-- em negociacoes/itens_negociacao (o unico dado perdido e' o rascunho de
-- bonificacao por-item que nunca foi de fato usado pela UI).
--
-- Por que: a bonificacao no produto e' um acordo sobre o PEDIDO inteiro,
-- com uma lista propria de produtos (que pode incluir SKU diferente dos
-- itens vendidos) e uma unica data de pagamento/status - nao um campo por
-- item de itens_negociacao como o schema original modelou.

-- =========================================================================
-- negociacoes.codigo: codigo amigavel (ex.: NEG-2026-0149) que a UI usa em
-- todo lugar (tabelas, links, busca) e que o schema original nao tinha -
-- so existia como mock (proximoCodigoTicket() em mock-data.ts).
-- =========================================================================
create sequence if not exists negociacao_codigo_seq;
alter table negociacoes add column if not exists codigo text unique default (
  'NEG-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('negociacao_codigo_seq')::text, 4, '0')
);

-- =========================================================================
-- bonificacoes (1:1 com negociacao) + bonificacao_itens
-- =========================================================================
create table bonificacoes (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null unique references negociacoes(id) on delete cascade,
  data_pagamento date,
  paga boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bonificacao_itens (
  id uuid primary key default gen_random_uuid(),
  bonificacao_id uuid not null references bonificacoes(id) on delete cascade,
  produto_id uuid not null references produtos(id),
  qtd numeric not null check (qtd > 0),
  preco_base numeric(12,2) not null check (preco_base >= 0)
);
create index idx_bonificacao_itens_bonificacao on bonificacao_itens(bonificacao_id);

alter table bonificacoes enable row level security;
alter table bonificacao_itens enable row level security;

create policy bonificacoes_select on bonificacoes
  for select to authenticated using (public.can_view_negociacao(negociacao_id));

create policy bonificacoes_insert on bonificacoes
  for insert to authenticated with check (public.can_edit_negociacao(negociacao_id));

create policy bonificacoes_update on bonificacoes
  for update to authenticated
  using (public.can_edit_negociacao(negociacao_id))
  with check (public.can_edit_negociacao(negociacao_id));

create policy bonificacoes_delete on bonificacoes
  for delete to authenticated using (public.can_edit_negociacao(negociacao_id));

create policy bonificacao_itens_select on bonificacao_itens
  for select to authenticated
  using (exists (
    select 1 from bonificacoes b
    where b.id = bonificacao_id and public.can_view_negociacao(b.negociacao_id)
  ));

create policy bonificacao_itens_insert on bonificacao_itens
  for insert to authenticated
  with check (exists (
    select 1 from bonificacoes b
    where b.id = bonificacao_id and public.can_edit_negociacao(b.negociacao_id)
  ));

create policy bonificacao_itens_update on bonificacao_itens
  for update to authenticated
  using (exists (
    select 1 from bonificacoes b
    where b.id = bonificacao_id and public.can_edit_negociacao(b.negociacao_id)
  ))
  with check (exists (
    select 1 from bonificacoes b
    where b.id = bonificacao_id and public.can_edit_negociacao(b.negociacao_id)
  ));

create policy bonificacao_itens_delete on bonificacao_itens
  for delete to authenticated
  using (exists (
    select 1 from bonificacoes b
    where b.id = bonificacao_id and public.can_edit_negociacao(b.negociacao_id)
  ));

-- =========================================================================
-- itens_negociacao: remove os campos de bonificacao por-item, que a UI
-- nunca usou dessa forma (ver bonificacoes/bonificacao_itens acima).
-- A view precisa cair ANTES das colunas, porque depende delas.
-- =========================================================================
drop view if exists v_itens_negociacao_enriched;

alter table itens_negociacao drop constraint if exists chk_bonificada_leq_final;
alter table itens_negociacao drop column if exists qtd_bonificada;
alter table itens_negociacao drop column if exists preco_base_bonificacao;
alter table itens_negociacao drop column if exists data_pagamento_bonificacao;
alter table itens_negociacao drop column if exists bonificacao_paga;

-- Recria a view sem essas colunas.
create view v_itens_negociacao_enriched with (security_invoker = true) as
select
  i.id,
  i.negociacao_id,
  n.data as data_negociacao,
  date_trunc('month', n.data)::date as mes_referencia,
  n.status as negociacao_status,
  n.nf_numero,
  n.vendedor_id,
  uv.nome_completo as vendedor_nome,
  n.cliente_id,
  c.codigo_cliente,
  c.nome as cliente_nome,
  c.rede as cliente_rede,
  c.canal as cliente_canal,
  c.cidade as cliente_cidade,
  c.estado as cliente_estado,
  p.id as produto_id,
  p.sku,
  p.descricao as produto_descricao,
  p.categoria,
  p.marca,
  p.linha,
  i.qtd_negociada_v1,
  i.qtd_final,
  i.estoque_disponivel,
  i.catalogo_data,
  i.preco_negociado,
  i.preco_tabela,
  i.desconto_pct,
  i.motivo_codigo,
  mp.label as motivo_label,
  i.demanda_perdida,
  i.valor_perdido,
  i.observacoes,
  i.created_at
from itens_negociacao i
join negociacoes n on n.id = i.negociacao_id
join clientes c on c.id = n.cliente_id
join usuarios uv on uv.id = n.vendedor_id
join produtos p on p.id = i.produto_id
left join motivos_perda mp on mp.codigo = i.motivo_codigo;

-- =========================================================================
-- notas: acompanhamento da negociacao (ligacao, decisao do cliente, etc).
-- So insercao pela UI - sem edicao/remocao de nota antiga (registro
-- historico, tipo timeline).
-- =========================================================================
create table notas (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null references negociacoes(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  texto text not null,
  created_at timestamptz not null default now()
);
create index idx_notas_negociacao on notas(negociacao_id);

alter table notas enable row level security;

create policy notas_select on notas
  for select to authenticated using (public.can_view_negociacao(negociacao_id));

create policy notas_insert on notas
  for insert to authenticated with check (public.can_edit_negociacao(negociacao_id));
