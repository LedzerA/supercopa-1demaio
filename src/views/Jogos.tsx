import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import { jogoVale } from "../lib/standings";
import { ROTULO_SERIE } from "../lib/bracket";
import { Cartao, Vazio } from "../components/ui";
import { JogoLinha } from "../components/JogoLinha";
import type { Jogo, Regional } from "../lib/types";

type Filtro = "todos" | "pendentes" | "realizados";

export function Jogos() {
  const { regionais, times, jogos, isAdmin, criarJogo, toast } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("pendentes");
  const [regional, setRegional] = useState<string>("todas");
  const [timeId, setTimeId] = useState<string>("todos");
  const [novo, setNovo] = useState(false);

  const lista = useMemo(() => {
    return jogos.filter((j) => {
      if (filtro === "pendentes" && jogoVale(j)) return false;
      if (filtro === "realizados" && !jogoVale(j)) return false;
      if (regional !== "todas" && j.regional_id !== regional) return false;
      if (timeId !== "todos" && j.mandante_id !== timeId && j.visitante_id !== timeId)
        return false;
      return true;
    });
  }, [jogos, filtro, regional, timeId]);

  const grupos = useMemo(() => agrupar(lista, regionais), [lista, regionais]);

  return (
    <>
      <Cartao>
        <div className="filtros">
          <label className="campo">
            Meu time
            <select value={timeId} onChange={(e) => setTimeId(e.target.value)}>
              <option value="todos">Todos os times</option>
              {times.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Mostrar
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="pendentes">Próximos jogos</option>
              <option value="realizados">Jogos já disputados</option>
              <option value="todos">Todos</option>
            </select>
          </label>
          <label className="campo">
            Regional
            <select value={regional} onChange={(e) => setRegional(e.target.value)}>
              <option value="todas">Todas</option>
              {regionais.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>
          {isAdmin && (
            <button onClick={() => setNovo((v) => !v)}>
              {novo ? "cancelar" : "+ jogo"}
            </button>
          )}
        </div>
      </Cartao>

      {novo && isAdmin && (
        <NovoJogo
          aoCriar={async (campos) => {
            await criarJogo(campos);
            toast("Jogo criado.");
            setNovo(false);
          }}
        />
      )}

      {grupos.length === 0 && (
        <Cartao>
          <Vazio>
            Nenhum jogo encontrado. Tente mudar o filtro acima.
          </Vazio>
        </Cartao>
      )}

      {grupos.map((g) => (
        <Cartao key={g.chave} titulo={g.titulo}>
          {g.jogos.map((j) => (
            <JogoLinha key={j.id} jogo={j} semRodada />
          ))}
        </Cartao>
      ))}
    </>
  );
}

type Grupo = { chave: string; titulo: string; jogos: Jogo[] };

/** Agrupa por regional+rodada na fase regional, e por série nas finais. */
function agrupar(jogos: Jogo[], regionais: Regional[]): Grupo[] {
  const nomeRegional = (id: string | null) =>
    regionais.find((r) => r.id === id)?.nome ?? "Sem regional";
  const mapa = new Map<string, Grupo>();
  for (const j of jogos) {
    let chave: string;
    let titulo: string;
    if (j.fase === "regional") {
      chave = `${j.regional_id}-${j.rodada}`;
      titulo = `${nomeRegional(j.regional_id)} — ${j.rodada}ª rodada`;
    } else if (j.fase === "final_regional") {
      chave = `fin-${j.regional_id}-${j.serie}`;
      titulo = `${nomeRegional(j.regional_id)} — Final ${
        j.serie ? ROTULO_SERIE[j.serie] : ""
      }`;
    } else {
      chave = `lb-${j.serie}`;
      titulo = `Fase Lima Barreto — ${j.serie ? ROTULO_SERIE[j.serie] : ""}`;
    }
    if (!mapa.has(chave)) mapa.set(chave, { chave, titulo, jogos: [] });
    mapa.get(chave)!.jogos.push(j);
  }
  return [...mapa.values()];
}

function NovoJogo({ aoCriar }: { aoCriar: (c: Partial<Jogo>) => Promise<void> }) {
  const { regionais, times } = useStore();
  const [regional, setRegional] = useState(regionais[0]?.id ?? "");
  const [rodada, setRodada] = useState(1);
  const [casa, setCasa] = useState("");
  const [fora, setFora] = useState("");

  const doGrupo = times.filter((t) => t.regional_id === regional);

  return (
    <Cartao titulo="Novo jogo">
      <p className="dica" style={{ marginTop: 0 }}>
        Use para partidas remarcadas ou que faltaram no calendário. Os
        confrontos das fases finais já existem — não precisa criar.
      </p>
      <div className="linha">
        <label className="campo">
          Regional
          <select
            value={regional}
            onChange={(e) => {
              setRegional(e.target.value);
              setCasa("");
              setFora("");
            }}
          >
            {regionais.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Rodada
          <input
            type="number"
            min={1}
            max={9}
            value={rodada}
            onChange={(e) => setRodada(Number(e.target.value))}
          />
        </label>
        <label className="campo" style={{ flex: 1, minWidth: "8rem" }}>
          Mandante
          <select value={casa} onChange={(e) => setCasa(e.target.value)}>
            <option value="">escolha…</option>
            {doGrupo.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo" style={{ flex: 1, minWidth: "8rem" }}>
          Visitante
          <select value={fora} onChange={(e) => setFora(e.target.value)}>
            <option value="">escolha…</option>
            {doGrupo
              .filter((t) => t.id !== casa)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
          </select>
        </label>
        <button
          className="primario"
          disabled={!casa || !fora}
          onClick={() =>
            aoCriar({
              regional_id: regional,
              fase: "regional",
              rodada,
              mandante_id: casa,
              visitante_id: fora,
            })
          }
        >
          Criar
        </button>
      </div>
    </Cartao>
  );
}
