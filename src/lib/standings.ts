/* =====================================================================
   CLASSIFICAÇÃO — Art. 9º do regulamento
   ---------------------------------------------------------------------
   Vitória 3 pts, empate 1, derrota 0.
   Empate em pontos ganhos entre 2 ou mais equipes resolve-se, na
   ordem:
     1. Confronto direto
     2. Número de vitórias
     3. Saldo de gols
     4. Cartões vermelhos (menos cartões fica na frente)
     5. Gols feitos

   Quando um critério separa o grupo em subgrupos, os critérios são
   reaplicados DO INÍCIO dentro de cada subgrupo — inclusive o
   confronto direto, que é recalculado só entre os times que
   continuam empatados. É a prática padrão e é o que faz o
   "confronto direto" ter sentido em grupos de 3 ou mais.
   ===================================================================== */
import type { Ajuste, Jogo, LinhaTabela, Time } from "./types";

/** Jogos que contam para a tabela: só encerrados e W.O. */
export function jogoVale(j: Jogo): boolean {
  return j.status === "encerrado" || j.status === "wo";
}

/** Placar efetivo. Art. 24: o W.O. dá 3x0 à equipe vencedora. */
export function placar(j: Jogo): { casa: number; fora: number } | null {
  if (j.status === "wo") {
    if (j.wo_favoravel === "mandante") return { casa: 3, fora: 0 };
    if (j.wo_favoravel === "visitante") return { casa: 0, fora: 3 };
    return null;
  }
  if (j.status !== "encerrado") return null;
  if (j.gols_mandante == null || j.gols_visitante == null) return null;
  return { casa: j.gols_mandante, fora: j.gols_visitante };
}

function linhaVazia(time: Time): LinhaTabela {
  return {
    time,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    gols_pro: 0,
    gols_contra: 0,
    saldo: 0,
    pontos: 0,
    vermelhos: 0,
  };
}

function aplicaJogo(linha: LinhaTabela, feitos: number, sofridos: number) {
  linha.jogos += 1;
  linha.gols_pro += feitos;
  linha.gols_contra += sofridos;
  if (feitos > sofridos) {
    linha.vitorias += 1;
    linha.pontos += 3;
  } else if (feitos === sofridos) {
    linha.empates += 1;
    linha.pontos += 1;
  } else {
    linha.derrotas += 1;
  }
}

export type OpcoesTabela = {
  /** Fases consideradas. Padrão: só a fase regional (pontos corridos). */
  fases?: Jogo["fase"][];
};

/**
 * Monta as linhas da tabela para um conjunto de times, já ordenadas
 * e com o critério de desempate anotado em cada linha.
 */
export function classificacao(
  times: Time[],
  jogos: Jogo[],
  /** Cartões vermelhos por time (4º critério). Vem da view pública
   *  `copa_vermelhos`, e não de `copa_cartoes` — o relato da súmula
   *  é restrito a admins, mas a CONTAGEM precisa ser pública, senão
   *  a tabela exibida ao público ordenaria diferente da oficial. */
  vermelhos: Map<string, number>,
  ajustes: Ajuste[],
  opcoes: OpcoesTabela = {}
): LinhaTabela[] {
  const fases = opcoes.fases ?? ["regional"];
  const ids = new Set(times.map((t) => t.id));
  const linhas = new Map(times.map((t) => [t.id, linhaVazia(t)]));

  const relevantes = jogos.filter(
    (j) =>
      fases.includes(j.fase) &&
      jogoVale(j) &&
      j.mandante_id &&
      j.visitante_id &&
      ids.has(j.mandante_id) &&
      ids.has(j.visitante_id)
  );

  for (const j of relevantes) {
    const p = placar(j);
    if (!p) continue;
    const casa = linhas.get(j.mandante_id!);
    const fora = linhas.get(j.visitante_id!);
    if (casa) aplicaJogo(casa, p.casa, p.fora);
    if (fora) aplicaJogo(fora, p.fora, p.casa);
  }

  // Cartões vermelhos (4º critério). A view já soma agressões
  // (Art. 29) junto com os vermelhos (Art. 25).
  for (const [timeId, qtd] of vermelhos) {
    const linha = linhas.get(timeId);
    if (linha) linha.vermelhos += qtd;
  }

  // Ajustes manuais: perda de pontos por invasão (Art. 31) e
  // campanhas importadas cujos jogos ainda não foram lançados.
  for (const a of ajustes) {
    const linha = linhas.get(a.time_id);
    if (!linha) continue;
    linha.jogos += a.jogos;
    linha.vitorias += a.vitorias;
    linha.empates += a.empates;
    linha.derrotas += a.derrotas;
    linha.gols_pro += a.gols_pro;
    linha.gols_contra += a.gols_contra;
    linha.pontos += a.pontos;
  }

  for (const linha of linhas.values()) {
    linha.saldo = linha.gols_pro - linha.gols_contra;
  }

  return ordenar([...linhas.values()], relevantes);
}

