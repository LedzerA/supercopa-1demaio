/* Confere a classificação calculada pelo app contra a tabela
   divulgada pela liga (arquivo "Regional Adriana Albuquerque.txt").
   Rode com:  node scripts/verificar-tabela.mjs   (veja README) */
import { classificacao } from "../src/lib/standings";
import type { Ajuste, Jogo, Time } from "../src/lib/types";

const SEM_VERMELHOS = new Map<string, number>();

const time = (id: string, nome: string, regional = "r"): Time => ({
  id,
  regional_id: regional,
  nome,
  apelido: nome,
  responsavel: null,
  desistente: false,
  lista_fechada: false,
});

let seq = 0;
const jogo = (
  casa: string,
  gc: number | null,
  gf: number | null,
  fora: string,
  extra: Partial<Jogo> = {}
): Jogo => ({
  id: `j${seq++}`,
  regional_id: "r",
  fase: "regional",
  serie: null,
  etapa: null,
  chave: null,
  rodada: 1,
  ordem: seq,
  mandante_id: casa,
  visitante_id: fora,
  mandante_slot: null,
  visitante_slot: null,
  data: null,
  horario: null,
  local: null,
  status: gc == null ? "agendado" : "encerrado",
  gols_mandante: gc,
  gols_visitante: gf,
  wo_favoravel: null,
  observacoes: null,
  updated_at: "",
  ...extra,
});

let falhas = 0;
function conferir(rotulo: string, obtido: unknown, esperado: unknown) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) {
    console.log(`  ok   ${rotulo}`);
  } else {
    falhas++;
    console.log(`  FALHA ${rotulo}\n        obtido:   ${a}\n        esperado: ${b}`);
  }
}

// =====================================================================
console.log("\nRegional Adriana Albuquerque (Lapa) — 3 rodadas jogadas");
// =====================================================================
{
  const times = [
    time("brasil", "Brasil"),
    time("formigueiro", "Formigueiro"),
    time("suburbio", "Subúrbio Geral"),
    time("futanta", "Futantã"),
    time("bnh", "Academia BNH"),
    time("uniaolapa", "União Lapa"),
  ];
  const jogos = [
    jogo("suburbio", 2, 1, "bnh"),
    jogo("futanta", 0, 3, "formigueiro"),
    jogo("brasil", 11, 0, "uniaolapa"),
    jogo("formigueiro", 9, 2, "suburbio"),
    jogo("uniaolapa", null, null, "futanta"), // não realizado
    jogo("bnh", 0, 8, "brasil"),
    jogo("suburbio", 3, 1, "uniaolapa"),
    jogo("formigueiro", 3, 2, "bnh"), // deduzido da tabela
    jogo("brasil", 3, 2, "futanta"),
  ];
  const t = classificacao(times, jogos, SEM_VERMELHOS, [] as Ajuste[]);
  const resumo = t.map((l) => [
    l.time.nome,
    l.pontos,
    l.jogos,
    l.vitorias,
    l.derrotas,
    l.gols_pro,
    l.gols_contra,
    l.saldo,
  ]);
  // Ordem e números exatos publicados pela liga.
  conferir("tabela completa", resumo, [
    ["Brasil", 9, 3, 3, 0, 22, 2, 20],
    ["Formigueiro", 9, 3, 3, 0, 15, 4, 11],
    ["Subúrbio Geral", 6, 3, 2, 1, 7, 11, -4],
    ["Futantã", 0, 2, 0, 2, 2, 6, -4],
    ["Academia BNH", 0, 3, 0, 3, 3, 13, -10],
    ["União Lapa", 0, 2, 0, 2, 1, 14, -13],
  ]);
  // Brasil x Formigueiro: 9 pts cada, sem confronto direto ainda ->
  // empatam em vitórias (3) e decide o saldo.
  conferir("critério que separou o 2º", t[1].desempate, "saldo de gols");
  // Futantã x BNH x União Lapa: todos 0 pt. BNH tem saldo -10 e o
  // Futantã -4, então Futantã sobe mesmo com menos jogos.
  conferir("4º colocado", t[3].time.nome, "Futantã");
}

