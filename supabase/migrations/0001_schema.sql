-- Sales Brain MVP1 - schema inicial
-- Rodar manualmente no SQL editor do Supabase Studio, nesta ordem: 0001 -> 0002 -> 0003.
-- (Sem Docker/CLI local nesta maquina; migrations ficam versionadas no git mesmo assim.)

create extension if not exists "pgcrypto";

-- =========================================================================
-- usuarios (perfil 1:1 com auth.users)
-- =========================================================================
create type user_role as enum ('admin', 'gerente', 'vendedor', 'leitura');

create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  email text not null,
  role user_role not null default 'vendedor',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cria automaticamente o perfil em usuarios quando um novo auth.users e criado.
-- Perfil comeca como 'vendedor' por seguranca; admin promove depois.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, nome_completo, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_completo', new.email), new.email, 'vendedor');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- clientes
-- =========================================================================
create table clientes (
  id uuid primary key default gen_random_uuid(),
  codigo_cliente text not null,
  nome text not null,
  nome_fantasia text,
  rede text,
  canal text,
  cidade text,
  estado text,
  cnpj text,
  tabela_preco text,
  tipo_frete text,
  -- texto bruto da planilha de origem, mantido para auditoria
  vendedor_nome_origem text,
  gerente_nome_origem text,
  -- resolvido manualmente na tela de reconciliacao; informativo, nao usado em RLS
  vendedor_id uuid references usuarios(id),
  status text not null default 'ativo',
  observacoes text,
  import_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clientes_codigo on clientes(codigo_cliente);
create index idx_clientes_vendedor on clientes(vendedor_id);

-- =========================================================================
-- produtos
-- =========================================================================
create table produtos (
  id uuid primary key default gen_random_uuid(),
  -- SKU_saida da planilha DIM_V1: codigo de venda canonico, referenciado pelas negociacoes
  sku text not null unique,
  -- SKU_Entrada da planilha DIM_V1: codigo usado pelo WMS STRALOG no export de estoque
  sku_entrada text,
  descricao text not null,
  categoria text,
  linha text,
  -- sem fonte na base DIM_V1 original; nulo ate ser preenchido manualmente
  marca text,
  preco numeric(12,2),
  status text not null default 'ativo',
  import_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_produtos_sku_entrada on produtos(sku_entrada);

-- =========================================================================
-- precos_tabela (base de preco de tabela, versionada)
-- Para o catalogo de SKUs (origem STRALOG/DIM) os precos sao inseridos e
-- versionados: alterar preco cria uma nova versao com vigencia, mantendo o
-- historico. O preco vigente de um SKU e a versao com vigencia_fim nula.
-- O item da negociacao continua guardando SEU proprio snapshot
-- (preco_tabela/preco_negociado) - a foto do momento negociado nao muda
-- quando a tabela e reajustada depois.
-- =========================================================================
create table precos_tabela (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id),
  preco numeric(12,2) not null check (preco >= 0),
  versao integer not null default 1,
  vigencia_inicio date not null default current_date,
  vigencia_fim date,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now(),
  unique (produto_id, versao)
);
create index idx_precos_tabela_vigente on precos_tabela(produto_id) where vigencia_fim is null;

create view v_preco_tabela_vigente with (security_invoker = true) as
select distinct on (produto_id)
  produto_id, preco, versao, vigencia_inicio
from precos_tabela
where vigencia_fim is null
order by produto_id, versao desc;

-- =========================================================================
-- import_batches (auditoria de cada upload manual)
-- =========================================================================
create type import_tipo as enum ('estoque', 'clientes', 'produtos');
create type import_status as enum ('em_andamento', 'concluido', 'erro');

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  tipo import_tipo not null,
  arquivo_nome text not null,
  iniciado_por uuid references usuarios(id),
  status import_status not null default 'em_andamento',
  linhas_totais integer,
  linhas_importadas integer,
  linhas_erro integer,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz
);

-- =========================================================================
-- estoque_lotes_raw (staging: espelha a aba "Original" do export STRALOG, por lote)
-- =========================================================================
create table estoque_lotes_raw (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id),
  dia date,
  depositante text,
  cnpj text,
  ie text,
  codigo text,
  produto text,
  lote_industria text,
  data_vencimento date,
  status text,
  motivo text,
  aguardando_cobertura text,
  nf_origem text,
  nf_cobertura text,
  valor_unitario_medio numeric(12,2),
  valor_estoque numeric(14,2),
  quantidade_disponivel numeric,
  unidade text,
  entrada date,
  created_at timestamptz not null default now()
);
create index idx_estoque_raw_batch on estoque_lotes_raw(import_batch_id);
create index idx_estoque_raw_codigo on estoque_lotes_raw(codigo);

