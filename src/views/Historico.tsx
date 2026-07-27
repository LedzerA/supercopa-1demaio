import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import { Cartao, Vazio } from "../components/ui";

const CATEGORIAS: Record<string, string> = {
  jogo: "Jogos",
  time: "Times",
  jogador: "Atletas",
  disciplina: "Disciplina",
  ajuste: "Ajustes",
  pagamento: "Pagamentos",
  chave: "Fase Final",
};

export function Historico() {
  const { log, isAdmin } = useStore();
  const [categoria, setCategoria] = useState("todas");

  const lista = useMemo(
    () => (categoria === "todas" ? log : log.filter((l) => l.categoria === categoria)),
    [log, categoria]
  );

  const presentes = useMemo(
    () => [...new Set(log.map((l) => l.categoria))].sort(),
    [log]
  );

  return (
    <>
      <Cartao>
        <div className="titulo-bloco">
          <h2>Registro de alterações</h2>
          <div className="lugar">Tudo que a Comissão mexe na competição</div>
        </div>
        <p className="explica" style={{ marginBottom: log.length ? "0.8rem" : 0 }}>
          Cada resultado lançado, data marcada, punição aplicada ou parcela
          quitada fica registrado aqui, com quem fez e quando. O registro é
          público e não pode ser apagado nem editado pelo site.
        </p>

        {presentes.length > 1 && (
          <div className="filtros">
            <label className="campo">
              Filtrar por
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="todas">Tudo</option>
                {presentes.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIAS[c] ?? c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Cartao>

      {log.length === 0 ? (
        <Cartao>
          <Vazio>
            Nenhuma alteração registrada ainda.
            {isAdmin && (
              <>
                <br />
                <span className="dica">
                  Se você já lançou resultados e nada aparece aqui, falta rodar{" "}
                  <code>supabase/log.sql</code> no Supabase.
                </span>
              </>
            )}
          </Vazio>
        </Cartao>
      ) : (
        <Cartao>
          <ol className="historico">
            {lista.map((l) => (
              <li key={l.id}>
                <div className="quando">{quandoBR(l.quando)}</div>
                <div className="oque">
                  <strong>{l.email ?? "administrador"}</strong> {l.descricao}
                </div>
                <span className="selo espera">
                  {CATEGORIAS[l.categoria] ?? l.categoria}
                </span>
              </li>
            ))}
          </ol>
        </Cartao>
      )}
    </>
  );
}

/** "27/07/2026 às 16h44" */
function quandoBR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const data = d.toLocaleDateString("pt-BR");
  const hora = d
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
  return `${data} às ${hora}`;
}
