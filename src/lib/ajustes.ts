/* =====================================================================
   MOTIVOS DE AJUSTE DE CLASSIFICAÇÃO
   ---------------------------------------------------------------------
   O regulamento estabelece UMA única penalidade em pontos: o Art. 31,
   invasão de campo relatada em súmula, que custa 3 pontos ao time (nas
   fases finais, vira W.O. ao adversário e por isso não passa por aqui).

   As demais sanções do regulamento não mexem na pontuação:
     Art. 13 §2º  atleta irregular  -> anula a partida, W.O. ao adversário
     Art. 18      time incompleto   -> W.O. e desclassificação
     Art. 24      W.O.              -> placar de 3x0, lançado no jogo
     Art. 25/29   cartão/agressão   -> suspensão de atleta
     Art. 28      inadimplência     -> exclusão da Copa
     Art. 32      briga generalizada-> desclassificação das duas equipes
     Art. 33      opressão          -> expulsão do atleta ou da equipe
   Nenhuma delas entra como ajuste de pontos — por isso a lista abaixo
   é curta. Inventar opções aqui seria inventar regra.
   ===================================================================== */

export type MotivoAjuste = {
  id: string;
  rotulo: string;
  /** Pontos fixados pelo regulamento. null = a Comissão define. */
  pontos: number | null;
  /** true quando o ajuste também mexe em jogos/gols, não só pontos. */
  campanha: boolean;
  ajuda: string;
};

export const MOTIVOS_AJUSTE: MotivoAjuste[] = [
  {
    id: "invasao",
    rotulo: "Invasão de campo (Art. 31)",
    pontos: -3,
    campanha: false,
    ajuda:
      "Invasão relatada pelo árbitro em súmula custa 3 pontos ao time. " +
      "Nas fases finais não é perda de pontos, e sim W.O. favorável ao " +
      "adversário — nesse caso lance o W.O. no próprio jogo.",
  },
  {
    id: "importacao",
    rotulo: "Importação de campanha já disputada",
    pontos: null,
    campanha: true,
    ajuda:
      "Use só para lançar em bloco rodadas já jogadas cujos placares " +
      "individuais ainda não foram cadastrados. Ao cadastrar os jogos, " +
      "apague este ajuste — senão a campanha conta duas vezes.",
  },
  {
    id: "outro",
    rotulo: "Outro — decisão da Comissão (Art. 38)",
    pontos: null,
    campanha: false,
    ajuda:
      "O Art. 38 dá à Comissão Organizadora a competência sobre casos " +
      "omissos. Descreva a decisão e a reunião em que foi tomada: este " +
      "ajuste aparece na classificação e no registro público.",
  },
];

export function motivoPorId(id: string): MotivoAjuste {
  return MOTIVOS_AJUSTE.find((m) => m.id === id) ?? MOTIVOS_AJUSTE[2];
}