-- =========================================================================
-- estoque (visao limpa, por produto por data de referencia)
-- Cada import gera um novo lote datado (serie temporal); "estoque atual" =
-- MAX(data_referencia) por produto, exposto pela view v_estoque_atual.
-- =========================================================================
create table estoque (
  id uuid primary key default gen_random_uuid(),
  -- nulo quando o sku_entrada do export nao bate com nenhum produto cadastrado
  -- (sinalizado para o admin corrigir no wizard de import)
  produto_id uuid references produtos(id),
  sku_entrada text not null,
  quantidade_disponivel numeric not null default 0,
  data_referencia date not null,
  origem text not null default 'stralog_import',
  import_batch_id uuid references import_batches(id),
  ultima_atualizacao timestamptz not null default now()
);
create index idx_estoque_produto_data on estoque(produto_id, data_referencia desc);
create unique index uq_estoque_sku_data on estoque(sku_entrada, data_referencia);

create view v_estoque_atual with (security_invoker = true) as
select distinct on (e.sku_entrada)
  e.*
from estoque e
order by e.sku_entrada, e.data_referencia desc;

-- Normalizacao de estoque: o STRALOG (operador logistico) pode demorar pra
-- dar baixa depois que uma negociacao ja foi FATURADA. Esta view soma o
-- qtd_final de negociacoes faturadas com data >= a data da ultima importacao
-- daquele SKU - ou seja, vendas ja faturadas que o WMS ainda nao teve chance
-- de abater - e usa isso para "aguardar baixa" e mostrar um estoque
-- normalizado (bruto - pendente) mais realista do que sobrou de fato.
-- So a partir do faturamento a venda reserva/abate estoque: uma negociacao
-- apenas "concluida" (acordo fechado, NF ainda nao emitida) nao impacta.
create view v_estoque_normalizado with (security_invoker = true) as
select
  ea.produto_id,
  ea.sku_entrada,
  ea.data_referencia,
  ea.quantidade_disponivel as bruto,
  coalesce(pendente.qtd, 0) as pendente,
  greatest(ea.quantidade_disponivel - coalesce(pendente.qtd, 0), 0) as normalizado,
  coalesce(pendente.qtd, 0) > 0 as aguardando_baixa
from v_estoque_atual ea
left join lateral (
  select sum(i.qtd_final) as qtd
  from itens_negociacao i
  join negociacoes n on n.id = i.negociacao_id
  where i.produto_id = ea.produto_id
    and n.status = 'faturada'
    and n.data >= ea.data_referencia
) pendente on true;

-- =========================================================================
-- motivos_perda (lookup, gerenciavel em Configuracoes - nao e enum fixo)
-- =========================================================================
create table motivos_perda (
  codigo text primary key,
  label text not null,
  ativo boolean not null default true,
  ordem integer not null default 0
);

-- =========================================================================
-- negociacoes
-- =========================================================================
-- 'faturada' = NF emitida no ERP; e' o unico status que impacta o estoque
-- (ver v_estoque_normalizado). 'concluida' e' so o acordo comercial fechado.
create type negociacao_status as enum ('rascunho', 'em_andamento', 'concluida', 'faturada', 'cancelada');

create table negociacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  -- dono da negociacao para fins de RLS (carteira = quem criou, nao o vendedor do cadastro do cliente)
  vendedor_id uuid not null references usuarios(id),
  data date not null default current_date,
  status negociacao_status not null default 'rascunho',
  -- nota fiscal vinculada ao pedido (preenchida depois do faturamento no ERP)
  nf_numero text,
  observacoes text,
  created_by uuid references usuarios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_negociacoes_vendedor on negociacoes(vendedor_id);
create index idx_negociacoes_cliente on negociacoes(cliente_id);
create index idx_negociacoes_data on negociacoes(data);

