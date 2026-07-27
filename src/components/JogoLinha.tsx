import { useState } from "react";
import { useStore } from "../state/store";
import { dataBR } from "../lib/format";
import { placar } from "../lib/standings";
import { SeloStatus, nomeCurto } from "./ui";
import type { Jogo, StatusJogo, Time } from "../lib/types";

/** Linha de jogo com edição de placar, W.O., data, local e status. */
export function JogoLinha({
  jogo,
  mostrarFase,
  /** Some com "3ª rodada" quando o título do grupo já diz isso. */
  semRodada,
}: {
  jogo: Jogo;
  mostrarFase?: string;
  semRodada?: boolean;
}) {
  const { times, isAdmin, salvarJogo, toast } = useStore();
  const [aberto, setAberto] = useState(false);

  const mandante = times.find((t) => t.id === jogo.mandante_id);
  const visitante = times.find((t) => t.id === jogo.visitante_id);
  const p = placar(jogo);

  return (
    <div className="jogo">
      <div className="casa">
        <NomeOuSlot time={mandante} slot={jogo.mandante_slot} />
      </div>
      <div className="placar">
        {p ? (
          `${p.casa} × ${p.fora}`
        ) : (
          <span className="vs">×</span>
        )}
      </div>
      <div className="fora">
        <NomeOuSlot time={visitante} slot={jogo.visitante_slot} />
      </div>

      <div className="meta">
        {/* Um jogo encerrado já se explica pelo placar; repetir
            "Encerrado" em toda linha é ruído. O selo só aparece
            quando a situação NÃO é a normal. */}
        {jogo.status !== "encerrado" && <SeloStatus status={jogo.status} />}
        {mostrarFase && <span>{mostrarFase}</span>}
        {jogo.rodada != null && !semRodada && <span>{jogo.rodada}ª rodada</span>}
        {jogo.data ? (
          <span>
            {dataBR(jogo.data)}
            {jogo.horario ? ` · ${jogo.horario}` : ""}
          </span>
        ) : (
          jogo.status === "agendado" && <span>data a definir</span>
        )}
        {jogo.local && <span>{jogo.local}</span>}
        {jogo.observacoes && (
          <span className="obs" title={jogo.observacoes}>
            {jogo.observacoes}
          </span>
        )}
        {isAdmin && (
          <button className="discreto" onClick={() => setAberto((v) => !v)}>
            {aberto ? "fechar" : "editar"}
          </button>
        )}
      </div>

      {aberto && isAdmin && (
        <Editor
          jogo={jogo}
          mandante={mandante}
          visitante={visitante}
          aoSalvar={async (campos) => {
            await salvarJogo(jogo.id, campos);
            toast("Jogo atualizado.");
            setAberto(false);
          }}
        />
      )}
    </div>
  );
}

function NomeOuSlot({ time, slot }: { time?: Time; slot: string | null }) {
  if (time) return <span className="time">{nomeCurto(time)}</span>;
  return <span className="slot">{slot ?? "a definir"}</span>;
}

