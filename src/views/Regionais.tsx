import { useMemo } from "react";
import { useStore } from "../state/store";
import { classificacao, jogoVale } from "../lib/standings";
import { POSICOES_FINAL, ROTULO_SERIE, SERIES } from "../lib/bracket";
import { saldoBR } from "../lib/format";
import { Aviso, Cartao, Vazio, nomeCurto } from "../components/ui";
import { JogoLinha } from "../components/JogoLinha";
import type { LinhaTabela, Regional, Serie } from "../lib/types";

export function Regionais() {
  const { regionais } = useStore();
  if (!regionais.length)
    return (
      <Cartao>
        <Vazio>Nenhuma regional cadastrada.</Vazio>
      </Cartao>
    );
  return (
    <>
      {regionais.map((r) => (
        <BlocoRegional key={r.id} regional={r} />
      ))}
      <Legenda />
    </>
  );
}

function BlocoRegional({ regional }: { regional: Regional }) {
  const { times, jogos, vermelhos, ajustes, isAdmin, salvarJogo, toast } = useStore();

  const doGrupo = useMemo(
    () => times.filter((t) => t.regional_id === regional.id),
    [times, regional.id]
  );
  const jogosDoGrupo = useMemo(
    () => jogos.filter((j) => j.regional_id === regional.id),
    [jogos, regional.id]
  );
  const ajustesDoGrupo = useMemo(
    () => ajustes.filter((a) => doGrupo.some((t) => t.id === a.time_id)),
    [ajustes, doGrupo]
  );

  const tabela = useMemo(
    () => classificacao(doGrupo, jogosDoGrupo, vermelhos, ajustesDoGrupo),
    [doGrupo, jogosDoGrupo, vermelhos, ajustesDoGrupo]
  );

  const daFaseRegional = jogosDoGrupo.filter((j) => j.fase === "regional");
  const faltam = daFaseRegional.filter(
    (j) => !jogoVale(j) && j.status !== "anulado"
  ).length;
  const finais = jogosDoGrupo.filter((j) => j.fase === "final_regional");
  const finaisDefinidas = finais.every((f) => f.mandante_id && f.visitante_id);

  async function definirFinais() {
    for (const serie of SERIES) {
      const [a, b] = POSICOES_FINAL[serie];
      const casa = tabela[a - 1]?.time.id ?? null;
      const fora = tabela[b - 1]?.time.id ?? null;
      const jogo = finais.find((f) => f.serie === serie);
      if (jogo && casa && fora) {
        await salvarJogo(jogo.id, { mandante_id: casa, visitante_id: fora });
      }
    }
    toast(`Finais da ${regional.nome} definidas pela classificação.`);
  }

  const ajusteImportado = ajustesDoGrupo.filter((a) => a.jogos > 0);

  // Art. 6º cruza 1º×2º, 3º×4º e 5º×6º. Se um dos seis abandonou
  // (Art. 18 parágrafo único), a final dele não tem como ser jogada
  // e a série fica sem representante desta regional na Fase Lima
  // Barreto. Quem decide é a Comissão (Art. 38) — o site só avisa.
  const finaisComprometidas = SERIES.map((serie) => {
    const [a, b] = POSICOES_FINAL[serie];
    const dupla = [tabela[a - 1], tabela[b - 1]].filter(Boolean);
    const fora = dupla.filter((l) => l.time.desistente).map((l) => l.time);
    return { serie, fora, dupla };
  }).filter((f) => f.fora.length > 0);

  return (
    <Cartao>
      <div className="titulo-bloco">
        <h2>{regional.nome}</h2>
        <div className="lugar">
          {regional.regiao}
          {faltam > 0
            ? ` · faltam ${faltam} jogo${faltam > 1 ? "s" : ""}`
            : " · fase regional encerrada"}
        </div>
      </div>

      <Tabela tabela={tabela} />

      {ajusteImportado.length > 0 && (
        <Aviso>
          Parte da campanha desta regional está lançada como ajuste manual, sem
          os placares jogo a jogo. Ao cadastrar os jogos, apague os ajustes —
          senão a campanha conta duas vezes.
        </Aviso>
      )}

      {finaisComprometidas.map(({ serie, fora, dupla }) => (
        <Aviso key={serie}>
          <strong>
            A Final {ROTULO_SERIE[serie]} desta regional não tem como ser
            jogada.
          </strong>{" "}
          O confronto seria {dupla.map((l) => nomeCurto(l.time)).join(" × ")}, e{" "}
          {fora.map((t) => nomeCurto(t)).join(" e ")} está fora da competição.
          Sem essa final, a regional fica sem campeão e sem vice na{" "}
          {ROTULO_SERIE[serie]} da Fase Final. É caso omisso — cabe à Comissão
          Organizadora decidir (Art. 38).
        </Aviso>
      ))}

      <h3 style={{ marginTop: "1.3rem" }}>Finais da regional</h3>
      <p className="explica">
        Quem termina em 1º e 2º disputa o troféu Ouro; 3º e 4º, o Prata; 5º e
        6º, o Bronze. Os vencedores e vices vão para a Fase Final.
      </p>

      {isAdmin && (
        <div className="linha" style={{ marginBottom: "0.7rem" }}>
          <button
            className={finaisDefinidas ? "" : "primario"}
            onClick={definirFinais}
            disabled={tabela.length < 6}
          >
            {finaisDefinidas
              ? "Regravar finais pela classificação"
              : "Definir finais pela classificação"}
          </button>
          {faltam > 0 && (
            <span className="dica">a fase regional ainda não terminou</span>
          )}
        </div>
      )}

      {finais.length === 0 ? (
        <Vazio>Finais ainda não cadastradas.</Vazio>
      ) : (
        SERIES.map((s) => {
          const j = finais.find((f) => f.serie === s);
          if (!j) return null;
          return (
            <div key={s}>
              <div className="etapa">
                <span className={`selo ${s}`}>{ROTULO_SERIE[s]}</span>
              </div>
              <JogoLinha jogo={j} />
            </div>
          );
        })
      )}
    </Cartao>
  );
}

