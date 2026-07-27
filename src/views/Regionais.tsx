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
        <Vazio>Nenhuma regional cadastrada. Rode o seed.sql.</Vazio>
      </Cartao>
    );
  return (
    <>
      {regionais.map((r) => (
        <BlocoRegional key={r.id} regional={r} />
      ))}
    </>
  );
}

function BlocoRegional({ regional }: { regional: Regional }) {
  const { times, jogos, cartoes, ajustes, isAdmin, salvarJogo, toast } = useStore();

  const doGrupo = useMemo(
    () => times.filter((t) => t.regional_id === regional.id),
    [times, regional.id]
  );
  const jogosDoGrupo = useMemo(
    () => jogos.filter((j) => j.regional_id === regional.id),
    [jogos, regional.id]
  );
  const cartoesDoGrupo = useMemo(
    () => cartoes.filter((c) => doGrupo.some((t) => t.id === c.time_id)),
    [cartoes, doGrupo]
  );
  const ajustesDoGrupo = useMemo(
    () => ajustes.filter((a) => doGrupo.some((t) => t.id === a.time_id)),
    [ajustes, doGrupo]
  );

  const tabela = useMemo(
    () => classificacao(doGrupo, jogosDoGrupo, cartoesDoGrupo, ajustesDoGrupo),
    [doGrupo, jogosDoGrupo, cartoesDoGrupo, ajustesDoGrupo]
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

  return (
    <Cartao
      titulo={
        <span>
          {regional.nome}{" "}
          <span className="dica" style={{ fontWeight: 400 }}>
            · {regional.regiao}
          </span>
        </span>
      }
    >
      {faltam > 0 && (
        <Aviso>
          Faltam <strong>{faltam}</strong> jogo{faltam > 1 ? "s" : ""} para
          encerrar a fase regional. A classificação abaixo é parcial.
        </Aviso>
      )}

      {ajusteImportado.length > 0 && (
        <Aviso>
          Esta regional tem campanha lançada por <strong>ajuste manual</strong> (
          {ajusteImportado.length} time
          {ajusteImportado.length > 1 ? "s" : ""}), porque os placares jogo a
          jogo ainda não foram registrados. Ao cadastrar os jogos, apague os
          ajustes em <em>Disciplina → Ajustes de classificação</em> — senão a
          campanha conta duas vezes.
        </Aviso>
      )}

      <Tabela tabela={tabela} />

      <h3 style={{ marginTop: "1.2rem" }}>Finais da Fase Regional</h3>
      <p className="dica" style={{ marginTop: 0 }}>
        Art. 6º — Final Ouro 1º×2º, Prata 3º×4º, Bronze 5º×6º. Cada uma vale um
        troféu e define quem vai à Fase Lima Barreto.
      </p>
      {isAdmin && (
        <div className="linha" style={{ marginBottom: "0.5rem" }}>
          <button
            className={finaisDefinidas ? "" : "primario"}
            onClick={definirFinais}
            disabled={tabela.length < 6}
          >
            {finaisDefinidas
              ? "Regravar finais pela classificação atual"
              : "Definir finais pela classificação"}
          </button>
          {faltam > 0 && (
            <span className="dica">
              cuidado: a fase regional ainda não terminou
            </span>
          )}
        </div>
      )}
      {finais.length === 0 ? (
        <Vazio>Finais não cadastradas. Rode o seed.sql.</Vazio>
      ) : (
        SERIES.map((s) => {
          const j = finais.find((f) => f.serie === s);
          if (!j) return null;
          return (
            <div key={s}>
              <div className="etapa" style={{ marginTop: "0.4rem" }}>
                Final {ROTULO_SERIE[s]}
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
            <th className="n">P</th>
            <th className="n">J</th>
            <th className="n">V</th>
            <th className="n">E</th>
            <th className="n">D</th>
            <th className="n">GP</th>
            <th className="n">GC</th>
            <th className="n">SG</th>
            <th className="n" title="Cartões vermelhos — 4º critério de desempate">
              CV
            </th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((l, i) => {
            const pos = i + 1;
            const faixa = faixaDaPosicao(pos);
            return (
              <tr key={l.time.id} className={faixa ? `faixa-${faixa}` : ""}>
                <td className="pos">{pos}º</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{nomeCurto(l.time)}</span>
                  {l.time.desistente && (
                    <span className="selo grave" style={{ marginLeft: "0.4rem" }}>
                      desistente
                    </span>
                  )}
                  {l.desempate && (
                    <div className="dica" style={{ fontSize: "0.68rem" }}>
                      desempate: {l.desempate}
                    </div>
                  )}
                </td>
                <td className="n" style={{ fontWeight: 700 }}>
                  {l.pontos}
                </td>
                <td className="n">{l.jogos}</td>
                <td className="n">{l.vitorias}</td>
                <td className="n">{l.empates}</td>
                <td className="n">{l.derrotas}</td>
                <td className="n">{l.gols_pro}</td>
                <td className="n">{l.gols_contra}</td>
                <td className="n">{saldoBR(l.saldo)}</td>
                <td className="n">{l.vermelhos || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
