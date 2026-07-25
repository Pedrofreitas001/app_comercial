-- Sales Brain MVP1 - Row Level Security
-- Rodar depois de 0001_schema.sql.

alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table produtos enable row level security;
alter table estoque enable row level security;
alter table estoque_lotes_raw enable row level security;
alter table import_batches enable row level security;
alter table motivos_perda enable row level security;
alter table negociacoes enable row level security;
alter table itens_negociacao enable row level security;
alter table arquivos enable row level security;

-- =========================================================================
-- Helper functions (security definer para poder ler usuarios.role sem
-- depender de policy circular; stable para poder ser usada em policies)
-- =========================================================================
create or replace function public.current_role_sb()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from usuarios where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role_sb() = 'admin';
$$;

create or replace function public.is_gerente_or_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role_sb() in ('admin', 'gerente');
$$;

-- Visibilidade: admin/gerente/leitura veem tudo; vendedor so o que criou.
create or replace function public.can_view_negociacao(neg_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from negociacoes n
    where n.id = neg_id
      and (
        public.current_role_sb() in ('admin', 'gerente', 'leitura')
        or n.vendedor_id = auth.uid()
      )
  );
$$;

-- Edicao: admin/gerente sempre; vendedor so o que criou; leitura nunca.
create or replace function public.can_edit_negociacao(neg_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from negociacoes n
    where n.id = neg_id
      and (
        public.is_gerente_or_admin()
        or n.vendedor_id = auth.uid()
      )
  );
$$;

-- =========================================================================
-- usuarios
-- =========================================================================
create policy usuarios_select_all on usuarios
  for select to authenticated using (true);

create policy usuarios_insert_admin on usuarios
  for insert to authenticated with check (public.is_admin());

create policy usuarios_update_admin on usuarios
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy usuarios_delete_admin on usuarios
  for delete to authenticated using (public.is_admin());

-- =========================================================================
-- clientes (leitura liberada a todos autenticados - vendedor precisa achar
-- qualquer cliente para negociar; escrita so admin/gerente; sem delete fisico)
-- =========================================================================
create policy clientes_select_all on clientes
  for select to authenticated using (true);

create policy clientes_insert on clientes
  for insert to authenticated with check (public.is_gerente_or_admin());

create policy clientes_update on clientes
  for update to authenticated using (public.is_gerente_or_admin()) with check (public.is_gerente_or_admin());

-- =========================================================================
-- produtos (mesmo padrao de clientes)
-- =========================================================================
create policy produtos_select_all on produtos
  for select to authenticated using (true);

create policy produtos_insert on produtos
  for insert to authenticated with check (public.is_gerente_or_admin());

create policy produtos_update on produtos
  for update to authenticated using (public.is_gerente_or_admin()) with check (public.is_gerente_or_admin());

-- =========================================================================
-- estoque: leitura liberada; ZERO policies de insert/update/delete para o
-- role authenticated (nem admin) - a unica escrita e via Route Handler
-- server-side usando a service_role key, que bypassa RLS por design.
-- =========================================================================
create policy estoque_select_all on estoque
  for select to authenticated using (true);

-- =========================================================================
-- estoque_lotes_raw: dado de auditoria, visivel so a admin/gerente; sem
-- escrita via role authenticated (mesmo motivo do estoque acima).
-- =========================================================================
create policy estoque_raw_select on estoque_lotes_raw
  for select to authenticated using (public.is_gerente_or_admin());

-- =========================================================================
-- import_batches
-- =========================================================================
create policy import_batches_select on import_batches
  for select to authenticated using (public.is_gerente_or_admin());

create policy import_batches_insert on import_batches
  for insert to authenticated with check (public.is_admin());

-- =========================================================================
-- motivos_perda: leitura liberada a todos; escrita so admin (Configuracoes)
-- =========================================================================
create policy motivos_select_all on motivos_perda
  for select to authenticated using (true);

create policy motivos_insert_admin on motivos_perda
  for insert to authenticated with check (public.is_admin());

create policy motivos_update_admin on motivos_perda
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy motivos_delete_admin on motivos_perda
  for delete to authenticated using (public.is_admin());

-- =========================================================================
-- negociacoes: vendedor ve/edita so as proprias (owner); gerente/admin/leitura
-- veem tudo; leitura nunca escreve; delete fisico so admin (preferir status
-- 'cancelada' na UI).
-- =========================================================================
create policy negociacoes_select on negociacoes
  for select to authenticated
  using (
    public.current_role_sb() in ('admin', 'gerente', 'leitura')
    or vendedor_id = auth.uid()
  );

create policy negociacoes_insert on negociacoes
  for insert to authenticated
  with check (
    public.is_gerente_or_admin()
    or (public.current_role_sb() = 'vendedor' and vendedor_id = auth.uid())
  );

create policy negociacoes_update on negociacoes
  for update to authenticated
  using (
    public.is_gerente_or_admin()
    or (public.current_role_sb() = 'vendedor' and vendedor_id = auth.uid())
  )
  with check (
    public.is_gerente_or_admin()
    or (public.current_role_sb() = 'vendedor' and vendedor_id = auth.uid())
  );

create policy negociacoes_delete_admin on negociacoes
  for delete to authenticated using (public.is_admin());

-- =========================================================================
-- itens_negociacao: herda visibilidade/edicao da negociacao pai
-- =========================================================================
create policy itens_select on itens_negociacao
  for select to authenticated using (public.can_view_negociacao(negociacao_id));

create policy itens_insert on itens_negociacao
  for insert to authenticated with check (public.can_edit_negociacao(negociacao_id));

create policy itens_update on itens_negociacao
  for update to authenticated
  using (public.can_edit_negociacao(negociacao_id))
  with check (public.can_edit_negociacao(negociacao_id));

create policy itens_delete on itens_negociacao
  for delete to authenticated using (public.can_edit_negociacao(negociacao_id));

-- =========================================================================
-- arquivos: mesmo padrao de itens_negociacao
-- =========================================================================
create policy arquivos_select on arquivos
  for select to authenticated using (public.can_view_negociacao(negociacao_id));

create policy arquivos_insert on arquivos
  for insert to authenticated with check (public.can_edit_negociacao(negociacao_id));

create policy arquivos_delete on arquivos
  for delete to authenticated using (public.can_edit_negociacao(negociacao_id));

-- =========================================================================
-- Storage: bucket de anexos das negociacoes.
-- Convencao de path: "{negociacao_id}/{nome_arquivo}" (negociacao_id e o
-- primeiro segmento do path, por isso storage.foldername(name)[1]).
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('negociacao-arquivos', 'negociacao-arquivos', false)
on conflict (id) do nothing;

create policy storage_negociacao_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'negociacao-arquivos'
    and public.can_view_negociacao((storage.foldername(name))[1]::uuid)
  );

create policy storage_negociacao_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'negociacao-arquivos'
    and public.can_edit_negociacao((storage.foldername(name))[1]::uuid)
  );

create policy storage_negociacao_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'negociacao-arquivos'
    and public.can_edit_negociacao((storage.foldername(name))[1]::uuid)
  );
