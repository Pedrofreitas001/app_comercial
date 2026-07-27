-- Sales Brain - versao resumida (branch teste-resumido)
-- Classificacao das notas de acompanhamento: categoria (que tipo de contato
-- foi) + destaque (o que nao pode passar batido). Sao dois eixos separados de
-- proposito: uma nota de 'problema' nao e' necessariamente a mais importante,
-- e um 'contato' pode ser o registro critico do cliente.

alter table cliente_notas
  add column if not exists categoria text not null default 'geral',
  add column if not exists importante boolean not null default false;

-- Lista fechada no banco pra nao entrar categoria digitada errada; espelha
-- NOTA_CATEGORIAS em src/lib/notas.ts.
alter table cliente_notas drop constraint if exists chk_cliente_notas_categoria;
alter table cliente_notas add constraint chk_cliente_notas_categoria check (
  categoria in ('geral', 'contato', 'proposta', 'pedido', 'problema', 'compromisso')
);

-- Busca tipica da tela: notas de um cliente, destaques primeiro.
create index if not exists idx_cliente_notas_destaque
  on cliente_notas(cliente_id, importante desc, created_at desc);
