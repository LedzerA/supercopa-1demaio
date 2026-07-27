-- ============================================================
-- SUPERCOPA 1º DE MAIO 2026 — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto statsproleta.
--
-- Modelo de acesso:
--   • Qualquer visitante LÊ tudo (classificação, jogos, chaveamento).
--   • Só usuários listados em `copa_admins` podem ESCREVER.
--
-- >>> AMBIENTES SEPARADOS <<<
-- A permissão da SuperCopa é INDEPENDENTE da do app Proleta.
-- Ser admin em `admins` (statsproleta) NÃO dá nenhum acesso de
-- escrita aqui, e estar em `copa_admins` NÃO dá acesso ao Proleta.
-- As duas listas só compartilham o pool de contas (auth.users),
-- ou seja, o mesmo e-mail pode existir nos dois — mas cada tabela
-- precisa ser preenchida à mão, uma de cada vez.
--
-- Todas as tabelas usam o prefixo `copa_`. Nada do app Proleta é
-- lido, alterado ou referenciado por este arquivo.
-- ============================================================

-- ---------- admins DA COPA (lista própria) ----------
create table if not exists public.copa_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  email      text,
  regional_id text,                      -- opcional: a que regional responde
  created_at timestamptz not null default now()
);

-- security definer para não esbarrar no RLS da própria tabela
create or replace function public.is_copa_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.copa_admins where user_id = auth.uid());
$$;

-- ============================================================
-- TABELAS
-- ============================================================

-- ---------- regionais (Art. 6º — 3 grupos de 6 equipes) ----------
create table if not exists public.copa_regionais (
  id         text primary key,
  nome       text not null,              -- "Regional Adriana Albuquerque"
  regiao     text not null,              -- "Lapa / Zona Oeste"
  posicao    int  not null default 1,    -- ordem de exibição
  created_at timestamptz not null default now()
);

-- ---------- times (18 equipes) ----------
create table if not exists public.copa_times (
  id          text primary key,
  regional_id text not null references public.copa_regionais(id) on delete cascade,
  nome        text not null,
  apelido     text,                      -- nome curto para tabelas/chaveamento
  responsavel text,                      -- representante na Comissão (Art. 4º)
  contato     text,
  desistente  boolean not null default false,  -- abandonou a competição
  created_at  timestamptz not null default now()
);

