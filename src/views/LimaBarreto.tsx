import { useMemo } from "react";
import { useStore } from "../state/store";
import {
  ROTULO_SERIE,
  SERIES,
  campanhas,
  classificadosSerie,
  montarChave,
  type ClassificadosSerie,
  type ConfrontoChave,
} from "../lib/bracket";
import { Aviso, Cartao, Vazio, nomeCurto } from "../components/ui";
import { JogoLinha } from "../components/JogoLinha";
import type { LinhaTabela, Serie } from "../lib/types";

export function LimaBarreto() {
  const { times, jogos, cartoes, ajustes } = useStore();
  const campanha = useMemo(
    () => campanhas(times, jogos, cartoes, ajustes),
    [times, jogos, cartoes, ajustes]
  );

  return (
    <>
      <Cartao titulo="Fase Lima Barreto">
        <p className="dica" style={{ margin: 0 }}>
          Art. 6º — cada série reúne as 6 equipes das Finais Ouro / Prata /
          Bronze regionais: 3 campeãs e 3 vice-campeãs. As duas campeãs de
          melhor campanha acumulada entram direto na semifinal; as outras
          quatro fazem a repescagem.
        </p>
        <p className="dica">
          O regulamento não define os critérios de <em>melhor campanha
          acumulada</em>. A ordem sugerida abaixo usa a mesma lógica do Art. 9º
          (pontos → vitórias → saldo → gols feitos), somando fase regional e
          final regional. A Comissão Organizadora pode fixar outra ordem — e a
          ordem fixada sempre prevalece.
        </p>
      </Cartao>

      {SERIES.map((s) => (
        <BlocoSerie key={s} serie={s} campanha={campanha} />
      ))}
    </>
  );
}

function BlocoSerie({
  serie,
  campanha,
}: {
  serie: Serie;
  campanha: Map<string, LinhaTabela>;
}) {
  const {
    regionais,
    times,
    jogos,
    ranking,
    isAdmin,
    salvarJogo,
    fixarRanking,
    limparRanking,
    toast,
  } = useStore();

  const cls = useMemo(
    () => classificadosSerie(serie, regionais, times, jogos, campanha, ranking),
    [serie, regionais, times, jogos, campanha, ranking]
  );
  const chave = useMemo(() => montarChave(serie, cls, jogos), [serie, cls, jogos]);
  const daSerie = jogos.filter((j) => j.fase === "lima_barreto" && j.serie === serie);

  /** Grava os times resolvidos nos jogos reais da chave. */
  async function aplicarChave() {
    let mudou = 0;
    for (const c of chave) {
      const jogo = daSerie.find((j) => j.chave === c.chave);
      if (!jogo) continue;
      const precisa =
        (c.casa && jogo.mandante_id !== c.casa) ||
        (c.fora && jogo.visitante_id !== c.fora);
      if (!precisa) continue;
      await salvarJogo(jogo.id, {
        mandante_id: c.casa ?? jogo.mandante_id,
        visitante_id: c.fora ?? jogo.visitante_id,
      });
      mudou++;
    }
    toast(
      mudou
        ? `${mudou} confronto(s) atualizado(s) na ${ROTULO_SERIE[serie]}.`
        : "Nada a atualizar — a chave já está em dia."
    );
  }

  async function fixarOrdemSugerida() {
    const linhas = [
      ...cls.campeoes.map((id, i) => ({ id, papel: "campeao" as const, pos: i + 1 })),
      ...cls.vices.map((id, i) => ({ id, papel: "vice" as const, pos: i + 1 })),
    ].filter((l): l is { id: string; papel: "campeao" | "vice"; pos: number } => !!l.id);
    if (linhas.length < 6) {
      toast("A ordem só pode ser fixada quando as 6 equipes estiverem definidas.");
      return;
    }
    await fixarRanking(
      linhas.map((l) => ({
        serie,
        papel: l.papel,
        posicao: l.pos,
        time_id: l.id,
      }))
    );
    toast(`Ordem da ${ROTULO_SERIE[serie]} fixada.`);
  }

  return (
    <Cartao
      titulo={
        <span>
          {ROTULO_SERIE[serie]} <span className={`selo ${serie}`}>Lima Barreto</span>
        </span>
      }
    >
      {cls.pendentes.length > 0 && (
        <Aviso>
          Ainda falta decidir a Final {ROTULO_SERIE[serie]} de:{" "}
          <strong>{cls.pendentes.join(", ")}</strong>. A chave abaixo fica
          incompleta até lá.
        </Aviso>
      )}

      <div className="grade duas">
        <Ordem titulo="Campeões" ids={cls.campeoes} papel="campeão" campanha={campanha} />
        <Ordem titulo="Vice-campeões" ids={cls.vices} papel="vice" campanha={campanha} />
      </div>

      {isAdmin && (
        <div className="linha" style={{ marginTop: "0.7rem" }}>
          {cls.manual ? (
            <>
              <span className="selo ok">ordem fixada pela Comissão</span>
              <button className="discreto" onClick={() => limparRanking(serie)}>
                voltar à ordem sugerida
              </button>
            </>
          ) : (
            <button onClick={fixarOrdemSugerida}>Fixar esta ordem</button>
          )}
          <button className="primario espaco" onClick={aplicarChave}>
            Aplicar chave nos jogos
          </button>
        </div>
      )}

      <h3 style={{ marginTop: "1.2rem" }}>Chaveamento</h3>
      {daSerie.length === 0 ? (
        <Vazio>Jogos da Lima Barreto não cadastrados. Rode o seed.sql.</Vazio>
      ) : (
        <div className="chave">
          {(["repescagem", "semifinal", "final"] as const).map((etapa) => (
            <div key={etapa}>
              <div className="etapa">{rotuloEtapa(etapa)}</div>
              {chave
                .filter((c) => c.etapa === etapa)
                .map((c) => (
                  <Confronto key={c.chave} confronto={c} serie={serie} />
                ))}
            </div>
          ))}
        </div>
      )}
    </Cartao>
  );
}

