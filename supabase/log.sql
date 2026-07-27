-- ============================================================
-- SUPERCOPA 1º DE MAIO 2026 — registro público de alterações
-- Rode DEPOIS de schema.sql. É idempotente.
--
-- Toda alteração feita por um administrador fica registrada com
-- quem fez, quando e o quê. O registro é PÚBLICO: qualquer pessoa
-- pode conferir o que a Comissão mexeu na competição.
--
-- O registro é IMUTÁVEL: existe policy de insert, mas não de
-- update nem de delete. Nem os administradores conseguem apagar
-- ou reescrever uma linha pela API — um histórico que se edita
-- não serve como histórico.
-- ============================================================

create table if not exists public.copa_log (
  id         text primary key,
  quando     timestamptz not null default now(),
  user_id    uuid,
  email      text,
  -- categoria da ação, para filtrar: 'jogo', 'time', 'jogador',
  -- 'disciplina', 'ajuste', 'pagamento', 'chave'
  categoria  text not null,
  -- frase pronta em português, já sem dado sensível
  descricao  text not null,
  alvo_id    text
);

create index if not exists copa_log_quando_idx on public.copa_log (quando desc);

alter table public.copa_log enable row level security;

-- leitura pública: é a razão de existir da tabela
drop policy if exists "ler copa_log" on public.copa_log;
create policy "ler copa_log" on public.copa_log for select using (true);

-- só admin escreve, e só consegue INSERIR
drop policy if exists "inserir copa_log" on public.copa_log;
create policy "inserir copa_log" on public.copa_log for insert
  with check (public.is_copa_admin());

-- Sem policy de update/delete de propósito: o histórico não se
-- altera. Se um dia for preciso corrigir uma linha, faça pelo SQL
-- Editor (service role) e registre o motivo.

-- O e-mail de quem fez a alteração é gravado pelo próprio app.
-- Este trigger garante que ninguém insira uma linha em nome de
-- outra pessoa: user_id sempre vira o do usuário autenticado.
create or replace function public.copa_log_carimba()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.quando  := now();
  return new;
end $$;

drop trigger if exists copa_log_carimba_trg on public.copa_log;
create trigger copa_log_carimba_trg before insert on public.copa_log
  for each row execute function public.copa_log_carimba();
