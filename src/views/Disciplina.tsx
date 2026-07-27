import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import {
  BASE_LEGAL,
  ROTULO_CARTAO,
  pendencias,
} from "../lib/disciplina";
import { plural } from "../lib/format";
import { Cartao, Vazio, nomeCurto } from "../components/ui";
import { MOTIVOS_AJUSTE, motivoPorId } from "../lib/ajustes";
import type { Ajuste, TipoCartao } from "../lib/types";

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
        <NovoAjuste
          aoLancar={async (dados) => {
            await criarAjuste(dados);
            toast("Ajuste lançado e registrado no histórico.");
          }}
        />
      )}
    </Cartao>
  );
}

/** Lançar ajuste: o motivo vem de uma lista fechada e, quando o
 *  regulamento fixa a penalidade, os pontos não são editáveis —
 *  o Art. 31 diz 3 pontos, não "uns pontos a combinar". */
function NovoAjuste({
  aoLancar,
}: {
  aoLancar: (d: Partial<Ajuste> & { time_id: string; motivo: string }) => Promise<void>;
}) {
  const { times } = useStore();
  const [timeId, setTimeId] = useState("");
  const [motivoId, setMotivoId] = useState(MOTIVOS_AJUSTE[0].id);
  const [pontosLivres, setPontosLivres] = useState(0);
  const [detalhe, setDetalhe] = useState("");
  const [campanha, setCampanha] = useState({
    jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gols_pro: 0, gols_contra: 0,
  });

  const motivo = motivoPorId(motivoId);
  const travado = motivo.pontos !== null;
  const pontos = travado ? motivo.pontos! : pontosLivres;
  const exigeDetalhe = motivoId === "outro";
  const podeLancar = !!timeId && (!exigeDetalhe || detalhe.trim().length > 3);

  async function lancar() {
    const texto = detalhe.trim()
      ? `${motivo.rotulo} — ${detalhe.trim()}`
      : motivo.rotulo;
    await aoLancar({
      time_id: timeId,
      pontos,
      motivo: texto,
      ...(motivo.campanha ? campanha : {}),
    });
    setTimeId("");
    setDetalhe("");
    setPontosLivres(0);
    setCampanha({ jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gols_pro: 0, gols_contra: 0 });
  }

  const campo = (k: keyof typeof campanha, rot: string) => (
    <label className="campo" key={k}>
      {rot}
      <input
        type="number"
        value={campanha[k]}
        onChange={(e) => setCampanha({ ...campanha, [k]: Number(e.target.value) })}
      />
    </label>
  );

  return (
    <div style={{ borderTop: "1px solid var(--creme-200)", marginTop: "1rem", paddingTop: "1rem" }}>
      <h3>Lançar ajuste</h3>
      <div className="filtros">
        <label className="campo">
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
        <label className="campo" style={{ flex: "2 1 14rem" }}>
          Motivo
          <select value={motivoId} onChange={(e) => setMotivoId(e.target.value)}>
            {MOTIVOS_AJUSTE.map((m) => (
              <option key={m.id} value={m.id}>
                {m.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Pontos
          {travado ? (
            <input value={pontos} disabled title="Fixado pelo regulamento" />
          ) : (
            <input
              type="number"
              value={pontosLivres}
              onChange={(e) => setPontosLivres(Number(e.target.value))}
            />
          )}
        </label>
      </div>

      <p className="dica" style={{ marginTop: "0.5rem" }}>
        {motivo.ajuda}
        {travado && (
          <>
            {" "}
            <strong>
              A penalidade é de {Math.abs(pontos)} pontos e não pode ser
              alterada.
            </strong>
          </>
        )}
      </p>

      {motivo.campanha && (
        <div className="filtros" style={{ marginTop: "0.5rem" }}>
          {campo("jogos", "Jogos")}
          {campo("vitorias", "Vitórias")}
          {campo("empates", "Empates")}
          {campo("derrotas", "Derrotas")}
          {campo("gols_pro", "Gols pró")}
          {campo("gols_contra", "Gols contra")}
        </div>
      )}

      <label className="campo" style={{ marginTop: "0.6rem" }}>
        {exigeDetalhe ? "Decisão da Comissão (obrigatório)" : "Detalhe (opcional)"}
        <input
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          placeholder={
            exigeDetalhe
              ? "ex.: reunião extraordinária de 12/08 — ver ata"
              : "ex.: jogo da 3ª rodada, súmula do árbitro"
          }
        />
      </label>

      <button
        className="primario"
        style={{ marginTop: "0.7rem" }}
        disabled={!podeLancar}
        onClick={lancar}
      >
        Lançar ajuste
      </button>
      {exigeDetalhe && !podeLancar && timeId && (
        <p className="dica">
          Descreva a decisão: um ajuste sem justificativa registrada não se
          sustenta numa reunião.
        </p>
      )}
    </div>
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
