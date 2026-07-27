-- ============================================================
-- SUPERCOPA 1º DE MAIO 2026 — dados iniciais
-- Rode DEPOIS de schema.sql. Pode rodar mais de uma vez:
-- todos os inserts usam `on conflict do nothing`, então nada
-- que você já editou pelo site é sobrescrito.
--
-- Origem dos dados: "Regional Adriana Albuquerque.txt".
-- Onde o txt estava incompleto, há um comentário CONFERIR.
-- ============================================================

-- ---------- regionais ----------
insert into public.copa_regionais (id, nome, regiao, posicao) values
  ('r-lapa',      'Regional Adriana Albuquerque', 'Lapa / Zona Oeste',  1),
  ('r-guarulhos', 'Regional Magali Batista',      'Guarulhos',          2),
  ('r-carrao',    'Regional Mateus Azevedo',      'Carrão / Zona Leste',3)
on conflict (id) do nothing;

-- ---------- times ----------
insert into public.copa_times (id, regional_id, nome, apelido, desistente) values
  -- Regional Adriana Albuquerque (Lapa / Zona Oeste)
  ('t-brasil',      'r-lapa',      'Brasil',                 'Brasil',      false),
  ('t-formigueiro', 'r-lapa',      'Formigueiro',            'Formigueiro', false),
  ('t-suburbio',    'r-lapa',      'Subúrbio Geral',         'Subúrbio',    false),
  ('t-futanta',     'r-lapa',      'Futantã',                'Futantã',     false),
  ('t-bnh',         'r-lapa',      'Academia BNH',           'BNH',         false),
  ('t-uniaolapa',   'r-lapa',      'União Lapa',             'União Lapa',  false),
  -- Regional Magali Batista (Guarulhos)
  ('t-familia',     'r-guarulhos', 'Família',                'Família',     false),
  ('t-havana',      'r-guarulhos', 'Havana',                 'Havana',      false),
  ('t-palestino',   'r-guarulhos', 'Palestino',              'Palestino',   false),
  ('t-sevira',      'r-guarulhos', 'Sevira FC',              'Sevira',      false),
  ('t-libertarios', 'r-guarulhos', 'Libertários',            'Libertários', false),
  -- TGFC abandonou a competição (confirmado pela organização): os 5
  -- jogos entraram como W.O. 3x0 ao adversário (Art. 24).
  ('t-tgfc',        'r-guarulhos', 'TGFC',                   'TGFC',        true),
  -- Regional Mateus Azevedo (Carrão / Zona Leste)
  ('t-codigoverde', 'r-carrao',    'Código Verde',           'Código Verde',false),
  ('t-proleta',     'r-carrao',    'Proletariado Alviverde', 'Proleta',     false),
  ('t-tap',         'r-carrao',    'TAP',                    'TAP',         false),
  ('t-corote',      'r-carrao',    'Corote & Molotov',       'Corote',      false),
  ('t-rayo',        'r-carrao',    'Rayo Proletário',        'Rayo',        false),
  ('t-sodevirada',  'r-carrao',    'Só de Virada',           'Só de Virada',false)
on conflict (id) do nothing;

-- ============================================================
-- REGIONAL ADRIANA ALBUQUERQUE (Lapa) — 15 jogos, 5 rodadas
-- ============================================================
insert into public.copa_jogos
  (id, regional_id, fase, rodada, ordem, mandante_id, visitante_id,
   status, gols_mandante, gols_visitante, observacoes) values
  -- 1ª rodada
  ('j-lapa-1-1','r-lapa','regional',1,1,'t-suburbio','t-bnh',            'encerrado',2,1,null),
  ('j-lapa-1-2','r-lapa','regional',1,2,'t-futanta','t-formigueiro',     'encerrado',0,3,null),
  ('j-lapa-1-3','r-lapa','regional',1,3,'t-brasil','t-uniaolapa',        'encerrado',11,0,null),
  -- 2ª rodada
  ('j-lapa-2-1','r-lapa','regional',2,1,'t-formigueiro','t-suburbio',    'encerrado',9,2,null),
  ('j-lapa-2-2','r-lapa','regional',2,2,'t-uniaolapa','t-futanta',       'agendado',null,null,'Jogo atrasado da 2ª rodada'),
  ('j-lapa-2-3','r-lapa','regional',2,3,'t-bnh','t-brasil',              'encerrado',0,8,null),
  -- 3ª rodada
  ('j-lapa-3-1','r-lapa','regional',3,1,'t-suburbio','t-uniaolapa',      'encerrado',3,1,null),
  -- CONFERIR: placar deduzido da classificação do txt (Formigueiro
  -- 3j GP15 GC4 e BNH 3j GP3 GC13 só fecham com Formigueiro 3x2 BNH).
  ('j-lapa-3-2','r-lapa','regional',3,2,'t-formigueiro','t-bnh',         'encerrado',3,2,'CONFERIR placar — deduzido da classificação'),
  ('j-lapa-3-3','r-lapa','regional',3,3,'t-brasil','t-futanta',          'encerrado',3,2,null),
  -- 4ª rodada
  ('j-lapa-4-1','r-lapa','regional',4,1,'t-suburbio','t-futanta',        'agendado',null,null,null),
  ('j-lapa-4-2','r-lapa','regional',4,2,'t-brasil','t-formigueiro',      'agendado',null,null,null),
  ('j-lapa-4-3','r-lapa','regional',4,3,'t-uniaolapa','t-bnh',           'agendado',null,null,null),
  -- 5ª rodada
  ('j-lapa-5-1','r-lapa','regional',5,1,'t-suburbio','t-brasil',         'agendado',null,null,null),
  ('j-lapa-5-2','r-lapa','regional',5,2,'t-formigueiro','t-uniaolapa',   'agendado',null,null,null),
  ('j-lapa-5-3','r-lapa','regional',5,3,'t-futanta','t-bnh',             'agendado',null,null,null)
