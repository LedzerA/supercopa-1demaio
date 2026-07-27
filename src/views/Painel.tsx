import { useMemo } from "react";
import { useStore } from "../state/store";
import { irPara } from "../lib/router";
import { jogoVale } from "../lib/standings";
import { pendencias } from "../lib/disciplina";
import { COPA } from "../config";
import { dinheiro } from "../lib/format";
import { Cartao, Metrica, Vazio } from "../components/ui";
import { JogoLinha } from "../components/JogoLinha";

export function Painel() {
  const { regionais, times, jogos, cartoes, pagamentos } = useStore();

  const regionaisJogos = jogos.filter((j) => j.fase === "regional");
  const feitos = regionaisJogos.filter(jogoVale).length;
  const faltam = regionaisJogos.length - feitos;

  const suspensos = pendencias(cartoes).length;
  const arrecadado = pagamentos
    .filter((p) => p.pago)
    .reduce((s, p) => s + Number(p.valor), 0);
  const total = times.length * COPA.taxaPorEquipe;

  /** Próximos jogos: os com data marcada, e depois os sem data. */
  const aRealizar = useMemo(() => {
    const pendentes = jogos.filter(
      (j) => !jogoVale(j) && j.status !== "anulado" && j.mandante_id && j.visitante_id
    );
    return pendentes.sort((a, b) => {
      if (a.data && b.data) return a.data.localeCompare(b.data);
      if (a.data) return -1;
      if (b.data) return 1;
      return (a.rodada ?? 99) - (b.rodada ?? 99) || a.ordem - b.ordem;
    });
  }, [jogos]);

  const semData = aRealizar.filter((j) => !j.data);

  return (
    <>
      <div className="metricas" style={{ marginBottom: "1rem" }}>
        <Metrica valor={`${feitos}/${regionaisJogos.length}`} rotulo="Jogos da fase regional" />
        <Metrica valor={faltam} rotulo="Jogos a realizar" />
        <Metrica valor={suspensos} rotulo="Suspensões em aberto" />
        <Metrica
          valor={dinheiro(arrecadado).replace("R$", "").trim()}
          rotulo={`Arrecadado de ${dinheiro(total)}`}
        />
      </div>

      {semData.length > 0 && (
        <Cartao
          titulo={`${semData.length} jogo${semData.length > 1 ? "s" : ""} sem data marcada`}
          acao={
            <button className="discreto" onClick={() => irPara("#/jogos")}>
              ver todos
            </button>
          }
        >
          <p className="dica" style={{ marginTop: 0 }}>
            Art. 8º — as datas valem para o fim de semana correspondente, com o
            mandante escolhendo entre sábado, domingo ou data próxima.
            Reagendamento só por força maior; os demais casos geram W.O.
          </p>
          {semData.slice(0, 8).map((j) => (
            <JogoLinha key={j.id} jogo={j} mostrarFase={rotuloFase(j.fase)} />
          ))}
        </Cartao>
      )}

      <Cartao titulo="Andamento por regional">
        <div className="rolagem">
          <table>
            <thead>
              <tr>
                <th>Regional</th>
                <th>Região</th>
                <th className="n">Times</th>
                <th className="n">Realizados</th>
                <th className="n">A realizar</th>
              </tr>
            </thead>
            <tbody>
              {regionais.map((r) => {
                const daRegional = regionaisJogos.filter((j) => j.regional_id === r.id);
                const ok = daRegional.filter(jogoVale).length;
                return (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => irPara("#/regionais")}
                  >
                    <td>{r.nome}</td>
                    <td className="dica">{r.regiao}</td>
                    <td className="n">{times.filter((t) => t.regional_id === r.id).length}</td>
                    <td className="n">{ok}</td>
                    <td className="n">{daRegional.length - ok}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cartao>

      <Cartao titulo="Próximos jogos com data">
        {aRealizar.filter((j) => j.data).length === 0 ? (
          <Vazio>Nenhum jogo com data marcada ainda.</Vazio>
        ) : (
          aRealizar
            .filter((j) => j.data)
            .slice(0, 10)
            .map((j) => <JogoLinha key={j.id} jogo={j} mostrarFase={rotuloFase(j.fase)} />)
        )}
      </Cartao>
    </>
  );
}

export function rotuloFase(fase: string): string {
  if (fase === "regional") return "Fase Regional";
  if (fase === "final_regional") return "Final Regional";
  return "Fase Lima Barreto";
}