function Editor({
  jogo,
  mandante,
  visitante,
  aoSalvar,
}: {
  jogo: Jogo;
  mandante?: Time;
  visitante?: Time;
  aoSalvar: (campos: Partial<Jogo>) => Promise<void>;
}) {
  const [golsCasa, setGolsCasa] = useState(jogo.gols_mandante ?? 0);
  const [golsFora, setGolsFora] = useState(jogo.gols_visitante ?? 0);
  const [data, setData] = useState(jogo.data ?? "");
  const [horario, setHorario] = useState(jogo.horario ?? "");
  const [local, setLocal] = useState(jogo.local ?? "");
  const [obs, setObs] = useState(jogo.observacoes ?? "");
  const semTimes = !jogo.mandante_id || !jogo.visitante_id;

  const comuns = (): Partial<Jogo> => ({
    data: data || null,
    horario: horario || null,
    local: local || null,
    observacoes: obs || null,
  });

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        borderTop: "1px dashed var(--creme-300)",
        marginTop: "0.5rem",
        paddingTop: "0.7rem",
      }}
      className="pilha"
    >
      <div className="linha">
        <label className="campo">
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="campo">
          Horário
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
          />
        </label>
        <label className="campo" style={{ flex: 1, minWidth: "9rem" }}>
          Local (campo)
          <input value={local} onChange={(e) => setLocal(e.target.value)} />
        </label>
      </div>

      <label className="campo">
        Observações
        <input
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="ex.: jogo interrompido aos 55' — Art. 16"
        />
      </label>

      {semTimes ? (
        <p className="dica">
          Os times deste confronto ainda não foram definidos. Assim que a fase
          anterior fechar, eles aparecem aqui automaticamente e o placar pode
          ser lançado.
        </p>
      ) : (
        <div className="linha">
          <span className="dica" style={{ minWidth: "4.5rem" }}>
            {nomeCurto(mandante)}
          </span>
          <input
            type="number"
            min={0}
            value={golsCasa}
            onChange={(e) => setGolsCasa(Number(e.target.value))}
          />
          <span style={{ opacity: 0.4 }}>×</span>
          <input
            type="number"
            min={0}
            value={golsFora}
            onChange={(e) => setGolsFora(Number(e.target.value))}
          />
          <span className="dica">{nomeCurto(visitante)}</span>
        </div>
      )}

      <div className="linha">
        <button
          className="primario"
          disabled={semTimes}
          onClick={() =>
            aoSalvar({
              ...comuns(),
              status: "encerrado",
              gols_mandante: golsCasa,
              gols_visitante: golsFora,
              wo_favoravel: null,
            })
          }
        >
          Encerrar com este placar
        </button>
        <button onClick={() => aoSalvar({ ...comuns(), status: jogo.status })}>
          Só salvar data/local
        </button>
      </div>

      <div className="linha">
        <span className="dica" style={{ width: "100%" }}>
          W.O. — Art. 24: a equipe vencedora leva 3×0.
        </span>
        <button
          className="perigo"
          disabled={semTimes}
          onClick={() =>
            aoSalvar({
              ...comuns(),
              status: "wo",
              wo_favoravel: "mandante",
              gols_mandante: 3,
              gols_visitante: 0,
            })
          }
        >
          W.O. p/ {nomeCurto(mandante)}
        </button>
        <button
          className="perigo"
          disabled={semTimes}
          onClick={() =>
            aoSalvar({
              ...comuns(),
              status: "wo",
              wo_favoravel: "visitante",
              gols_mandante: 0,
              gols_visitante: 3,
            })
          }
        >
          W.O. p/ {nomeCurto(visitante)}
        </button>
      </div>

      <div className="linha">
        <SeletorStatus
          atual={jogo.status}
          aoTrocar={(status) => aoSalvar({ ...comuns(), status })}
        />
        {(jogo.status === "encerrado" || jogo.status === "wo") && (
          <button
            className="discreto"
            onClick={() =>
              aoSalvar({
                ...comuns(),
                status: "agendado",
                gols_mandante: null,
                gols_visitante: null,
                wo_favoravel: null,
              })
            }
          >
            Desfazer resultado
          </button>
        )}
      </div>
    </div>
  );
}

function SeletorStatus({
  atual,
  aoTrocar,
}: {
  atual: StatusJogo;
  aoTrocar: (s: StatusJogo) => void;
}) {
  return (
    <label className="campo">
      Situação
      <select value={atual} onChange={(e) => aoTrocar(e.target.value as StatusJogo)}>
        <option value="agendado">A realizar</option>
        <option value="adiado">Adiado (Art. 23)</option>
        <option value="encerrado">Encerrado</option>
        <option value="wo">W.O.</option>
        <option value="anulado">Anulado (Art. 13 §2º)</option>
      </select>
    </label>
  );
}