on conflict (id) do nothing;

-- ============================================================
-- REGIONAL MAGALI BATISTA (Guarulhos) — 15 jogos
-- Os 5 jogos do TGFC entraram como W.O. (3x0, Art. 24).
-- ============================================================
insert into public.copa_jogos
  (id, regional_id, fase, rodada, ordem, mandante_id, visitante_id,
   status, gols_mandante, gols_visitante, wo_favoravel, observacoes) values
  -- 1ª rodada
  ('j-gua-1-1','r-guarulhos','regional',1,1,'t-familia','t-palestino',   'encerrado',3,1,null,null),
  ('j-gua-1-2','r-guarulhos','regional',1,2,'t-sevira','t-tgfc',         'wo',3,0,'mandante','W.O. — TGFC abandonou a competição'),
  ('j-gua-1-3','r-guarulhos','regional',1,3,'t-havana','t-libertarios',  'encerrado',2,0,null,null),
  -- 2ª rodada
  ('j-gua-2-1','r-guarulhos','regional',2,1,'t-havana','t-tgfc',         'wo',3,0,'mandante','W.O. — TGFC abandonou a competição'),
  ('j-gua-2-2','r-guarulhos','regional',2,2,'t-palestino','t-sevira',    'encerrado',2,0,null,null),
  ('j-gua-2-3','r-guarulhos','regional',2,3,'t-familia','t-libertarios', 'encerrado',2,0,null,null),
  -- 3ª rodada
  ('j-gua-3-1','r-guarulhos','regional',3,1,'t-libertarios','t-tgfc',    'wo',3,0,'mandante','W.O. — TGFC abandonou a competição'),
  ('j-gua-3-2','r-guarulhos','regional',3,2,'t-palestino','t-tgfc',      'wo',3,0,'mandante','W.O. — TGFC abandonou a competição'),
  ('j-gua-3-3','r-guarulhos','regional',3,3,'t-familia','t-tgfc',        'wo',3,0,'mandante','W.O. — TGFC abandonou a competição'),
  -- rodadas 4 e 5 (a definir os pares exatos por rodada)
  ('j-gua-4-1','r-guarulhos','regional',4,1,'t-familia','t-havana',      'agendado',null,null,null,null),
  ('j-gua-4-2','r-guarulhos','regional',4,2,'t-havana','t-palestino',    'agendado',null,null,null,null),
  ('j-gua-4-3','r-guarulhos','regional',4,3,'t-palestino','t-libertarios','agendado',null,null,null,null),
  ('j-gua-5-1','r-guarulhos','regional',5,1,'t-familia','t-sevira',      'agendado',null,null,null,null),
  ('j-gua-5-2','r-guarulhos','regional',5,2,'t-havana','t-sevira',       'agendado',null,null,null,null),
  ('j-gua-5-3','r-guarulhos','regional',5,3,'t-sevira','t-libertarios',  'agendado',null,null,null,null)
on conflict (id) do nothing;

-- CONFERIR (Havana): a classificação do txt traz GP 6 / GC 1, mas os
-- jogos listados somam 5 gols pró e 0 contra. Os JOGOS são a fonte da
-- verdade do site — corrija o placar no site quando confirmar qual
-- dos dois está certo.