/** Pontos de cada time considerando SÓ os jogos entre os times do grupo. */
function pontosConfrontoDireto(
  grupo: LinhaTabela[],
  jogos: Jogo[]
): Map<string, number> {
  const ids = new Set(grupo.map((l) => l.time.id));
  const pontos = new Map([...ids].map((id) => [id, 0]));
  for (const j of jogos) {
    if (!j.mandante_id || !j.visitante_id) continue;
    if (!ids.has(j.mandante_id) || !ids.has(j.visitante_id)) continue;
    const p = placar(j);
    if (!p) continue;
    if (p.casa > p.fora) {
      pontos.set(j.mandante_id, (pontos.get(j.mandante_id) ?? 0) + 3);
    } else if (p.casa < p.fora) {
      pontos.set(j.visitante_id, (pontos.get(j.visitante_id) ?? 0) + 3);
    } else {
      pontos.set(j.mandante_id, (pontos.get(j.mandante_id) ?? 0) + 1);
      pontos.set(j.visitante_id, (pontos.get(j.visitante_id) ?? 0) + 1);
    }
  }
  return pontos;
}

type Criterio = {
  nome: string;
  /** Valor do time; maior fica na frente. */
  valor: (l: LinhaTabela, grupo: LinhaTabela[], jogos: Jogo[]) => number;
};

const CRITERIOS: Criterio[] = [
  {
    nome: "confronto direto",
    valor: (l, grupo, jogos) => pontosConfrontoDireto(grupo, jogos).get(l.time.id) ?? 0,
  },
  { nome: "número de vitórias", valor: (l) => l.vitorias },
  { nome: "saldo de gols", valor: (l) => l.saldo },
  // menos vermelhos fica na frente -> inverte o sinal
  { nome: "cartões vermelhos", valor: (l) => -l.vermelhos },
  { nome: "gols feitos", valor: (l) => l.gols_pro },
];

/** Ordena um grupo já empatado em pontos, aplicando os critérios. */
function desempatar(
  grupo: LinhaTabela[],
  jogos: Jogo[],
  aPartirDe = 0
): LinhaTabela[] {
  if (grupo.length <= 1) return grupo;

  for (let i = aPartirDe; i < CRITERIOS.length; i++) {
    const criterio = CRITERIOS[i];
    const chaves = new Map(
      grupo.map((l) => [l.time.id, criterio.valor(l, grupo, jogos)])
    );
    const distintos = new Set(chaves.values());
    if (distintos.size === 1) continue; // não separou; próximo critério

    const ordenado = [...grupo].sort(
      (a, b) => (chaves.get(b.time.id) ?? 0) - (chaves.get(a.time.id) ?? 0)
    );

    // Agrupa quem ficou com o mesmo valor e reaplica os critérios
    // DO INÍCIO dentro de cada subgrupo (confronto direto recalculado).
    const saida: LinhaTabela[] = [];
    let bloco: LinhaTabela[] = [];
    const fecharBloco = () => {
      if (!bloco.length) return;
      const resolvido =
        bloco.length < grupo.length
          ? desempatar(bloco, jogos, 0)
          : desempatar(bloco, jogos, i + 1);
      saida.push(...resolvido);
      bloco = [];
    };
    for (const linha of ordenado) {
      if (
        bloco.length &&
        chaves.get(bloco[0].time.id) !== chaves.get(linha.time.id)
      ) {
        const primeiroDoProximo = linha;
        fecharBloco();
        primeiroDoProximo.desempate = criterio.nome;
      }
      bloco.push(linha);
    }
    fecharBloco();
    return saida;
  }

  return grupo; // empate absoluto em todos os critérios
}

/** Ordena a tabela inteira: pontos e, nos empates, os critérios do Art. 9º. */
export function ordenar(linhas: LinhaTabela[], jogos: Jogo[]): LinhaTabela[] {
  const porPontos = [...linhas].sort((a, b) => b.pontos - a.pontos);
  const saida: LinhaTabela[] = [];
  let bloco: LinhaTabela[] = [];
  const fecharBloco = () => {
    if (!bloco.length) return;
    saida.push(...desempatar(bloco, jogos, 0));
    bloco = [];
  };
  for (const linha of porPontos) {
    if (bloco.length && bloco[0].pontos !== linha.pontos) fecharBloco();
    bloco.push(linha);
  }
  fecharBloco();
  return saida;
}

/** Quantos jogos da fase regional ainda faltam para o grupo fechar. */
export function jogosPendentes(jogos: Jogo[]): Jogo[] {
  return jogos.filter((j) => !jogoVale(j) && j.status !== "anulado");
}
