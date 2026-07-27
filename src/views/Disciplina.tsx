import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import {
  BASE_LEGAL,
  ROTULO_CARTAO,
  pendencias,
} from "../lib/disciplina";
import { plural } from "../lib/format";
import { Cartao, Vazio, nomeCurto } from "../components/ui";
import type { TipoCartao } from "../lib/types";

export function Disciplina() {
  const { isAdmin } = useStore();

  // Sem login, `cartoes` volta vazia por causa do RLS. Mostrar as
  // tabelas vazias diria "não há ocorrências", o que é diferente de
  // "você não pode ver as ocorrências".
  if (!isAdmin) {
    return (
      <>
        <Cartao titulo="Registro disciplinar restrito">
          <p className="dica" style={{ marginTop: 0 }}>
            Cartões, suspensões e relatos de súmula só aparecem para a
            Comissão Organizadora. Uma súmula pode nomear alguém acusado de
            agressão (Art. 29) ou de ofensa racista, machista, xenofóbica,
            homofóbica, lesbofóbica ou transfóbica (Art. 33) — é material de
            deliberação da Comissão, não de publicação.
          </p>
          <p className="dica">
            O que é público: a <strong>quantidade</strong> de cartões vermelhos
            por equipe, que aparece na coluna <strong>CV</strong> da
            classificação, em <em>Regionais</em>. É o 4º critério de desempate
            do Art. 9º, então precisa estar à vista de todos.
          </p>
        </Cartao>
        <Ajustes />
      </>
    );
  }

  return (
    <>
      <Registrar />
      <Suspensoes />
      <Ocorrencias />
      <Ajustes />
    </>
  );
}