-- ============================================================
-- REGIONAL MATEUS AZEVEDO (Carrão) — 15 jogos, 5 rodadas
-- Placares das rodadas 1 a 4 informados pela organização.
-- Conferidos contra a classificação divulgada: os 6 times batem
-- em pontos, vitórias, empates, derrotas, gols pró e gols contra.
-- ============================================================
insert into public.copa_jogos
  (id, regional_id, fase, rodada, ordem, mandante_id, visitante_id,
   status, gols_mandante, gols_visitante) values
  -- 1ª rodada
  ('j-car-1-1','r-carrao','regional',1,1,'t-tap','t-corote',              'encerrado',1,1),
  ('j-car-1-2','r-carrao','regional',1,2,'t-codigoverde','t-proleta',     'encerrado',0,0),
  ('j-car-1-3','r-carrao','regional',1,3,'t-sodevirada','t-rayo',         'encerrado',2,2),
  -- 2ª rodada
  ('j-car-2-1','r-carrao','regional',2,1,'t-sodevirada','t-tap',          'encerrado',0,3),
  ('j-car-2-2','r-carrao','regional',2,2,'t-corote','t-proleta',          'encerrado',1,1),
  ('j-car-2-3','r-carrao','regional',2,3,'t-rayo','t-codigoverde',        'encerrado',1,3),
  -- 3ª rodada
  ('j-car-3-1','r-carrao','regional',3,1,'t-rayo','t-corote',             'encerrado',1,4),
  ('j-car-3-2','r-carrao','regional',3,2,'t-tap','t-proleta',             'encerrado',0,1),
  ('j-car-3-3','r-carrao','regional',3,3,'t-sodevirada','t-codigoverde',  'encerrado',1,5),
  -- 4ª rodada
  ('j-car-4-1','r-carrao','regional',4,1,'t-proleta','t-sodevirada',      'encerrado',3,0),
  ('j-car-4-2','r-carrao','regional',4,2,'t-tap','t-rayo',                'encerrado',5,4),
  ('j-car-4-3','r-carrao','regional',4,3,'t-codigoverde','t-corote',      'encerrado',0,0),
  -- 5ª e última rodada da fase regional
  ('j-car-5-1','r-carrao','regional',5,1,'t-proleta','t-rayo',            'agendado',null,null),
  ('j-car-5-2','r-carrao','regional',5,2,'t-sodevirada','t-corote',       'agendado',null,null),
  ('j-car-5-3','r-carrao','regional',5,3,'t-tap','t-codigoverde',         'agendado',null,null)
on conflict (id) do nothing;

-- Os ajustes de campanha do Carrão existiram enquanto os placares
-- individuais não eram conhecidos. Agora que os 12 jogos estão
-- cadastrados, eles contariam a campanha DUAS vezes.
delete from public.copa_ajustes where id like 'aj-car-%';

-- ============================================================
-- FINAIS DA FASE REGIONAL (Art. 6º)
-- Ouro 1ºx2º, Prata 3ºx4º, Bronze 5ºx6º — em cada regional.
-- Entram sem times definidos; o site preenche a partir da
-- classificação assim que a regional termina.
-- ============================================================
insert into public.copa_jogos
  (id, regional_id, fase, serie, ordem, mandante_slot, visitante_slot, status)
select
  'j-fin-' || r.id || '-' || s.serie,
  r.id, 'final_regional', s.serie, s.ordem,
  s.casa, s.fora, 'agendado'
from public.copa_regionais r
cross join (values
  ('ouro',  1, '1º colocado', '2º colocado'),
  ('prata', 2, '3º colocado', '4º colocado'),
  ('bronze',3, '5º colocado', '6º colocado')
) as s(serie, ordem, casa, fora)
on conflict (id) do nothing;

-- ============================================================
-- FASE LIMA BARRETO (Art. 6º)
-- Mesmo chaveamento nas três séries:
--   J1  3º melhor campeão   x 3º melhor vice
--   J2  1º melhor vice      x 2º melhor vice
--   J3  1º melhor campeão   x VENCEDOR JOGO 1   (semifinal)
--   J4  2º melhor campeão   x VENCEDOR JOGO 2   (semifinal)
--   FINAL  VENCEDOR J3      x VENCEDOR J4
-- ============================================================
insert into public.copa_jogos
  (id, fase, serie, etapa, chave, ordem, mandante_slot, visitante_slot, status)
select
  'j-lb-' || s.serie || '-' || c.chave,
  'lima_barreto', s.serie, c.etapa, c.chave, c.ordem,
  c.casa, c.fora, 'agendado'
from (values ('ouro'),('prata'),('bronze')) as s(serie)
cross join (values
  ('repescagem','J1',   1, '3º melhor campeão', '3º melhor vice-campeão'),
  ('repescagem','J2',   2, '1º melhor vice-campeão', '2º melhor vice-campeão'),
  ('semifinal', 'J3',   3, '1º melhor campeão', 'VENCEDOR JOGO 1'),
  ('semifinal', 'J4',   4, '2º melhor campeão', 'VENCEDOR JOGO 2'),
  ('final',     'FINAL',5, 'VENCEDOR JOGO 3',   'VENCEDOR JOGO 4')
) as c(etapa, chave, ordem, casa, fora)
on conflict (id) do nothing;

-- ============================================================
-- PAGAMENTOS (Art. 3º) — R$ 300 por equipe em 3 parcelas de R$ 100,
-- recolhidas nos três primeiros jogos da fase regional.
-- ============================================================
insert into public.copa_pagamentos (id, time_id, parcela, valor)
select 'pg-' || t.id || '-' || p.parcela, t.id, p.parcela, 100
from public.copa_times t
cross join (values (1),(2),(3)) as p(parcela)
on conflict (id) do nothing;
