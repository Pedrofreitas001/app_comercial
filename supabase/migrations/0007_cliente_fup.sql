-- Sales Brain - versao resumida (branch teste-resumido)
-- FUP por CLIENTE: em vez de negociacoes ao longo do tempo, cada cliente tem
-- uma unica timeline de acompanhamento (notas por data) e seus arquivos.
--
-- Migration ADITIVA de proposito: cria tabelas novas em vez de mexer nas de
-- negociacao, para que este branch possa rodar no mesmo projeto Supabase que
-- o main sem quebrar nenhum dos dois.

-- =========================================================================
-- cliente_notas: timeline de acompanhamento do cliente (FUP).
-- Só insercao pela UI - nota antiga nao se edita nem apaga (registro
-- historico), mesma regra da timeline de negociacao no main.
-- =========================================================================
create table if not exists cliente_notas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  texto text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cliente_notas_cliente on cliente_notas(cliente_id, created_at desc);

-- =========================================================================
-- cliente_arquivos
-- Convencao de path no Storage: bucket "cliente-arquivos", objeto em
-- "{cliente_id}/{nome_arquivo}" (as policies usam foldername(name)[1]).
-- =========================================================================
create table if not exists cliente_arquivos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  nome text not null,
  tipo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  usuario_id uuid references usuarios(id),
  data timestamptz not null default now()
);
create index if not exists idx_cliente_arquivos_cliente on cliente_arquivos(cliente_id, data desc);

alter table cliente_notas enable row level security;
alter table cliente_arquivos enable row level security;

-- Leitura liberada a todos autenticados: nesta versao o cliente e' visivel
-- pra equipe toda (a base de clientes ja e', ver clientes_select_all).
-- Escrita: qualquer perfil menos 'leitura'.
create policy cliente_notas_select on cliente_notas
  for select to authenticated using (true);

create policy cliente_notas_insert on cliente_notas
  for insert to authenticated
  with check (public.current_role_sb() <> 'leitura' and usuario_id = auth.uid());

create policy cliente_arquivos_select on cliente_arquivos
  for select to authenticated using (true);

create policy cliente_arquivos_insert on cliente_arquivos
  for insert to authenticated
  with check (public.current_role_sb() <> 'leitura' and usuario_id = auth.uid());

-- Remover arquivo: quem anexou, ou admin/gerente.
create policy cliente_arquivos_delete on cliente_arquivos
  for delete to authenticated
  using (usuario_id = auth.uid() or public.is_gerente_or_admin());

-- =========================================================================
-- Storage: bucket dos anexos de cliente.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('cliente-arquivos', 'cliente-arquivos', false)
on conflict (id) do nothing;

create policy storage_cliente_select on storage.objects
  for select to authenticated
  using (bucket_id = 'cliente-arquivos');

create policy storage_cliente_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cliente-arquivos' and public.current_role_sb() <> 'leitura');

create policy storage_cliente_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'cliente-arquivos' and public.current_role_sb() <> 'leitura');