function Registrar() {
  const { times, jogos, jogadores, isAdmin, criarCartao, toast } = useStore();
  const [timeId, setTimeId] = useState("");
  const [jogoId, setJogoId] = useState("");
  const [jogadorId, setJogadorId] = useState("");
  const [nomeLivre, setNomeLivre] = useState("");
  const [tipo, setTipo] = useState<TipoCartao>("vermelho");
  const [descricao, setDescricao] = useState("");

  if (!isAdmin) return null;

  const elenco = jogadores.filter((p) => p.time_id === timeId);
  const jogosDoTime = jogos.filter(
    (j) => j.mandante_id === timeId || j.visitante_id === timeId
  );

  async function registrar() {
    const jogador = elenco.find((p) => p.id === jogadorId);
    const quem = jogador?.nome ?? nomeLivre.trim();
    if (!timeId || !quem) return;
    await criarCartao({
      time_id: timeId,
      jogo_id: jogoId || null,
      jogador_id: jogador?.id ?? null,
      jogador_nome: quem,
      tipo,
      descricao: descricao.trim() || null,
    });
    setJogadorId("");
    setNomeLivre("");
    setDescricao("");
    toast(`${ROTULO_CARTAO[tipo]} registrado para ${quem}.`);
  }

  return (
    <Cartao titulo="Registrar ocorrência">
      <div className="linha">
        <label className="campo" style={{ flex: 1, minWidth: "9rem" }}>
          Time
          <select
            value={timeId}
            onChange={(e) => {
              setTimeId(e.target.value);
              setJogadorId("");
              setJogoId("");
            }}
          >
            <option value="">escolha…</option>
            {times.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" style={{ flex: 1, minWidth: "9rem" }}>
          Atleta / comissão
          <select
            value={jogadorId}
            onChange={(e) => setJogadorId(e.target.value)}
            disabled={!timeId}
          >
            <option value="">
              {elenco.length ? "escolha…" : "sem lista — digite ao lado"}
            </option>
            {elenco.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        {!jogadorId && (
          <label className="campo" style={{ flex: 1, minWidth: "9rem" }}>
            Ou digite o nome
            <input value={nomeLivre} onChange={(e) => setNomeLivre(e.target.value)} />
          </label>
        )}
      </div>

      <div className="linha" style={{ marginTop: "0.5rem" }}>
        <label className="campo" style={{ flex: 1, minWidth: "11rem" }}>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCartao)}>
            {(Object.keys(ROTULO_CARTAO) as TipoCartao[]).map((t) => (
              <option key={t} value={t}>
                {ROTULO_CARTAO[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" style={{ flex: 1, minWidth: "10rem" }}>
          Jogo (opcional)
          <select
            value={jogoId}
            onChange={(e) => setJogoId(e.target.value)}
            disabled={!timeId}
          >
            <option value="">—</option>
            {jogosDoTime.map((j) => (
              <option key={j.id} value={j.id}>
                {rotuloJogo(j.mandante_id, j.visitante_id, times)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="campo" style={{ marginTop: "0.5rem" }}>
        Relato da súmula
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>

      <p className="dica" style={{ marginTop: "0.4rem" }}>
        {BASE_LEGAL[tipo]}. Art. 27 — atletas e comissão técnica se equiparam
        para efeitos disciplinares.
      </p>

      <button
        className="primario"
        style={{ marginTop: "0.5rem" }}
        onClick={registrar}
        disabled={!timeId || (!jogadorId && !nomeLivre.trim())}
      >
        Registrar
      </button>
    </Cartao>
  );
}

function Suspensoes() {
  const { cartoes, times, jogos, isAdmin, salvarCartao, toast } = useStore();
  const lista = useMemo(() => pendencias(cartoes), [cartoes]);

  return (
    <Cartao titulo={`Suspensões em aberto (${lista.length})`}>
      <p className="dica" style={{ marginTop: 0 }}>
        Art. 25 — o vermelho suspende o jogo seguinte, em qualquer fase. Marque
        o jogo em que a suspensão foi cumprida para dar baixa.
      </p>
      {lista.length === 0 ? (
        <Vazio>Ninguém suspenso no momento.</Vazio>
      ) : (
        <div className="rolagem">
          <table>
            <thead>
              <tr>
                <th>Quem</th>
                <th>Time</th>
                <th>Motivo</th>
                <th className="n">Falta cumprir</th>
                {isAdmin && <th>Dar baixa</th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const time = times.find((t) => t.id === p.cartao.time_id);
                const jogosDoTime = jogos.filter(
                  (j) =>
                    (j.mandante_id === p.cartao.time_id ||
                      j.visitante_id === p.cartao.time_id) &&
                    !p.cartao.cumprido_em.includes(j.id)
                );
                return (
                  <tr key={p.cartao.id}>
                    <td>{p.quem}</td>
                    <td>{nomeCurto(time)}</td>
                    <td>
                      <span
                        className={
                          p.cartao.tipo === "amarelo" ? "selo espera" : "selo grave"
                        }
                      >
                        {ROTULO_CARTAO[p.cartao.tipo]}
                      </span>
                    </td>
                    <td className="n">
                      {p.definitiva
                        ? "definitivo"
                        : plural(p.restantes, "jogo", "jogos")}
                    </td>
                    {isAdmin && (
                      <td>
                        {p.definitiva ? (
                          <span className="dica">—</span>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              salvarCartao(p.cartao.id, {
                                cumprido_em: [
                                  ...p.cartao.cumprido_em,
                                  e.target.value,
                                ],
                              });
                              toast(`Baixa registrada para ${p.quem}.`);
                            }}
                          >
                            <option value="">escolha o jogo…</option>
                            {jogosDoTime.map((j) => (
                              <option key={j.id} value={j.id}>
                                {rotuloJogo(j.mandante_id, j.visitante_id, times)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}

function Ocorrencias() {
  const { cartoes, times, isAdmin, apagarCartao } = useStore();
  if (!cartoes.length)
    return (
      <Cartao titulo="Histórico disciplinar">
        <Vazio>Nenhuma ocorrência registrada.</Vazio>
      </Cartao>
    );
  return (
    <Cartao titulo={`Histórico disciplinar (${cartoes.length})`}>
      <div className="rolagem">
        <table>
          <thead>
            <tr>
              <th>Quem</th>
              <th>Time</th>
              <th>Tipo</th>
              <th>Relato</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {cartoes.map((c) => (
              <tr key={c.id}>
                <td>{c.jogador_nome ?? "—"}</td>
                <td>{nomeCurto(times.find((t) => t.id === c.time_id))}</td>
                <td>{ROTULO_CARTAO[c.tipo]}</td>
                <td className="dica">{c.descricao ?? "—"}</td>
                {isAdmin && (
                  <td>
                    <button className="discreto" onClick={() => apagarCartao(c.id)}>
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}

function Ajustes() {
  const { ajustes, times, isAdmin, criarAjuste, apagarAjuste, toast } = useStore();
  const [timeId, setTimeId] = useState("");
  const [pontos, setPontos] = useState(-3);
  const [motivo, setMotivo] = useState("Invasão de campo — Art. 31");

  return (
    <Cartao titulo="Ajustes de classificação">
      <p className="dica" style={{ marginTop: 0 }}>
        Art. 31 — invasão de campo relatada em súmula custa 3 pontos ao time
        (nas fases finais, W.O. ao adversário). Esta tabela também guarda
        campanhas importadas cujos jogos ainda não foram lançados um a um; ao
        cadastrar os jogos, apague o ajuste correspondente.
      </p>

      {ajustes.length === 0 ? (
        <Vazio>Nenhum ajuste lançado.</Vazio>
      ) : (
        <div className="rolagem">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th className="n">Pts</th>
                <th className="n">J</th>
                <th className="n">V-E-D</th>
                <th className="n">GP-GC</th>
                <th>Motivo</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {ajustes.map((a) => (
                <tr key={a.id}>
                  <td>{nomeCurto(times.find((t) => t.id === a.time_id))}</td>
                  <td className="n" style={{ fontWeight: 700 }}>
                    {a.pontos > 0 ? `+${a.pontos}` : a.pontos}
                  </td>
                  <td className="n">{a.jogos}</td>
                  <td className="n">
                    {a.vitorias}-{a.empates}-{a.derrotas}
                  </td>
                  <td className="n">
                    {a.gols_pro}-{a.gols_contra}
                  </td>
                  <td className="dica">{a.motivo}</td>
                  {isAdmin && (
                    <td>
                      <button className="discreto" onClick={() => apagarAjuste(a.id)}>
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <div className="linha" style={{ marginTop: "0.7rem" }}>
          <label className="campo" style={{ flex: 1, minWidth: "9rem" }}>
            Time
            <select value={timeId} onChange={(e) => setTimeId(e.target.value)}>
              <option value="">escolha…</option>
              {times.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Pontos
            <input
              type="number"
              value={pontos}
              onChange={(e) => setPontos(Number(e.target.value))}
            />
          </label>
          <label className="campo" style={{ flex: 2, minWidth: "10rem" }}>
            Motivo
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>
          <button
            disabled={!timeId || !motivo.trim()}
            onClick={async () => {
              await criarAjuste({ time_id: timeId, pontos, motivo: motivo.trim() });
              setTimeId("");
              toast("Ajuste lançado.");
            }}
          >
            Lançar
          </button>
        </div>
      )}
    </Cartao>
  );
}

function rotuloJogo(
  casa: string | null,
  fora: string | null,
  times: { id: string; nome: string; apelido: string | null }[]
): string {
  const n = (id: string | null) => {
    const t = times.find((x) => x.id === id);
    return t?.apelido || t?.nome || "?";
  };
  return `${n(casa)} × ${n(fora)}`;
}
