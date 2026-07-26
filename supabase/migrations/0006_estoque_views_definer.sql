-- Sales Brain MVP1 - v_estoque_atual/v_estoque_normalizado tem que ver TODAS
-- as negociacoes faturadas da empresa, nao so as que o usuario logado pode
-- ver. RLS de negociacoes/itens_negociacao restringe vendedor a carteira
-- propria (regra de negocio correta para as telas de negociacao) - mas
-- estoque e' um recurso fisico compartilhado: se essas views ficarem
-- "security_invoker", um vendedor veria ruptura/pendente SUBESTIMADOS
-- (so contando as proprias negociacoes faturadas, nao as de todo mundo).
--
-- alter view ... set (security_invoker = false) e' suficiente - nao precisa
-- dropar/recriar a view.
alter view v_estoque_atual set (security_invoker = false);
alter view v_estoque_normalizado set (security_invoker = false);