// =====================================================================
console.log("\nRegional Magali Batista (Guarulhos) — com W.O. do TGFC");
// =====================================================================
{
  const times = [
    time("familia", "Família"),
    time("havana", "Havana"),
    time("palestino", "Palestino"),
    time("sevira", "Sevira FC"),
    time("libertarios", "Libertários"),
    time("tgfc", "TGFC"),
  ];
  const wo = { status: "wo" as const, wo_favoravel: "mandante" as const };
  const jogos = [
    jogo("familia", 3, 1, "palestino"),
    jogo("sevira", 3, 0, "tgfc", wo),
    jogo("havana", 2, 0, "libertarios"),
    jogo("havana", 3, 0, "tgfc", wo),
    jogo("palestino", 2, 0, "sevira"),
    jogo("familia", 2, 0, "libertarios"),
    jogo("libertarios", 3, 0, "tgfc", wo),
    jogo("palestino", 3, 0, "tgfc", wo),
    jogo("familia", 3, 0, "tgfc", wo),
  ];
  const t = classificacao(times, jogos, SEM_VERMELHOS, [] as Ajuste[]);
  const resumo = t.map((l) => [l.time.nome, l.pontos, l.jogos, l.gols_pro, l.gols_contra]);
  // Mesma ordem publicada pela liga: Família, Havana, Palestino,
  // Sevira, Libertários. Havana e Palestino empatam em 6 pts e 2
  // vitórias e ainda não se enfrentaram, então decide o saldo (5 x 3).
  // Sevira e Libertários empatam em 3 pts e 1 vitória, e o saldo
  // (+1 x -1) coloca o Sevira na frente.
  conferir("tabela completa", resumo, [
    ["Família", 9, 3, 8, 1],
    ["Havana", 6, 2, 5, 0],
    ["Palestino", 6, 3, 6, 3],
    ["Sevira FC", 3, 2, 3, 2],
    ["Libertários", 3, 3, 3, 4],
    ["TGFC", 0, 5, 0, 15],
  ]);
  conferir("Havana à frente do Palestino no saldo", t[1].time.nome, "Havana");
  conferir("W.O. do TGFC contou 0x3 cinco vezes", [t[5].gols_contra, t[5].jogos], [15, 5]);
}

// =====================================================================
console.log("\nConfronto direto (Art. 9º, critério 1)");
// =====================================================================
{
  const times = [time("a", "A"), time("b", "B"), time("c", "C"), time("d", "D")];
  // A e B terminam com 6 pts e 2 vitórias cada. A tem saldo bem melhor
  // (+5 contra +1), mas B venceu A no confronto direto — e o confronto
  // direto vem ANTES do saldo. Logo B fica na frente.
  const jogos = [
    jogo("b", 1, 0, "a"),
    jogo("a", 3, 0, "c"),
    jogo("a", 3, 0, "d"),
    jogo("b", 1, 0, "c"),
    jogo("b", 0, 1, "d"),
  ];
  const t = classificacao(times, jogos, SEM_VERMELHOS, [] as Ajuste[]);
  conferir(
    "pontos e saldo de A e B",
    [t[0].pontos, t[0].saldo, t[1].pontos, t[1].saldo],
    [6, 1, 6, 5]
  );
  conferir(
    "quem venceu o confronto direto fica na frente, apesar do saldo pior",
    t.map((l) => l.time.nome),
    ["B", "A", "D", "C"]
  );
  conferir("critério anotado", t[1].desempate, "confronto direto");
}

