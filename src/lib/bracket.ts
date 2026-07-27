/* =====================================================================
   FASES FINAIS — Art. 6º do regulamento
   ---------------------------------------------------------------------
   FASE REGIONAL, em cada uma das 3 regionais:
     FINAL OURO   = 1º x 2º colocados
     FINAL PRATA  = 3º x 4º colocados
     FINAL BRONZE = 5º x 6º colocados

   FASE LIMA BARRETO, em cada série (ouro / prata / bronze):
     6 equipes: os 3 campeões e os 3 vice-campeões das finais
     regionais daquela série. Os 2 campeões de melhor campanha
     acumulada vão direto à semifinal; os outros 4 fazem a
     repescagem.

       J1     3º melhor campeão      x 3º melhor vice-campeão
       J2     1º melhor vice-campeão x 2º melhor vice-campeão
       J3     1º melhor campeão      x VENCEDOR JOGO 1
       J4     2º melhor campeão      x VENCEDOR JOGO 2
       FINAL  VENCEDOR JOGO 3        x VENCEDOR JOGO 4

   O regulamento não define os critérios de "melhor campanha
   acumulada". O app sugere pontos > vitórias > saldo > gols feitos
   (mesma lógica do Art. 9º) somando fase regional + final regional,
   mas a Comissão Organizadora pode fixar a ordem oficial na tela
   da Fase Lima Barreto — a ordem fixada sempre prevalece.
   ===================================================================== */
import { classificacao, placar } from "./standings";
import type {
  Ajuste,
  Cartao,
  Jogo,
  LinhaTabela,
  RankingFinal,
  Regional,
  Serie,
  Time,
} from "./types";

export const SERIES: Serie[] = ["ouro", "prata", "bronze"];

export const ROTULO_SERIE: Record<Serie, string> = {
  ouro: "Série Ouro",
  prata: "Série Prata",
  bronze: "Série Bronze",
};

/** Posições da tabela que disputam a final de cada série. */
export const POSICOES_FINAL: Record<Serie, [number, number]> = {
  ouro: [1, 2],
  prata: [3, 4],
  bronze: [5, 6],
};

/** Vencedor e perdedor de um jogo já decidido. */
export function decisao(j: Jogo | undefined): {
  vencedor: string | null;
  perdedor: string | null;
} {
  const vazio = { vencedor: null, perdedor: null };
  if (!j || !j.mandante_id || !j.visitante_id) return vazio;
  const p = placar(j);
  if (!p || p.casa === p.fora) return vazio; // empate não decide mata-mata
  return p.casa > p.fora
    ? { vencedor: j.mandante_id, perdedor: j.visitante_id }
    : { vencedor: j.visitante_id, perdedor: j.mandante_id };
}

/** Campanha acumulada de cada time (fase regional + final regional). */
export function campanhas(
  times: Time[],
  jogos: Jogo[],
  cartoes: Cartao[],
  ajustes: Ajuste[]
): Map<string, LinhaTabela> {
  const linhas = classificacao(times, jogos, cartoes, ajustes, {
    fases: ["regional", "final_regional"],
  });
  return new Map(linhas.map((l) => [l.time.id, l]));
}

/** Ordena por campanha: pontos > vitórias > saldo > gols feitos. */
export function porCampanha(
  ids: string[],
  campanha: Map<string, LinhaTabela>
): string[] {
  return [...ids].sort((a, b) => {
    const la = campanha.get(a);
    const lb = campanha.get(b);
    if (!la || !lb) return 0;
    return (
      lb.pontos - la.pontos ||
      lb.vitorias - la.vitorias ||
      lb.saldo - la.saldo ||
      lb.gols_pro - la.gols_pro
    );
  });
}

export type ClassificadosSerie = {
  serie: Serie;
  /** Campeões em ordem: [1º melhor, 2º melhor, 3º melhor]. */
  campeoes: (string | null)[];
  /** Vice-campeões em ordem: [1º melhor, 2º melhor, 3º melhor]. */
  vices: (string | null)[];
  /** true quando a ordem veio de copa_ranking_final (fixada à mão). */
  manual: boolean;
  /** Regionais cuja final da série ainda não foi decidida. */
  pendentes: string[];
};