-- ---------- jogos ----------
-- fase:  'regional'      → pontos corridos dentro da regional (5 rodadas)
--        'final_regional'→ FINAL OURO (1ºx2º), PRATA (3ºx4º), BRONZE (5ºx6º)
--        'lima_barreto'  → fase eliminatória entre regionais
-- serie: 'ouro' | 'prata' | 'bronze'   (null na fase regional)
-- etapa: 'repescagem' | 'semifinal' | 'final'  (só na Lima Barreto)
-- chave: 'J1'|'J2'|'J3'|'J4'|'FINAL'   (slot do chaveamento, Art. 6º)
--
-- Os confrontos das fases finais podem existir ANTES de se saber
-- quem joga: mandante_id/visitante_id ficam null e o rótulo do
-- confronto fica em mandante_slot/visitante_slot
-- (ex.: "3º melhor campeão", "VENCEDOR JOGO 1").
create table if not exists public.copa_jogos (
  id             text primary key,
  regional_id    text references public.copa_regionais(id) on delete cascade,
  fase           text not null default 'regional'
    check (fase in ('regional','final_regional','lima_barreto')),
  serie          text check (serie in ('ouro','prata','bronze')),
  etapa          text check (etapa in ('repescagem','semifinal','final')),
  chave          text,
  rodada         int,
  ordem          int not null default 0,

  mandante_id    text references public.copa_times(id) on delete set null,
  visitante_id   text references public.copa_times(id) on delete set null,
  mandante_slot  text,
  visitante_slot text,

  data           date,
  horario        text,
  local          text,

  status         text not null default 'agendado'
    check (status in ('agendado','encerrado','wo','adiado','anulado')),
  gols_mandante  int,
  gols_visitante int,
  -- Art. 24: o W.O. concede 3x0 à equipe vencedora.
  wo_favoravel   text check (wo_favoravel in ('mandante','visitante')),

  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists copa_jogos_regional_idx on public.copa_jogos (regional_id, rodada);
create index if not exists copa_jogos_fase_idx     on public.copa_jogos (fase, serie, etapa);

-- ---------- jogadores (Art. 13 — inscrição por FORMS) ----------
-- Art. 13 §3º: a lista fecha um dia antes do jogo da 3ª rodada e
-- vale para todos os jogos seguintes. `lista_fechada` no time
-- marca esse travamento.
create table if not exists public.copa_jogadores (
  id         text primary key,
  time_id    text not null references public.copa_times(id) on delete cascade,
  nome       text not null,
  documento  text,
  numero     int,
  inscrito_em date,
  created_at timestamptz not null default now()
);

create index if not exists copa_jogadores_time_idx on public.copa_jogadores (time_id);

alter table public.copa_times
  add column if not exists lista_fechada boolean not null default false;

-- ---------- cartões / ocorrências disciplinares ----------
-- tipo: 'amarelo'   → não suspende (Art. 25)
--       'vermelho'  → suspende 1 jogo (Art. 25)
--       'agressao'  → suspende 4 jogos (Art. 29)
--       'expulsao_copa' → fora da competição (Art. 30, 33)
create table if not exists public.copa_cartoes (
  id          text primary key,
  jogo_id     text references public.copa_jogos(id) on delete cascade,
  time_id     text not null references public.copa_times(id) on delete cascade,
  jogador_id  text references public.copa_jogadores(id) on delete set null,
  jogador_nome text,                     -- caso não esteja na lista ainda
  tipo        text not null
    check (tipo in ('amarelo','vermelho','agressao','expulsao_copa')),
  minuto      int,
  descricao   text,
  cumprido_em text[] not null default '{}',  -- ids dos jogos em que a suspensão já foi cumprida
  created_at  timestamptz not null default now()
);

create index if not exists copa_cartoes_time_idx on public.copa_cartoes (time_id);
create index if not exists copa_cartoes_jogo_idx on public.copa_cartoes (jogo_id);

-- ---------- ajustes de classificação ----------
-- Serve para dois casos reais:
--  (a) Art. 31 — invasão de campo: perda de 3 pontos.
--  (b) importar campanha acumulada quando os jogos individuais
--      ainda não foram registrados um a um (caso da Regional Carrão).
-- Os valores são SOMADOS ao que é calculado a partir dos jogos.
create table if not exists public.copa_ajustes (
  id         text primary key,
  time_id    text not null references public.copa_times(id) on delete cascade,
  jogos      int not null default 0,
  vitorias   int not null default 0,
  empates    int not null default 0,
  derrotas   int not null default 0,
  gols_pro   int not null default 0,
  gols_contra int not null default 0,
  pontos     int not null default 0,
  motivo     text not null,
  created_at timestamptz not null default now()
);

-- ---------- pagamentos (Art. 3º — R$ 300 em 3 parcelas) ----------
create table if not exists public.copa_pagamentos (
  id         text primary key,
  time_id    text not null references public.copa_times(id) on delete cascade,
  parcela    int  not null check (parcela between 1 and 3),
  valor      numeric(10,2) not null default 100,
  pago       boolean not null default false,
  pago_em    date,
  observacao text,
  created_at timestamptz not null default now(),
  unique (time_id, parcela)
);

-- ---------- ranking manual das fases finais ----------
-- O Art. 6º fala em "melhor campanha acumulada" sem definir os
-- critérios. O app calcula uma ordem sugerida, mas a Comissão
-- Organizadora pode fixar a ordem oficial aqui — quando existe
-- linha para a série, ela manda no chaveamento.
create table if not exists public.copa_ranking_final (
  id         text primary key,
  serie      text not null check (serie in ('ouro','prata','bronze')),
  papel      text not null check (papel in ('campeao','vice')),
  posicao    int  not null check (posicao between 1 and 3),
  time_id    text not null references public.copa_times(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (serie, papel, posicao)
);

-- ---------- updated_at automático em copa_jogos ----------
create or replace function public.copa_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists copa_jogos_touch on public.copa_jogos;
create trigger copa_jogos_touch before update on public.copa_jogos
  for each row execute function public.copa_touch_updated_at();

-- ============================================================
-- RLS — leitura pública, escrita só de admin
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'copa_regionais','copa_times','copa_jogos','copa_jogadores',
    'copa_cartoes','copa_ajustes','copa_pagamentos','copa_ranking_final'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "ler %1$s" on public.%1$I', t);
    execute format('create policy "ler %1$s" on public.%1$I for select using (true)', t);
    execute format('drop policy if exists "escrever %1$s" on public.%1$I', t);
    execute format(
      'create policy "escrever %1$s" on public.%1$I for all '
      'using (public.is_copa_admin()) with check (public.is_copa_admin())', t);
  end loop;
end $$;

-- copa_admins: cada um enxerga só a própria linha — é assim que o
-- app descobre se o usuário logado é admin DA COPA. A lista inteira
-- não é legível pela API pública. Inserções: só via SQL Editor.
alter table public.copa_admins enable row level security;
drop policy if exists "ler propria linha copa_admin" on public.copa_admins;
create policy "ler propria linha copa_admin" on public.copa_admins for select
  using (user_id = auth.uid());

-- ============================================================
-- COMO LIBERAR UM ADMIN DA COPA
-- ------------------------------------------------------------
-- 1) Authentication → Users → Add user (e-mail + senha), ou peça
--    para a pessoa se cadastrar.
-- 2) Rode, trocando o e-mail:
--
--    insert into public.copa_admins (user_id, nome, email)
--    select id, 'Nome da pessoa', email from auth.users
--    where email = 'fulano@exemplo.com'
--    on conflict (user_id) do nothing;
--
-- Para REVOGAR o acesso (sem apagar a conta):
--    delete from public.copa_admins
--    where user_id = (select id from auth.users where email = 'fulano@exemplo.com');
--
-- Conferir quem tem acesso hoje:
--    select nome, email, created_at from public.copa_admins order by created_at;
-- ============================================================
