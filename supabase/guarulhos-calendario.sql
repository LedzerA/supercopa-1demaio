-- ============================================================
-- REGIONAL MAGALI BATISTA (Guarulhos) — calendário oficial
-- Informado pela organização em 27/07/2026.
-- Rode no SQL Editor. É idempotente.
--
--   3ª rodada — 01/08/2026, sábado
--       Sevira    x Família    12h
--       Havana    x Palestino  14h
--       Libertários x TGFC     (W.O., já lançado)
--
--   4ª rodada — 16/08/2026, domingo
--       Havana      x Família  12h
--       Libertários x Sevira   14h
--       Palestino   x TGFC     (W.O., já lançado)
--
--   5ª rodada — data a definir
--       Havana      x Sevira
--       Libertários x Palestino
--       Família     x TGFC     (W.O., já lançado)
--
-- Além das datas, isto corrige duas coisas que estavam erradas no
-- seed inicial, quando a divisão por rodada ainda não era conhecida:
--   1. os mandantes de 4 confrontos estavam invertidos;
--   2. três W.O. do TGFC estavam todos na 3ª rodada. Com o
--      calendário oficial fica claro que o TGFC tinha um jogo por
--      rodada, então dois deles vão para a 4ª e a 5ª.
-- Nenhum placar é alterado: a classificação não muda.
-- ============================================================

-- ---------- 3ª rodada ----------
update public.copa_jogos set
  rodada = 3, ordem = 1,
  mandante_id = 't-sevira', visitante_id = 't-familia',
  data = '2026-08-01', horario = '12:00'
where id = 'j-gua-5-1';

update public.copa_jogos set
  rodada = 3, ordem = 2,
  mandante_id = 't-havana', visitante_id = 't-palestino',
  data = '2026-08-01', horario = '14:00'
where id = 'j-gua-4-2';

-- Libertários x TGFC já está na 3ª rodada (W.O.)
update public.copa_jogos set ordem = 3 where id = 'j-gua-3-1';

-- ---------- 4ª rodada ----------
update public.copa_jogos set
  rodada = 4, ordem = 1,
  mandante_id = 't-havana', visitante_id = 't-familia',
  data = '2026-08-16', horario = '12:00'
where id = 'j-gua-4-1';

update public.copa_jogos set
  rodada = 4, ordem = 2,
  mandante_id = 't-libertarios', visitante_id = 't-sevira',
  data = '2026-08-16', horario = '14:00'
where id = 'j-gua-5-3';

-- Palestino x TGFC (W.O.) passa da 3ª para a 4ª rodada
update public.copa_jogos set rodada = 4, ordem = 3 where id = 'j-gua-3-2';

-- ---------- 5ª rodada ----------
update public.copa_jogos set
  rodada = 5, ordem = 1,
  mandante_id = 't-havana', visitante_id = 't-sevira'
where id = 'j-gua-5-2';

update public.copa_jogos set
  rodada = 5, ordem = 2,
  mandante_id = 't-libertarios', visitante_id = 't-palestino'
where id = 'j-gua-4-3';

-- Família x TGFC (W.O.) passa da 3ª para a 5ª rodada
update public.copa_jogos set rodada = 5, ordem = 3 where id = 'j-gua-3-3';

-- ---------- registro público ----------
-- Só roda se a tabela de log já existir (supabase/log.sql).
do $$
begin
  if to_regclass('public.copa_log') is not null then
    insert into public.copa_log (id, email, categoria, descricao)
    values
      ('lg-gua-cal-1', 'organizacao', 'jogo',
       'marcou Sevira x Familia para 01/08/2026 as 12h (3a rodada, Guarulhos)'),
      ('lg-gua-cal-2', 'organizacao', 'jogo',
       'marcou Havana x Palestino para 01/08/2026 as 14h (3a rodada, Guarulhos)'),
      ('lg-gua-cal-3', 'organizacao', 'jogo',
       'marcou Havana x Familia para 16/08/2026 as 12h (4a rodada, Guarulhos)'),
      ('lg-gua-cal-4', 'organizacao', 'jogo',
       'marcou Libertarios x Sevira para 16/08/2026 as 14h (4a rodada, Guarulhos)'),
      ('lg-gua-cal-5', 'organizacao', 'jogo',
       'organizou as rodadas 3, 4 e 5 da Regional Magali Batista conforme calendario oficial')
    on conflict (id) do nothing;
  end if;
end $$;

-- ---------- conferência ----------
-- Deve listar 15 jogos, 3 por rodada, do 1 ao 5:
--
-- select j.rodada, j.ordem,
--        m.apelido as mandante, v.apelido as visitante,
--        j.data, j.horario, j.status
-- from public.copa_jogos j
-- left join public.copa_times m on m.id = j.mandante_id
-- left join public.copa_times v on v.id = j.visitante_id
-- where j.regional_id = 'r-guarulhos' and j.fase = 'regional'
-- order by j.rodada, j.ordem;
