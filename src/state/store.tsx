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
    ] as const;
    const respostas = await Promise.all(
      tabelas.map((t) => supabase.from(t).select("*"))
    );
    // copa_cartoes e copa_contatos são restritas a admins: para quem
    // não é admin elas voltam vazias, sem erro. Só as demais indicam
    // que o banco não foi preparado.
    const restritas = new Set(["copa_cartoes", "copa_contatos"]);
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
      vermelhos, ajustes, pagamentos, ranking,
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

  /* ---------- escritas ----------
     Todas otimistas: o estado muda antes da rede e é revertido
     (via recarregar) se o banco recusar. O RLS é a autoridade. */
  const escrever = useCallback(
    async <T,>(
      tabela: string,
      operacao: "upsert" | "delete",
      payload: T & { id: string },
      otimista: () => void
    ) => {
      otimista();
      const q =
        operacao === "delete"
          ? supabase.from(tabela).delete().eq("id", payload.id)
          : supabase.from(tabela).upsert(payload);
      const { error } = await q;
      if (error) {
        toast(`Não deu para salvar: ${error.message}`);
        await carregar();
      }
    },
    [carregar, toast]
  );

  const salvarJogo = useCallback(
    async (id: string, campos: Partial<Jogo>) => {
      const atual = dados.jogos.find((j) => j.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      await escrever("copa_jogos", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          jogos: d.jogos.map((j) => (j.id === id ? novo : j)),
        }))
      );
    },
    [dados.jogos, escrever]
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
      await escrever("copa_jogos", "upsert", novo, () =>
        setDados((d) => ({ ...d, jogos: [...d.jogos, novo] }))
      );
      await carregar();
    },
    [carregar, escrever]
  );

  const apagarJogo = useCallback(
    async (id: string) => {
      await escrever("copa_jogos", "delete", { id }, () =>
        setDados((d) => ({ ...d, jogos: d.jogos.filter((j) => j.id !== id) }))
      );
    },
    [escrever]
  );

  const salvarTime = useCallback(
    async (id: string, campos: Partial<Time>) => {
      const atual = dados.times.find((t) => t.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      await escrever("copa_times", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          times: d.times.map((t) => (t.id === id ? novo : t)),
        }))
      );
    },
    [dados.times, escrever]
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
      }
    },
    [carregar, toast]
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
      await escrever("copa_jogadores", "upsert", novo, () =>
        setDados((d) => ({ ...d, jogadores: [...d.jogadores, novo] }))
      );
    },
    [escrever]
  );

  const apagarJogador = useCallback(
    async (id: string) => {
      await escrever("copa_jogadores", "delete", { id }, () =>
        setDados((d) => ({
          ...d,
          jogadores: d.jogadores.filter((p) => p.id !== id),
        }))
      );
    },
    [escrever]
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
      await escrever("copa_cartoes", "upsert", novo, () =>
        setDados((d) => ({ ...d, cartoes: [...d.cartoes, novo] }))
      );
      // a contagem de vermelhos vem de uma view no servidor
      await carregar();
    },
    [carregar, escrever]
  );

  const salvarCartao = useCallback(
    async (id: string, campos: Partial<Cartao>) => {
      const atual = dados.cartoes.find((c) => c.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      await escrever("copa_cartoes", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          cartoes: d.cartoes.map((c) => (c.id === id ? novo : c)),
        }))
      );
    },
    [dados.cartoes, escrever]
  );

  const apagarCartao = useCallback(
    async (id: string) => {
      await escrever("copa_cartoes", "delete", { id }, () =>
        setDados((d) => ({ ...d, cartoes: d.cartoes.filter((c) => c.id !== id) }))
      );
      await carregar();
    },
    [carregar, escrever]
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
      await escrever("copa_ajustes", "upsert", novo, () =>
        setDados((d) => ({ ...d, ajustes: [...d.ajustes, novo] }))
      );
    },
    [escrever]
  );

  const apagarAjuste = useCallback(
    async (id: string) => {
      await escrever("copa_ajustes", "delete", { id }, () =>
        setDados((d) => ({ ...d, ajustes: d.ajustes.filter((a) => a.id !== id) }))
      );
    },
    [escrever]
  );

  const salvarPagamento = useCallback(
    async (id: string, campos: Partial<Pagamento>) => {
      const atual = dados.pagamentos.find((p) => p.id === id);
      if (!atual) return;
      const novo = { ...atual, ...campos };
      await escrever("copa_pagamentos", "upsert", novo, () =>
        setDados((d) => ({
          ...d,
          pagamentos: d.pagamentos.map((p) => (p.id === id ? novo : p)),
        }))
      );
    },
    [dados.pagamentos, escrever]
  );

  const fixarRanking = useCallback(
    async (linhas: Omit<RankingFinal, "id">[]) => {
      const serie = linhas[0]?.serie;
      if (!serie) return;
      await supabase.from("copa_ranking_final").delete().eq("serie", serie);
      const comId = linhas.map((l) => ({ ...l, id: uid("rk") }));
      const { error } = await supabase.from("copa_ranking_final").insert(comId);
      if (error) toast(`Não deu para fixar a ordem: ${error.message}`);
      await carregar();
    },
    [carregar, toast]
  );

  const limparRanking = useCallback(
    async (serie: RankingFinal["serie"]) => {
      const { error } = await supabase
        .from("copa_ranking_final")
        .delete()
        .eq("serie", serie);
      if (error) toast(`Não deu para limpar: ${error.message}`);
      await carregar();
    },
    [carregar, toast]
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
    ]
  );

  return <StoreCtx.Provider value={valor}>{children}</StoreCtx.Provider>;
}
