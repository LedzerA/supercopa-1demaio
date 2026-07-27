import { useStore } from "../state/store";
import { COPA } from "../config";
import { dinheiro } from "../lib/format";
import { Cartao, Metrica, Vazio, nomeCurto } from "../components/ui";

export function Financeiro() {
  const { regionais, times, pagamentos, isAdmin, salvarPagamento, toast } = useStore();

  const total = times.length * COPA.taxaPorEquipe;
  const pago = pagamentos.filter((p) => p.pago).reduce((s, p) => s + Number(p.valor), 0);
  const emAberto = total - pago;
  const inadimplentes = times.filter((t) =>
    pagamentos.some((p) => p.time_id === t.id && !p.pago)
  ).length;

  return (
    <>
      <div className="metricas" style={{ marginBottom: "1rem" }}>
        <Metrica valor={dinheiro(total)} rotulo="Total previsto" />
        <Metrica valor={dinheiro(pago)} rotulo="Recebido" />
        <Metrica valor={dinheiro(emAberto)} rotulo="Em aberto" />
        <Metrica valor={inadimplentes} rotulo="Times com pendência" />
      </div>

      <Cartao>
        <p className="dica" style={{ margin: 0 }}>
          Art. 3º — a taxa é de <strong>{dinheiro(COPA.taxaPorEquipe)} por
          equipe</strong>, recolhida em {COPA.parcelas} parcelas iguais nos três
          primeiros jogos da fase regional, cobrindo troféus e parte da
          arbitragem. Art. 28 — quem não paga pode ser excluído da Copa, já que
          o dinheiro é dos trabalhadores da arbitragem e dos campos. Art. 24
          parágrafo único — quem dá W.O. paga a taxa do mesmo jeito.
        </p>
      </Cartao>

      {regionais.map((r) => {
        const doGrupo = times.filter((t) => t.regional_id === r.id);
        if (!doGrupo.length) return null;
        return (
          <Cartao key={r.id} titulo={r.nome}>
            <div className="rolagem">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    {[1, 2, 3].map((n) => (
                      <th key={n} className="n">
                        {n}ª parcela
                      </th>
                    ))}
                    <th className="n">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {doGrupo.map((t) => {
                    const doTime = pagamentos.filter((p) => p.time_id === t.id);
                    const quitado = doTime.length > 0 && doTime.every((p) => p.pago);
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{nomeCurto(t)}</td>
                        {[1, 2, 3].map((n) => {
                          const p = doTime.find((x) => x.parcela === n);
                          if (!p)
                            return (
                              <td key={n} className="n dica">
                                —
                              </td>
                            );
                          return (
                            <td key={n} className="n">
                              <label
                                style={{ cursor: isAdmin ? "pointer" : "default" }}
                                title={dinheiro(Number(p.valor))}
                              >
                                <input
                                  type="checkbox"
                                  style={{ width: "auto" }}
                                  checked={p.pago}
                                  disabled={!isAdmin}
                                  onChange={(e) => {
                                    salvarPagamento(p.id, {
                                      pago: e.target.checked,
                                      pago_em: e.target.checked
                                        ? new Date().toISOString().slice(0, 10)
                                        : null,
                                    });
                                    toast(
                                      `${nomeCurto(t)} — ${n}ª parcela ${
                                        e.target.checked ? "quitada" : "reaberta"
                                      }.`
                                    );
                                  }}
                                />
                              </label>
                            </td>
                          );
                        })}
                        <td className="n">
                          {quitado ? (
                            <span className="selo ok">em dia</span>
                          ) : (
                            <span className="selo risco">
                              {dinheiro(
                                doTime
                                  .filter((p) => !p.pago)
                                  .reduce((s, p) => s + Number(p.valor), 0)
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Cartao>
        );
      })}

      {pagamentos.length === 0 && (
        <Cartao>
          <Vazio>
            Nenhuma parcela cadastrada. Rode o bloco de pagamentos do seed.sql.
          </Vazio>
        </Cartao>
      )}
    </>
  );
}
