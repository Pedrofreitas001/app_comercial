-- Sales Brain MVP1 - seed de dados fixos
-- Rodar depois de 0001_schema.sql e 0002_rls.sql.

insert into motivos_perda (codigo, label, ordem) values
  ('sem_estoque', 'Sem estoque', 1),
  ('substituicao_sku', 'Substituição de SKU', 2),
  ('cliente_desistiu', 'Cliente desistiu', 3),
  ('preco', 'Preço', 4),
  ('campanha_encerrada', 'Campanha encerrada', 5),
  ('outro', 'Outro', 6)
on conflict (codigo) do nothing;

-- =========================================================================
-- Primeiro admin (passo manual, uma unica vez):
-- 1. Crie o usuario em Authentication > Users > Add user (email + senha).
-- 2. Copie o UUID gerado e rode:
--    update usuarios set role = 'admin' where id = 'COLE-O-UUID-AQUI';
-- O trigger on_auth_user_created ja insere a linha em "usuarios" como
-- 'vendedor' por padrao (seguranca) - esse update so promove esse primeiro
-- usuario a admin. A partir dai, o admin cria/gerencia os demais pela UI.
-- =========================================================================
