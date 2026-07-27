import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { uid } from "../lib/uid";
import type {
  Ajuste,
  Cartao,
  Contato,
  Jogador,
  Jogo,
  Log,
  Pagamento,
  RankingFinal,
  Regional,
  Time,
} from "../lib/types";

type Dados = {
  regionais: Regional[];
  times: Time[];
  jogos: Jogo[];
  jogadores: Jogador[];
  /** Vazio para quem não é admin — a leitura é restrita. */
  cartoes: Cartao[];
  /** Idem. */
  contatos: Contato[];
  /** Contagem pública de vermelhos por time (view copa_vermelhos),
   *  usada no 4º critério de desempate do Art. 9º. */
  vermelhos: Map<string, number>;
  ajustes: Ajuste[];
  pagamentos: Pagamento[];
  ranking: RankingFinal[];
  /** Registro público de alterações, do mais recente ao mais antigo. */
  log: Log[];
};

const VAZIO: Dados = {
  regionais: [],
  times: [],
  jogos: [],
  jogadores: [],
  cartoes: [],
  contatos: [],
  vermelhos: new Map(),
  ajustes: [],
  pagamentos: [],
  ranking: [],
  log: [],
};

type Ctx = Dados & {
  carregando: boolean;
  erro: string | null;
  /** Sessão do Supabase. */
  email: string | null;
  /** true só se o usuário estiver em `copa_admins`. Isso NÃO é
   *  segurança — só mostra/esconde UI. Quem barra é o RLS. */
  isAdmin: boolean;
  autenticado: boolean;
  aviso: string | null;
  entrar: (email: string, senha: string) => Promise<string | null>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
  toast: (msg: string) => void;

  salvarJogo: (id: string, campos: Partial<Jogo>) => Promise<void>;
  criarJogo: (campos: Partial<Jogo>) => Promise<void>;
  apagarJogo: (id: string) => Promise<void>;
  salvarTime: (id: string, campos: Partial<Time>) => Promise<void>;
  salvarContato: (timeId: string, contato: string) => Promise<void>;
  criarJogador: (timeId: string, nome: string, extra?: Partial<Jogador>) => Promise<void>;
  apagarJogador: (id: string) => Promise<void>;
  criarCartao: (campos: Partial<Cartao> & { time_id: string; tipo: Cartao["tipo"] }) => Promise<void>;
  salvarCartao: (id: string, campos: Partial<Cartao>) => Promise<void>;
  apagarCartao: (id: string) => Promise<void>;
  criarAjuste: (campos: Partial<Ajuste> & { time_id: string; motivo: string }) => Promise<void>;
  apagarAjuste: (id: string) => Promise<void>;
  salvarPagamento: (id: string, campos: Partial<Pagamento>) => Promise<void>;
  fixarRanking: (linhas: Omit<RankingFinal, "id">[]) => Promise<void>;
  limparRanking: (serie: RankingFinal["serie"]) => Promise<void>;
};

