import { useState } from "react";
import { useStore } from "../state/store";
import { pendenciasDoTime } from "../lib/disciplina";
import { plural } from "../lib/format";
import { Cartao, Vazio } from "../components/ui";
import type { Time } from "../lib/types";

export function Times() {
  const { regionais, times } = useStore();
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <>
      <Cartao>
        <p className="dica" style={{ margin: 0 }}>
          Art. 13 — cada atleta só pode jogar por uma equipe; atleta em duas
          equipes é eliminado e as partidas em que atuou irregularmente são
          anuladas, com W.O. ao adversário (§§ 1º e 2º). A inscrição vai até um
          dia antes de cada jogo e a lista <strong>fecha</strong> um dia antes
          do jogo da 3ª rodada, valendo fechada para todo o resto da Copa (§ 3º).
        </p>
      </Cartao>

      {regionais.map((r) => (
        <Cartao key={r.id} titulo={r.nome}>
          {times
            .filter((t) => t.regional_id === r.id)
            .map((t) => (
              <BlocoTime
                key={t.id}
                time={t}
                aberto={aberto === t.id}
                alternar={() => setAberto((a) => (a === t.id ? null : t.id))}
              />
            ))}
        </Cartao>
      ))}
    </>
  );
}

function BlocoTime({
  time,
  aberto,
  alternar,
}: {
  time: Time;
  aberto: boolean;
  alternar: () => void;
}) {
  const {
    jogadores,
    cartoes,
    isAdmin,
    salvarTime,
    criarJogador,
    apagarJogador,
    toast,
  } = useStore();
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");

  const elenco = jogadores.filter((p) => p.time_id === time.id);
  const suspensos = pendenciasDoTime(cartoes, time.id);

  async function adicionar() {
    if (!nome.trim()) return;
    await criarJogador(time.id, nome, {
      numero: numero ? Number(numero) : null,
    });
    setNome("");
    setNumero("");
  }

  return (
    <div style={{ borderBottom: "1px solid var(--creme-200)", padding: "0.55rem 0" }}>
      <div className="linha">
        <button className="discreto" onClick={alternar}>
          {aberto ? "▾" : "▸"}
        </button>
        <strong style={{ fontSize: "0.92rem" }}>{time.nome}</strong>
        <span className="dica">{plural(elenco.length, "atleta", "atletas")}</span>
        {time.lista_fechada && <span className="selo ok">lista fechada</span>}
        {time.desistente && <span className="selo grave">desistente</span>}
        {suspensos.length > 0 && (
          <span className="selo risco">
            {plural(suspensos.length, "suspensão", "suspensões")}
          </span>
        )}
      </div>

      {aberto && (
        <div style={{ paddingLeft: "1.6rem", marginTop: "0.5rem" }} className="pilha">
          {isAdmin && (
            <div className="linha">
              <label className="campo" style={{ flex: 1, minWidth: "8rem" }}>
                Responsável (Comissão, Art. 4º)
                <input
                  defaultValue={time.responsavel ?? ""}
                  onBlur={(e) =>
                    e.target.value !== (time.responsavel ?? "") &&
                    salvarTime(time.id, { responsavel: e.target.value || null })
                  }
                />
              </label>
              <label className="campo" style={{ flex: 1, minWidth: "8rem" }}>
                Contato
                <input
                  defaultValue={time.contato ?? ""}
                  onBlur={(e) =>
                    e.target.value !== (time.contato ?? "") &&
                    salvarTime(time.id, { contato: e.target.value || null })
                  }
                />
              </label>
            </div>
          )}

          {isAdmin && (
            <div className="linha">
              <label
                className="linha"
                style={{ gap: "0.35rem", fontSize: "0.82rem", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={time.lista_fechada}
                  onChange={(e) => {
                    salvarTime(time.id, { lista_fechada: e.target.checked });
                    toast(
                      e.target.checked
                        ? "Lista fechada — Art. 13 §3º."
                        : "Lista reaberta."
                    );
                  }}
                />
                Lista de inscritos fechada (Art. 13 §3º)
              </label>
              <label
                className="linha"
                style={{ gap: "0.35rem", fontSize: "0.82rem", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={time.desistente}
                  onChange={(e) => salvarTime(time.id, { desistente: e.target.checked })}
                />
                Fora da competição
              </label>
            </div>
          )}

          {elenco.length === 0 ? (
            <Vazio>Nenhum atleta inscrito.</Vazio>
          ) : (
            <div className="rolagem">
              <table>
                <thead>
                  <tr>
                    <th className="n">Nº</th>
                    <th>Atleta</th>
                    <th>Situação</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {elenco.map((p) => {
                    const susp = suspensos.find((s) => s.cartao.jogador_id === p.id);
                    return (
                      <tr key={p.id}>
                        <td className="n">{p.numero ?? "—"}</td>
                        <td>{p.nome}</td>
                        <td>
                          {susp ? (
                            <span className="selo risco">
                              {susp.definitiva
                                ? "fora da Copa"
                                : `suspenso ${plural(susp.restantes, "jogo", "jogos")}`}
                            </span>
                          ) : (
                            <span className="dica">livre</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              className="discreto"
                              onClick={() => apagarJogador(p.id)}
                              title="Remover da lista"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && !time.lista_fechada && (
            <div className="linha">
              <input
                placeholder="Nome do atleta"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
                style={{ flex: 1, minWidth: "9rem" }}
              />
              <input
                type="number"
                placeholder="nº"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <button onClick={adicionar} disabled={!nome.trim()}>
                Inscrever
              </button>
            </div>
          )}
          {isAdmin && time.lista_fechada && (
            <p className="dica">
              Lista fechada pelo Art. 13 §3º — desmarque acima para incluir
              alguém (a Comissão precisa deliberar).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