-- =========================================================================
-- itens_negociacao
-- =========================================================================
create table itens_negociacao (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null references negociacoes(id) on delete cascade,
  produto_id uuid not null references produtos(id),
  -- V1 = acordo original; final = o que ficou depois de ajuste por ruptura/motivo.
  qtd_negociada_v1 numeric not null check (qtd_negociada_v1 >= 0),
  qtd_final numeric not null check (qtd_final >= 0),
  -- subconjunto de qtd_final dado sem custo (bonificacao), mesmo SKU/linha
  qtd_bonificada numeric not null default 0 check (qtd_bonificada >= 0),
  -- snapshot do estoque no momento em que o item foi adicionado a negociacao
  estoque_disponivel numeric not null default 0,
  -- data da foto do catalogo STRALOG de onde o vendedor escolheu o SKU
  catalogo_data date,
  -- input manual do vendedor por item, pre-preenchido do catalogo quando existir
  preco_negociado numeric(12,2) not null check (preco_negociado >= 0),
  -- snapshot do preco de catalogo no momento da negociacao (para calcular desconto)
  preco_tabela numeric(12,2),
  motivo_codigo text references motivos_perda(codigo),
  -- Administracao da bonificacao acordada no item:
  -- preco unitario usado para valorar a bonificacao (nulo = usa preco_negociado)
  preco_base_bonificacao numeric(12,2),
  -- data prevista de pagamento/entrega da bonificacao, por item
  data_pagamento_bonificacao date,
  -- marcada como paga/entregue pela administracao comercial
  bonificacao_paga boolean not null default false,
  observacoes text,
  -- Regra de negocio confirmada: so conta como demanda/valor perdido quando
  -- o motivo for especificamente "sem_estoque". Outros motivos (substituicao,
  -- preco, desistencia etc) ficam com a diferenca de quantidade visivel no
  -- item, mas nao entram na metrica oficial de ruptura.
  demanda_perdida numeric generated always as (
    case when motivo_codigo = 'sem_estoque'
      then greatest(qtd_negociada_v1 - qtd_final, 0)
      else 0
    end
  ) stored,
  valor_perdido numeric generated always as (
    case when motivo_codigo = 'sem_estoque'
      then greatest(qtd_negociada_v1 - qtd_final, 0) * preco_negociado
      else 0
    end
  ) stored,
  -- desconto calculado automaticamente a partir do preco de tabela snapshotado
  desconto_pct numeric generated always as (
    case when preco_tabela is not null and preco_tabela > 0
      then round((1 - preco_negociado / preco_tabela) * 100, 2)
      else null
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_bonificada_leq_final check (qtd_bonificada <= qtd_final),
  -- divergencia entre V1 e final exige motivo justificando
  constraint chk_motivo_quando_divergencia check (
    qtd_negociada_v1 = qtd_final or motivo_codigo is not null
  )
);
create index idx_itens_negociacao on itens_negociacao(negociacao_id);
create index idx_itens_produto on itens_negociacao(produto_id);
create index idx_itens_demanda_perdida on itens_negociacao(demanda_perdida) where demanda_perdida > 0;

-- =========================================================================
-- arquivos
-- Convencao de path no Storage: bucket "negociacao-arquivos", objeto em
-- "{negociacao_id}/{nome_arquivo}" (ver policies em 0002_rls.sql).
-- =========================================================================
create table arquivos (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null references negociacoes(id) on delete cascade,
  nome text not null,
  tipo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  usuario_id uuid references usuarios(id),
  data timestamptz not null default now()
);
create index idx_arquivos_negociacao on arquivos(negociacao_id);

-- =========================================================================
-- view: v_itens_negociacao_enriched
-- Fonte unica usada por Dashboard, Rupturas e Relatorios - garante que os
-- tres nunca mostrem numeros diferentes.
-- =========================================================================
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
  c.nome as cliente_nome,
  c.rede as cliente_rede,
  c.canal as cliente_canal,
  p.id as produto_id,
  p.sku,
  p.descricao as produto_descricao,
  p.categoria,
  p.marca,
  p.linha,
  i.qtd_negociada_v1,
  i.qtd_final,
  i.qtd_bonificada,
  i.estoque_disponivel,
  i.catalogo_data,
  i.preco_negociado,
  i.preco_tabela,
  i.desconto_pct,
  i.motivo_codigo,
  mp.label as motivo_label,
  i.preco_base_bonificacao,
  i.data_pagamento_bonificacao,
  i.bonificacao_paga,
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