// =====================================================================
console.log("\nCartões vermelhos (Art. 9º, critério 4)");
// =====================================================================
{
  const times = [time("a", "A"), time("b", "B")];
  // Empate total até o 3º critério; o 4º é cartões vermelhos, e menos
  // vermelhos fica na frente.
  const jogos = [jogo("a", 1, 1, "b")];
  // Vem da view pública copa_vermelhos: só a contagem por time.
  const vermelhos = new Map([["a", 1]]);
  const t = classificacao(times, jogos, vermelhos, [] as Ajuste[]);
  conferir(
    "time com menos vermelhos fica na frente",
    t.map((l) => l.time.nome),
    ["B", "A"]
  );
  conferir("critério anotado", t[1].desempate, "cartões vermelhos");
}

// =====================================================================
console.log("\nRegional Mateus Azevedo (Carrão) — 4 rodadas jogadas");
// =====================================================================
{
  const times = [
    time("codigoverde", "Código Verde"),
    time("proleta", "Proletariado Alviverde"),
    time("tap", "TAP"),
    time("corote", "Corote & Molotov"),
    time("rayo", "Rayo Proletário"),
    time("sodevirada", "Só de Virada"),
  ];
  // Os 12 placares informados pela organização.
  const jogos = [
    jogo("tap", 1, 1, "corote"),
    jogo("codigoverde", 0, 0, "proleta"),
    jogo("sodevirada", 2, 2, "rayo"),
    jogo("sodevirada", 0, 3, "tap"),
    jogo("corote", 1, 1, "proleta"),
    jogo("rayo", 1, 3, "codigoverde"),
    jogo("rayo", 1, 4, "corote"),
    jogo("tap", 0, 1, "proleta"),
    jogo("sodevirada", 1, 5, "codigoverde"),
    jogo("proleta", 3, 0, "sodevirada"),
    jogo("tap", 5, 4, "rayo"),
    jogo("codigoverde", 0, 0, "corote"),
  ];
  const t = classificacao(times, jogos, SEM_VERMELHOS, [] as Ajuste[]);
  const resumo = t.map((l) => [
    l.time.nome,
    l.pontos,
    l.jogos,
    l.vitorias,
    l.empates,
    l.derrotas,
    l.gols_pro,
    l.gols_contra,
    l.saldo,
  ]);
  // Confere os 12 placares contra a classificação divulgada pela liga.
  conferir("tabela completa", resumo, [
    ["Código Verde", 8, 4, 2, 2, 0, 8, 2, 6],
    ["Proletariado Alviverde", 8, 4, 2, 2, 0, 5, 1, 4],
    ["TAP", 7, 4, 2, 1, 1, 9, 6, 3],
    ["Corote & Molotov", 6, 4, 1, 3, 0, 6, 3, 3],
    ["Rayo Proletário", 1, 4, 0, 1, 3, 8, 14, -6],
    ["Só de Virada", 1, 4, 0, 1, 3, 3, 13, -10],
  ]);
  // Código Verde e Proletariado empatam em 8 pts e 2 vitórias, e o
  // confronto direto entre eles foi 0x0 — não separa. Decide o saldo.
  conferir("critério que separou o 2º", t[1].desempate, "saldo de gols");

  // Art. 31 — invasão de campo tira 3 pontos.
  const comPunicao = classificacao(times, jogos, SEM_VERMELHOS, [
    {
      id: "pun",
      time_id: "codigoverde",
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      gols_pro: 0,
      gols_contra: 0,
      pontos: -3,
      motivo: "invasão",
    },
  ]);
  conferir("Código Verde cai para 5 pts", comPunicao.find((l) => l.time.id === "codigoverde")!.pontos, 5);
  conferir("e perde a liderança", comPunicao[0].time.nome, "Proletariado Alviverde");
}

console.log(
  falhas === 0
    ? "\nTudo certo — a classificação bate com a tabela da liga.\n"
    : `\n${falhas} verificação(ões) falharam.\n`
);
if (falhas > 0) process.exit(1);
