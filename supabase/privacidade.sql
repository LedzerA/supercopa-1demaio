-- ============================================================
-- SUPERCOPA 1º DE MAIO 2026 — restrição dos dados sensíveis
-- Rode DEPOIS de schema.sql. É idempotente.
--
-- O site é público. Sem este arquivo, qualquer visitante lê todas
-- as tabelas — inclusive os relatos de súmula, que podem nomear
-- pessoas acusadas de agressão (Art. 29) ou de ofensa racista,
-- machista, xenofóbica, homofóbica, lesbofóbica ou transfóbica
-- (Art. 33), e os telefones dos representantes.
--
-- Depois deste arquivo:
--   PÚBLICO  vê classificação, jogos, chaveamento, elencos e a
--            situação financeira das equipes.
--   ADMIN    vê, além disso, os cartões com o relato da súmula e
--            os contatos dos representantes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Contatos saem de copa_times para uma tabela própria.
--    O RLS é por LINHA, não por coluna: não dá para esconder só
--    a coluna `contato` de quem lê a tabela. Então ela vira uma
--    tabela separada, com policy própria.
--    O nome do representante (Art. 4º) continua público — é
--    função pública na Comissão; o telefone, não.
-- ------------------------------------------------------------
create table if not exists public.copa_contatos (
  time_id    text primary key references public.copa_times(id) on delete cascade,
  contato    text,
  updated_at timestamptz not null default now()
);

-- preserva o que já tiver sido preenchido antes desta migração
do $$
begin
  if exists (select from information_schema.columns
             where table_schema = 'public' and table_name = 'copa_times'
               and column_name = 'contato') then
    insert into public.copa_contatos (time_id, contato)
    select id, contato from public.copa_times
    where contato is not null and btrim(contato) <> ''
    on conflict (time_id) do nothing;

    alter table public.copa_times drop column contato;
  end if;
end $$;

alter table public.copa_contatos enable row level security;
drop policy if exists "ler copa_contatos" on public.copa_contatos;
create policy "ler copa_contatos" on public.copa_contatos for select
  using (public.is_copa_admin());
drop policy if exists "escrever copa_contatos" on public.copa_contatos;
create policy "escrever copa_contatos" on public.copa_contatos for all
  using (public.is_copa_admin()) with check (public.is_copa_admin());

-- ------------------------------------------------------------
-- 2. Cartões: leitura só de admin.
--    Substitui a policy de leitura pública criada no schema.sql.
-- ------------------------------------------------------------
drop policy if exists "ler copa_cartoes" on public.copa_cartoes;
create policy "ler copa_cartoes" on public.copa_cartoes for select
  using (public.is_copa_admin());

-- ------------------------------------------------------------
-- 3. ...mas o placar de vermelhos continua público.
--    O Art. 9º usa "cartões vermelhos" como 4º critério de
--    desempate. Se o público não enxergasse esse número, a
--    classificação exibida no site ordenaria diferente da que a
--    Comissão vê — o que seria pior do que o problema original.
--
--    Esta view expõe SÓ a contagem por time. Nada de nome de
--    jogador, nada de relato de súmula.
--
--    A view roda com os privilégios do dono (comportamento padrão
--    do Postgres), então ela enxerga copa_cartoes apesar da policy
--    acima. É intencional: é justamente o que permite publicar o
--    número sem publicar o conteúdo.
-- ------------------------------------------------------------
drop view if exists public.copa_vermelhos;
create view public.copa_vermelhos as
select
  time_id,
  count(*)::int as vermelhos
from public.copa_cartoes
where tipo in ('vermelho', 'agressao')
group by time_id;

grant select on public.copa_vermelhos to anon, authenticated;

-- ------------------------------------------------------------
-- Conferência rápida (rode deslogado, no SQL Editor não vale —
-- lá você é service role e enxerga tudo):
--
--   select * from copa_vermelhos;   -- deve funcionar sempre
--   select * from copa_cartoes;     -- vazio para quem não é admin
--   select * from copa_contatos;    -- vazio para quem não é admin
-- ------------------------------------------------------------
