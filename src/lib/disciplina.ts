/* =====================================================================
   DISCIPLINA — Arts. 25 a 33
   ---------------------------------------------------------------------
   Art. 25  Amarelo não suspende. Vermelho suspende o jogo seguinte,
            em qualquer fase da competição.
   Art. 29  Agressão relatada em súmula: 4 jogos de suspensão.
   Art. 30  Agressão a árbitro ou mesário: fora da competição.
   Art. 33  Ofensa racista, machista, xenofóbica, homofóbica,
            lesbofóbica, transfóbica ou a qualquer minoria:
            EXPULSÃO do jogador ou da equipe.
   Art. 27  Atletas e comissão técnica se equiparam para efeitos
            disciplinares.
   Art. 31  Invasão de campo: -3 pontos (lançar em Ajustes) ou, nas
            fases finais, W.O. favorável ao adversário.
   ===================================================================== */
import type { Cartao, TipoCartao } from "./types";

/** Quantos jogos cada ocorrência suspende. */
export function jogosDeSuspensao(tipo: TipoCartao): number {
  switch (tipo) {
    case "amarelo":
      return 0;
    case "vermelho":
      return 1;
    case "agressao":
      return 4;
    case "expulsao_copa":
      return Infinity;
  }
}

export const ROTULO_CARTAO: Record<TipoCartao, string> = {
  amarelo: "Amarelo",
  vermelho: "Vermelho",
  agressao: "Agressão (Art. 29)",
  expulsao_copa: "Expulsão da Copa (Art. 30/33)",
};

export const BASE_LEGAL: Record<TipoCartao, string> = {
  amarelo: "Art. 25 — não suspende",
  vermelho: "Art. 25 — 1 jogo de suspensão",
  agressao: "Art. 29 — 4 jogos de suspensão",
  expulsao_copa: "Art. 30/33 — fora da competição",
};

export type Pendencia = {
  cartao: Cartao;
  quem: string;
  total: number;
  cumpridos: number;
  restantes: number;
  definitiva: boolean;
};

/** Suspensões ainda não cumpridas por completo. */
export function pendencias(cartoes: Cartao[]): Pendencia[] {
  const saida: Pendencia[] = [];
  for (const c of cartoes) {
    const total = jogosDeSuspensao(c.tipo);
    if (total === 0) continue;
    const cumpridos = c.cumprido_em.length;
    const definitiva = total === Infinity;
    const restantes = definitiva ? Infinity : Math.max(0, total - cumpridos);
    if (restantes <= 0) continue;
    saida.push({
      cartao: c,
      quem: c.jogador_nome ?? "(sem nome)",
      total,
      cumpridos,
      restantes,
      definitiva,
    });
  }
  return saida;
}

/** Suspensões pendentes de um time — quem não pode entrar em campo. */
export function pendenciasDoTime(cartoes: Cartao[], timeId: string): Pendencia[] {
  return pendencias(cartoes.filter((c) => c.time_id === timeId));
}