function rotuloEtapa(e: "repescagem" | "semifinal" | "final"): string {
  return { repescagem: "Repescagem", semifinal: "Semifinais", final: "Final" }[e];
}

function Confronto({
  confronto,
  serie,
}: {
  confronto: ConfrontoChave;
  serie: Serie;
}) {
  const { jogos, times } = useStore();
  const jogo = jogos.find(
    (j) => j.fase === "lima_barreto" && j.serie === serie && j.chave === confronto.chave
  );
  const casa = times.find((t) => t.id === confronto.casa);
  const fora = times.find((t) => t.id === confronto.fora);
  const definido = !!(confronto.casa && confronto.fora);

  return (
    <div className={definido ? "confronto definido" : "confronto"}>
      <div className="rot">{confronto.rotulo}</div>
      <div className="dica" style={{ marginBottom: "0.2rem" }}>
        {confronto.casaSlot} <span style={{ opacity: 0.5 }}>×</span>{" "}
        {confronto.foraSlot}
      </div>
      {!jogo ? (
        <div className="dica">
          {casa ? nomeCurto(casa) : "?"} × {fora ? nomeCurto(fora) : "?"}
        </div>
      ) : (
        <JogoLinha jogo={jogo} />
      )}
      {definido &&
        jogo &&
        (jogo.mandante_id !== confronto.casa || jogo.visitante_id !== confronto.fora) && (
          <p className="dica" style={{ color: "var(--alerta)" }}>
            Os times deste confronto mudaram. Use <em>Aplicar chave nos jogos</em>{" "}
            acima para gravar {casa ? nomeCurto(casa) : "?"} ×{" "}
            {fora ? nomeCurto(fora) : "?"}.
          </p>
        )}
    </div>
  );
}

function Ordem({
  titulo,
  ids,
  papel,
  campanha,
}: {
  titulo: string;
  ids: ClassificadosSerie["campeoes"];
  papel: string;
  campanha: Map<string, LinhaTabela>;
}) {
  const { times } = useStore();
  return (
    <div>
      <h3>{titulo}</h3>
      <div className="rolagem">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Time</th>
              <th className="n">P</th>
              <th className="n">V</th>
              <th className="n">SG</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id, i) => {
              const t = times.find((x) => x.id === id);
              const l = id ? campanha.get(id) : undefined;
              return (
                <tr key={i}>
                  <td className="pos">{i + 1}º</td>
                  <td>
                    {t ? (
                      <span style={{ fontWeight: 600 }}>{nomeCurto(t)}</span>
                    ) : (
                      <span className="slot">
                        {i + 1}º melhor {papel}
                      </span>
                    )}
                  </td>
                  <td className="n">{l?.pontos ?? "—"}</td>
                  <td className="n">{l?.vitorias ?? "—"}</td>
                  <td className="n">{l?.saldo ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
