import type { ReactNode } from "react";
import type { Serie, StatusJogo, Time } from "../lib/types";

export function Cartao({
  children,
  titulo,
  acao,
}: {
  children: ReactNode;
  titulo?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <section className="cartao">
      {(titulo || acao) && (
        <div className="linha" style={{ marginBottom: "0.6rem" }}>
          {titulo && <h2 style={{ margin: 0 }}>{titulo}</h2>}
          {acao && <div className="espaco">{acao}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Metrica({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return (
    <div className="metrica">
      <div className="valor">{valor}</div>
      <div className="rotulo">{rotulo}</div>
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>;
}

export function Aviso({
  children,
  erro,
}: {
  children: ReactNode;
  erro?: boolean;
}) {
  return <div className={erro ? "aviso erro" : "aviso"}>{children}</div>;
}

export function SeloSerie({ serie }: { serie: Serie }) {
  const rot = { ouro: "Ouro", prata: "Prata", bronze: "Bronze" }[serie];
  return <span className={`selo ${serie}`}>{rot}</span>;
}

export function SeloStatus({ status }: { status: StatusJogo }) {
  const mapa: Record<StatusJogo, { classe: string; texto: string }> = {
    agendado: { classe: "espera", texto: "A realizar" },
    encerrado: { classe: "ok", texto: "Encerrado" },
    wo: { classe: "risco", texto: "W.O." },
    adiado: { classe: "risco", texto: "Adiado" },
    anulado: { classe: "grave", texto: "Anulado" },
  };
  const { classe, texto } = mapa[status];
  return <span className={`selo ${classe}`}>{texto}</span>;
}

/** Nome curto quando existir — as tabelas ficam legíveis no celular. */
export function nomeCurto(t: Time | undefined): string {
  return t?.apelido || t?.nome || "—";
}

export function Artigo({ children }: { children: ReactNode }) {
  return <p className="artigo">{children}</p>;
}