function faixaDaPosicao(pos: number): Serie | null {
  if (pos <= 2) return "ouro";
  if (pos <= 4) return "prata";
  if (pos <= 6) return "bronze";
  return null;
}

function Tabela({ tabela }: { tabela: LinhaTabela[] }) {
  return (
    <div className="rolagem">
      <table>
        <thead>
          <tr>
            <th className="pos"></th>
            <th>Time</th>
            <th className="n" title="Pontos">P</th>
            <th className="n" title="Jogos disputados">J</th>
            <th className="n col-opc" title="Vitórias">V</th>
            <th className="n col-opc" title="Empates">E</th>
            <th className="n col-opc" title="Derrotas">D</th>
            <th className="n col-opc" title="Gols marcados">GP</th>
            <th className="n col-opc" title="Gols sofridos">GC</th>
            <th className="n" title="Saldo de gols">SG</th>
            <th className="n col-opc" title="Cartões vermelhos">CV</th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((l, i) => {
            const pos = i + 1;
            const faixa = faixaDaPosicao(pos);
            return (
              <tr key={l.time.id} className={faixa ? `faixa-${faixa}` : ""}>
                <td className="pos">{pos}</td>
                <td>
                  <span className="time-nome">{nomeCurto(l.time)}</span>
                  {l.time.desistente && (
                    <span className="selo grave" style={{ marginLeft: "0.4rem" }}>
                      fora
                    </span>
                  )}
                  {l.desempate && (
                    <div className="dica" style={{ fontSize: "0.7rem" }}>
                      desempate: {l.desempate}
                    </div>
                  )}
                </td>
                <td className="n pontos">{l.pontos}</td>
                <td className="n">{l.jogos}</td>
                <td className="n col-opc">{l.vitorias}</td>
                <td className="n col-opc">{l.empates}</td>
                <td className="n col-opc">{l.derrotas}</td>
                <td className="n col-opc">{l.gols_pro}</td>
                <td className="n col-opc">{l.gols_contra}</td>
                <td className="n">{saldoBR(l.saldo)}</td>
                <td className="n col-opc">{l.vermelhos || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Uma legenda só, no fim da página — não repetida em cada regional. */
function Legenda() {
  return (
    <Cartao>
      <div className="legenda" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
        <div className="zonas">
          <span className="zona ouro">
            <i /> 1º e 2º · Final Ouro
          </span>
          <span className="zona prata">
            <i /> 3º e 4º · Final Prata
          </span>
          <span className="zona bronze">
            <i /> 5º e 6º · Final Bronze
          </span>
        </div>
        <div className="abrev">
          <strong>P</strong> pontos · <strong>J</strong> jogos ·{" "}
          <strong>V</strong> vitórias · <strong>E</strong> empates ·{" "}
          <strong>D</strong> derrotas · <strong>GP</strong> gols marcados ·{" "}
          <strong>GC</strong> gols sofridos · <strong>SG</strong> saldo de gols ·{" "}
          <strong>CV</strong> cartões vermelhos
        </div>
        <div className="abrev" style={{ marginTop: "0.5rem" }}>
          Vitória vale 3 pontos e empate vale 1. Em caso de empate na
          pontuação, decide nesta ordem: confronto direto, número de vitórias,
          saldo de gols, cartões vermelhos e gols marcados.
        </div>
      </div>
    </Cartao>
  );
}