/**
 * Quem se classificou para a Lima Barreto numa série, já ordenado
 * por campanha (ou pela ordem fixada pela Comissão).
 */
export function classificadosSerie(
  serie: Serie,
  regionais: Regional[],
  times: Time[],
  jogos: Jogo[],
  campanha: Map<string, LinhaTabela>,
  ranking: RankingFinal[]
): ClassificadosSerie {
  const fixado = ranking.filter((r) => r.serie === serie);
  const pegarFixado = (papel: "campeao" | "vice") =>
    [1, 2, 3].map(
      (pos) =>
        fixado.find((r) => r.papel === papel && r.posicao === pos)?.time_id ??
        null
    );

  const campeoes: string[] = [];
  const vices: string[] = [];
  const pendentes: string[] = [];

  for (const r of regionais) {
    const final = jogos.find(
      (j) =>
        j.fase === "final_regional" &&
        j.serie === serie &&
        j.regional_id === r.id
    );
    const { vencedor, perdedor } = decisao(final);
    if (vencedor && perdedor) {
      campeoes.push(vencedor);
      vices.push(perdedor);
    } else {
      pendentes.push(r.nome);
    }
  }

  const temFixado = fixado.length > 0;
  const times_ = new Set(times.map((t) => t.id));
  const valido = (id: string | null) => (id && times_.has(id) ? id : null);

  return {
    serie,
    campeoes: temFixado
      ? pegarFixado("campeao").map(valido)
      : preencher(porCampanha(campeoes, campanha)),
    vices: temFixado
      ? pegarFixado("vice").map(valido)
      : preencher(porCampanha(vices, campanha)),
    manual: temFixado,
    pendentes,
  };
}

function preencher(ids: string[]): (string | null)[] {
  return [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null];
}

export type ConfrontoChave = {
  chave: string;
  etapa: "repescagem" | "semifinal" | "final";
  rotulo: string;
  casaSlot: string;
  foraSlot: string;
  casa: string | null;
  fora: string | null;
};

/**
 * Resolve os 5 confrontos da série, propagando os vencedores da
 * repescagem para as semifinais e das semifinais para a final.
 */
export function montarChave(
  serie: Serie,
  cls: ClassificadosSerie,
  jogos: Jogo[]
): ConfrontoChave[] {
  const jogoDe = (chave: string) =>
    jogos.find(
      (j) => j.fase === "lima_barreto" && j.serie === serie && j.chave === chave
    );
  const vencedorDe = (chave: string) => decisao(jogoDe(chave)).vencedor;

  const [c1, c2, c3] = cls.campeoes;
  const [v1, v2, v3] = cls.vices;

  return [
    {
      chave: "J1",
      etapa: "repescagem",
      rotulo: "Jogo 1 — Repescagem",
      casaSlot: "3º melhor campeão",
      foraSlot: "3º melhor vice-campeão",
      casa: c3,
      fora: v3,
    },
    {
      chave: "J2",
      etapa: "repescagem",
      rotulo: "Jogo 2 — Repescagem",
      casaSlot: "1º melhor vice-campeão",
      foraSlot: "2º melhor vice-campeão",
      casa: v1,
      fora: v2,
    },
    {
      chave: "J3",
      etapa: "semifinal",
      rotulo: "Jogo 3 — Semifinal",
      casaSlot: "1º melhor campeão",
      foraSlot: "Vencedor do Jogo 1",
      casa: c1,
      fora: vencedorDe("J1"),
    },
    {
      chave: "J4",
      etapa: "semifinal",
      rotulo: "Jogo 4 — Semifinal",
      casaSlot: "2º melhor campeão",
      foraSlot: "Vencedor do Jogo 2",
      casa: c2,
      fora: vencedorDe("J2"),
    },
    {
      chave: "FINAL",
      etapa: "final",
      rotulo: `Final — ${ROTULO_SERIE[serie]}`,
      casaSlot: "Vencedor do Jogo 3",
      foraSlot: "Vencedor do Jogo 4",
      casa: vencedorDe("J3"),
      fora: vencedorDe("J4"),
    },
  ];
}