const StoreCtx = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore fora do Provider");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setAviso(msg);
    window.setTimeout(() => setAviso((a) => (a === msg ? null : a)), 4000);
  }, []);

  const carregar = useCallback(async () => {
    setErro(null);
    const tabelas = [
      "copa_regionais",
      "copa_times",
      "copa_jogos",
      "copa_jogadores",
      "copa_cartoes",
      "copa_contatos",
      "copa_vermelhos",
      "copa_ajustes",
      "copa_pagamentos",
      "copa_ranking_final",
      "copa_log",
    ] as const;
    const respostas = await Promise.all(
      tabelas.map((t) => supabase.from(t).select("*"))
    );
    // copa_cartoes e copa_contatos são restritas a admins: para quem
    // não é admin elas voltam vazias, sem erro. Só as demais indicam
    // que o banco não foi preparado.
    // copa_log pode não existir ainda (migração log.sql). A tela de
    // Histórico avisa; o resto do app não deve quebrar por isso.
    const restritas = new Set(["copa_cartoes", "copa_contatos", "copa_log"]);
    const falha = respostas.find(
      (r, i) => r.error && !restritas.has(tabelas[i])
    );
    if (falha?.error) {
      setErro(
        `Não consegui carregar os dados: ${falha.error.message}. ` +
          `Você já rodou supabase/schema.sql, seed.sql e privacidade.sql no projeto?`
      );
      setCarregando(false);
      return;
    }
    const [
      regionais, times, jogos, jogadores, cartoes, contatos,
      vermelhos, ajustes, pagamentos, ranking, log,
    ] = respostas.map((r) => r.data ?? []);
    setDados({
      regionais: (regionais as Regional[]).sort((a, b) => a.posicao - b.posicao),
      times: (times as Time[]).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      jogos: (jogos as Jogo[]).sort(
        (a, b) => (a.rodada ?? 99) - (b.rodada ?? 99) || a.ordem - b.ordem
      ),
      jogadores: (jogadores as Jogador[]).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      ),
      cartoes: cartoes as Cartao[],
      contatos: contatos as Contato[],
      vermelhos: new Map(
        (vermelhos as { time_id: string; vermelhos: number }[]).map((v) => [
          v.time_id,
          v.vermelhos,
        ])
      ),
      ajustes: ajustes as Ajuste[],
      pagamentos: (pagamentos as Pagamento[]).sort((a, b) => a.parcela - b.parcela),
      ranking: ranking as RankingFinal[],
      log: (log as Log[]).sort((a, b) => b.quando.localeCompare(a.quando)),
    });
    setCarregando(false);
  }, []);

  /** Confere a lista de admins DA COPA — independente do statsproleta. */
  const conferirAdmin = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("copa_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    setIsAdmin(!!data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      conferirAdmin(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setEmail(sessao?.user.email ?? null);
      conferirAdmin(sessao?.user.id);
    });
    carregar();
    return () => sub.subscription.unsubscribe();
  }, [carregar, conferirAdmin]);

  const entrar = useCallback(
    async (mail: string, senha: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail.trim(),
        password: senha,
      });
      if (error) return error.message;
      await carregar();
      return null;
    },
    [carregar]
  );

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  /** Grava uma linha no registro público de alterações.
   *  A descrição já vem pronta e sem dado sensível: o log é visível
   *  para qualquer visitante, então ocorrências disciplinares entram
   *  sem o nome de quem foi punido. Uma falha aqui nunca desfaz a
   *  alteração em si — só some do histórico, e avisa. */
  const registrar = useCallback(
    async (categoria: string, descricao: string, alvoId?: string) => {
      const { error } = await supabase.from("copa_log").insert({
        id: uid("lg"),
        email,
        categoria,
        descricao,
        alvo_id: alvoId ?? null,
      });
      if (error) {
        toast(
          `A alteração foi salva, mas não entrou no histórico: ${error.message}`
        );
        return;
      }
      setDados((d) => ({
        ...d,
        log: [
          {
            id: uid("lg"),
            quando: new Date().toISOString(),
            user_id: null,
            email,
            categoria,
            descricao,
            alvo_id: alvoId ?? null,
          },
          ...d.log,
        ],
      }));
    },
    [email, toast]
  );

  /** Nome curto de um time, para escrever as frases do histórico. */
  const nomeTime = useCallback(
    (id: string | null | undefined) => {
      const t = dados.times.find((x) => x.id === id);
      return t?.apelido || t?.nome || "time";
    },
    [dados.times]
  );

  /* ---------- escritas ----------
     Todas otimistas: o estado muda antes da rede e é revertido
     (via recarregar) se o banco recusar. O RLS é a autoridade.
     Retorna true quando o banco aceitou — é o que decide se a
     alteração entra no registro público. */
  const escrever = useCallback(
    async <T,>(
      tabela: string,
      operacao: "upsert" | "delete",
      payload: T & { id: string },
      otimista: () => void
    ): Promise<boolean> => {
      otimista();
      const q =
        operacao === "delete"
          ? supabase.from(tabela).delete().eq("id", payload.id)
          : supabase.from(tabela).upsert(payload);
      const { error } = await q;
      if (error) {
        toast(`Não deu para salvar: ${error.message}`);
        await carregar();
        return false;
      }
      return true;
    },
    [carregar, toast]
  );

  const salvarJogo = useCallback(
    async (id: string, campos: Partial<Jogo>) => {
      const atual = dados.jogos.find((j) => j.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      const ok = await escrever("copa_jogos", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          jogos: d.jogos.map((j) => (j.id === id ? novo : j)),
        }))
      );
      if (!ok) return;
      const confronto = `${nomeTime(novo.mandante_id)} x ${nomeTime(novo.visitante_id)}`;
      if (novo.status === "wo" && atual.status !== "wo") {
        const venceu =
          novo.wo_favoravel === "mandante" ? novo.mandante_id : novo.visitante_id;
        await registrar(
          "jogo",
          `registrou W.O. favoravel ao ${nomeTime(venceu)} em ${confronto}`,
          id
        );
      } else if (
        novo.status === "encerrado" &&
        (atual.status !== "encerrado" ||
          atual.gols_mandante !== novo.gols_mandante ||
          atual.gols_visitante !== novo.gols_visitante)
      ) {
        await registrar(
          "jogo",
          `lancou o placar ${nomeTime(novo.mandante_id)} ${novo.gols_mandante} x ` +
            `${novo.gols_visitante} ${nomeTime(novo.visitante_id)}`,
          id
        );
      } else if (atual.status !== novo.status) {
        await registrar("jogo", `mudou ${confronto} para "${novo.status}"`, id);
      } else if (atual.data !== novo.data || atual.local !== novo.local) {
        const quando = novo.data
          ? novo.data.split("-").reverse().join("/")
          : "sem data";
        await registrar(
          "jogo",
          `marcou ${confronto} para ${quando}${novo.local ? ` em ${novo.local}` : ""}`,
          id
        );
      }
    },
    [dados.jogos, escrever, nomeTime, registrar]
  );

  const criarJogo = useCallback(
    async (campos: Partial<Jogo>) => {
      const novo = {
        id: uid("j"),
        fase: "regional",
        ordem: 0,
        status: "agendado",
        ...campos,
      } as Jogo;
      const ok = await escrever("copa_jogos", "upsert", novo, () =>
        setDados((d) => ({ ...d, jogos: [...d.jogos, novo] }))
      );
      if (ok)
        await registrar(
          "jogo",
          `criou o jogo ${nomeTime(novo.mandante_id)} x ${nomeTime(novo.visitante_id)}`,
          novo.id
        );
      await carregar();
    },
    [carregar, escrever, nomeTime, registrar]
  );

  const apagarJogo = useCallback(
    async (id: string) => {
      const alvo = dados.jogos.find((j) => j.id === id);
      const rotulo = alvo
        ? `${nomeTime(alvo.mandante_id)} x ${nomeTime(alvo.visitante_id)}`
        : "um jogo";
      const ok = await escrever("copa_jogos", "delete", { id }, () =>
        setDados((d) => ({ ...d, jogos: d.jogos.filter((j) => j.id !== id) }))
      );
      if (ok) await registrar("jogo", `apagou o jogo ${rotulo}`, id);
    },
    [dados.jogos, escrever, nomeTime, registrar]
  );

  const salvarTime = useCallback(
    async (id: string, campos: Partial<Time>) => {
      const atual = dados.times.find((t) => t.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      const ok = await escrever("copa_times", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          times: d.times.map((t) => (t.id === id ? novo : t)),
        }))
      );
      if (!ok) return;
      if (atual.lista_fechada !== novo.lista_fechada)
        await registrar(
          "time",
          `${novo.lista_fechada ? "fechou" : "reabriu"} a lista de inscritos do ${novo.nome}`,
          id
        );
      else if (atual.desistente !== novo.desistente)
        await registrar(
          "time",
          `marcou o ${novo.nome} como ${novo.desistente ? "fora da competicao" : "ativo"}`,
          id
        );
      else if (atual.responsavel !== novo.responsavel)
        await registrar("time", `alterou o representante do ${novo.nome}`, id);
    },
    [dados.times, escrever, registrar]
  );

  /** copa_contatos tem time_id como chave primária (não `id`), e é
   *  restrita a admins — por isso não passa pelo helper genérico. */
  const salvarContato = useCallback(
    async (timeId: string, contato: string) => {
      const valor = contato.trim() || null;
      setDados((d) => ({
        ...d,
        contatos: [
          ...d.contatos.filter((c) => c.time_id !== timeId),
          { time_id: timeId, contato: valor },
        ],
      }));
      const { error } = await supabase
        .from("copa_contatos")
        .upsert({ time_id: timeId, contato: valor });
      if (error) {
        toast(`Não deu para salvar o contato: ${error.message}`);
        await carregar();
        return;
      }
      await registrar("time", `atualizou o contato do ${nomeTime(timeId)}`, timeId);
    },
    [carregar, nomeTime, registrar, toast]
  );

  const criarJogador = useCallback(
    async (timeId: string, nome: string, extra: Partial<Jogador> = {}) => {
      const novo: Jogador = {
        id: uid("p"),
        time_id: timeId,
        nome: nome.trim(),
        documento: null,
        numero: null,
        inscrito_em: new Date().toISOString().slice(0, 10),
        ...extra,
      };
      const ok = await escrever("copa_jogadores", "upsert", novo, () =>
        setDados((d) => ({ ...d, jogadores: [...d.jogadores, novo] }))
      );
      if (ok)
        await registrar(
          "jogador",
          `inscreveu ${novo.nome} no ${nomeTime(timeId)}`,
          novo.id
        );
    },
    [escrever, nomeTime, registrar]
  );

  const apagarJogador = useCallback(
    async (id: string) => {
      const alvo = dados.jogadores.find((p) => p.id === id);
      const ok = await escrever("copa_jogadores", "delete", { id }, () =>
        setDados((d) => ({
          ...d,
          jogadores: d.jogadores.filter((p) => p.id !== id),
        }))
      );
      if (ok && alvo)
        await registrar(
          "jogador",
          `removeu ${alvo.nome} da lista do ${nomeTime(alvo.time_id)}`,
          id
        );
    },
    [dados.jogadores, escrever, nomeTime, registrar]
  );

  const criarCartao = useCallback(
    async (campos: Partial<Cartao> & { time_id: string; tipo: Cartao["tipo"] }) => {
      const novo: Cartao = {
        id: uid("c"),
        jogo_id: null,
        jogador_id: null,
        jogador_nome: null,
        minuto: null,
        descricao: null,
        cumprido_em: [],
        ...campos,
      };
      const ok = await escrever("copa_cartoes", "upsert", novo, () =>
        setDados((d) => ({ ...d, cartoes: [...d.cartoes, novo] }))
      );
      // O histórico é público: registra o tipo e o time, nunca o nome
      // de quem foi punido nem o relato da súmula.
      if (ok)
        await registrar(
          "disciplina",
          `registrou uma ocorrencia do tipo "${novo.tipo}" no ${nomeTime(novo.time_id)}`,
          novo.time_id
        );
      // a contagem de vermelhos vem de uma view no servidor
      await carregar();
    },
    [carregar, escrever, nomeTime, registrar]
  );

  const salvarCartao = useCallback(
    async (id: string, campos: Partial<Cartao>) => {
      const atual = dados.cartoes.find((c) => c.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      const ok = await escrever("copa_cartoes", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          cartoes: d.cartoes.map((c) => (c.id === id ? novo : c)),
        }))
      );
      if (ok && novo.cumprido_em.length > atual.cumprido_em.length)
        await registrar(
          "disciplina",
          `deu baixa em uma suspensao do ${nomeTime(novo.time_id)}`,
          novo.time_id
        );
    },
    [dados.cartoes, escrever, nomeTime, registrar]
  );

  const apagarCartao = useCallback(
    async (id: string) => {
      const alvo = dados.cartoes.find((c) => c.id === id);
      const ok = await escrever("copa_cartoes", "delete", { id }, () =>
        setDados((d) => ({ ...d, cartoes: d.cartoes.filter((c) => c.id !== id) }))
      );
      if (ok && alvo)
        await registrar(
          "disciplina",
          `apagou uma ocorrencia do tipo "${alvo.tipo}" do ${nomeTime(alvo.time_id)}`,
          alvo.time_id
        );
      await carregar();
    },
    [carregar, dados.cartoes, escrever, nomeTime, registrar]
  );

  const criarAjuste = useCallback(
    async (campos: Partial<Ajuste> & { time_id: string; motivo: string }) => {
      const novo: Ajuste = {
        id: uid("aj"),
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gols_pro: 0,
        gols_contra: 0,
        pontos: 0,
        ...campos,
      };
      const ok = await escrever("copa_ajustes", "upsert", novo, () =>
        setDados((d) => ({ ...d, ajustes: [...d.ajustes, novo] }))
      );
      if (ok) {
        const sinal = novo.pontos > 0 ? `+${novo.pontos}` : `${novo.pontos}`;
        await registrar(
          "ajuste",
          `lancou ajuste de ${sinal} ponto(s) ao ${nomeTime(novo.time_id)} — ${novo.motivo}`,
          novo.time_id
        );
      }
    },
    [escrever, nomeTime, registrar]
  );

  const apagarAjuste = useCallback(
    async (id: string) => {
      const alvo = dados.ajustes.find((a) => a.id === id);
      const ok = await escrever("copa_ajustes", "delete", { id }, () =>
        setDados((d) => ({ ...d, ajustes: d.ajustes.filter((a) => a.id !== id) }))
      );
      if (ok && alvo)
        await registrar(
          "ajuste",
          `apagou o ajuste do ${nomeTime(alvo.time_id)} — ${alvo.motivo}`,
          alvo.time_id
        );
    },
    [dados.ajustes, escrever, nomeTime, registrar]
  );

  const salvarPagamento = useCallback(
    async (id: string, campos: Partial<Pagamento>) => {
      const atual = dados.pagamentos.find((p) => p.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      const ok = await escrever("copa_pagamentos", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          pagamentos: d.pagamentos.map((p) => (p.id === id ? novo : p)),
        }))
      );
      if (ok && atual.pago !== novo.pago)
        await registrar(
          "pagamento",
          `marcou a ${novo.parcela}a parcela do ${nomeTime(novo.time_id)} como ` +
            `${novo.pago ? "paga" : "em aberto"}`,
          novo.time_id
        );
    },
    [dados.pagamentos, escrever, nomeTime, registrar]
  );

  const fixarRanking = useCallback(
    async (linhas: Omit<RankingFinal, "id">[]) => {
      const serie = linhas[0]?.serie;
      if (!serie) return;
      await supabase.from("copa_ranking_final").delete().eq("serie", serie);
      const comId = linhas.map((l) => ({ ...l, id: uid("rk") }));
      const { error } = await supabase.from("copa_ranking_final").insert(comId);
      if (error) toast(`Não deu para fixar a ordem: ${error.message}`);
      else await registrar("chave", `fixou a ordem oficial da Serie ${serie}`);
      await carregar();
    },
    [carregar, registrar, toast]
  );

  const limparRanking = useCallback(
    async (serie: RankingFinal["serie"]) => {
      const { error } = await supabase
        .from("copa_ranking_final")
        .delete()
        .eq("serie", serie);
      if (error) toast(`Não deu para limpar: ${error.message}`);
      else
        await registrar(
          "chave",
          `voltou a Serie ${serie} para a ordem sugerida`
        );
      await carregar();
    },
    [carregar, registrar, toast]
  );

  const valor = useMemo<Ctx>(
    () => ({
      ...dados,
      carregando,
      erro,
      email,
      isAdmin,
      autenticado: !!email,
      aviso,
      entrar,
      sair,
      recarregar: carregar,
      toast,
      salvarJogo,
      criarJogo,
      apagarJogo,
      salvarTime,
      salvarContato,
      criarJogador,
      apagarJogador,
      criarCartao,
      salvarCartao,
      apagarCartao,
      criarAjuste,
      apagarAjuste,
      salvarPagamento,
      fixarRanking,
      limparRanking,
    }),
    [
      dados, carregando, erro, email, isAdmin, aviso, entrar, sair, carregar,
      toast, salvarJogo, criarJogo, apagarJogo, salvarTime, salvarContato,
      criarJogador, apagarJogador, criarCartao, salvarCartao, apagarCartao,
      criarAjuste, apagarAjuste, salvarPagamento, fixarRanking, limparRanking,
      nomeTime, registrar,
    ]
  );

  return <StoreCtx.Provider value={valor}>{children}</StoreCtx.Provider>;
}
