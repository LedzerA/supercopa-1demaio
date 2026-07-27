-- ============================================================
-- LIBERAR ADMINISTRADORES DA SUPERCOPA
-- ------------------------------------------------------------
-- Rode no SQL Editor do Supabase, DEPOIS de schema.sql.
--
-- IMPORTANTE: a conta precisa existir antes. No painel do
-- Supabase: Authentication -> Users -> Add user (e-mail + senha),
-- ou peça para a pessoa se cadastrar. Só então rode este arquivo.
--
-- Esta lista é EXCLUSIVA da SuperCopa. Ninguém aqui ganha acesso
-- ao statsproleta, e nenhum admin do statsproleta entra aqui.
-- ============================================================

-- ---------- 1. Leandro Braga ----------
do $$
declare
  v_email text := 'leandrobraga100@gmail.com';
  v_nome  text := 'Leandro Braga';
  v_id    uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(v_email);

  if v_id is null then
    raise exception
      'A conta % ainda nao existe. Crie em Authentication -> Users -> Add user e rode este arquivo de novo.',
      v_email;
  end if;

  insert into public.copa_admins (user_id, nome, email)
  values (v_id, v_nome, v_email)
  on conflict (user_id) do update
    set nome = excluded.nome, email = excluded.email;

  raise notice 'Admin liberado: % (%)', v_nome, v_email;
end $$;


-- ---------- 2. Demais admins ----------
-- Copie o bloco acima, troque v_email e v_nome, e rode de novo.
-- Um bloco por pessoa. Exemplo:
--
-- do $$
-- declare
--   v_email text := 'fulano@exemplo.com';
--   v_nome  text := 'Fulano de Tal';
--   v_id    uuid;
-- begin
--   select id into v_id from auth.users where lower(email) = lower(v_email);
--   if v_id is null then
--     raise exception 'A conta % ainda nao existe.', v_email;
--   end if;
--   insert into public.copa_admins (user_id, nome, email)
--   values (v_id, v_nome, v_email)
--   on conflict (user_id) do update
--     set nome = excluded.nome, email = excluded.email;
--   raise notice 'Admin liberado: %', v_email;
-- end $$;


-- ---------- conferir quem tem acesso hoje ----------
-- select nome, email, created_at from public.copa_admins order by created_at;

-- ---------- revogar acesso (sem apagar a conta) ----------
-- delete from public.copa_admins
-- where user_id = (select id from auth.users
--                  where lower(email) = lower('fulano@exemplo.com'));
