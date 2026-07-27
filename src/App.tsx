import { COPA } from "./config";
import { irPara, partes, useHash } from "./lib/router";
import { useStore } from "./state/store";
import { Aviso } from "./components/ui";
import { Entrar } from "./views/Entrar";
import { Painel } from "./views/Painel";
import { Jogos } from "./views/Jogos";
import { Regionais } from "./views/Regionais";
import { LimaBarreto } from "./views/LimaBarreto";
import { Times } from "./views/Times";
import { Disciplina } from "./views/Disciplina";
import { Financeiro } from "./views/Financeiro";
import { Regulamento } from "./views/Regulamento";

const ABAS = [
  { rota: "", nome: "Painel" },
  { rota: "jogos", nome: "Jogos" },
  { rota: "regionais", nome: "Regionais" },
  { rota: "lima-barreto", nome: "Lima Barreto" },
  { rota: "times", nome: "Times" },
  { rota: "disciplina", nome: "Disciplina" },
  { rota: "financeiro", nome: "Financeiro" },
  { rota: "regulamento", nome: "Regulamento" },
];

export function App() {
  const { autenticado, isAdmin, email, sair, carregando, erro, aviso } = useStore();
  const hash = useHash();
  const rota = partes(hash)[0] ?? "";

  if (!autenticado) return <Entrar />;

  return (
    <>
      <header className="topo">
        <div>
          <h1>
            {COPA.nome} {COPA.edicao}
          </h1>
          <div className="sub">Administração · {COPA.liga}</div>
        </div>
        <div className="direita">
          <span className="quem">{email}</span>
          <button className="discreto" style={{ color: "#fdfaf4" }} onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <nav className="abas">
        {ABAS.map((a) => (
          <button
            key={a.rota}
            className={rota === a.rota ? "ativa" : ""}
            onClick={() => irPara(`#/${a.rota}`)}
          >
            {a.nome}
          </button>
        ))}
      </nav>

      <main>
        {!isAdmin && (
          <Aviso>
            <strong>Você está em modo leitura.</strong> Sua conta não está na
            lista de administradores <em>desta</em> competição. Ser admin do
            statsproleta não dá acesso aqui — os ambientes são separados. Para
            liberar, rode o <code>insert into copa_admins</code> descrito no
            final de <code>supabase/schema.sql</code>.
          </Aviso>
        )}
        {erro && <Aviso erro>{erro}</Aviso>}
        {carregando ? (
          <p className="vazio">Carregando…</p>
        ) : (
          <Conteudo rota={rota} />
        )}
      </main>

      {aviso && <div className="toast">{aviso}</div>}
    </>
  );
}

function Conteudo({ rota }: { rota: string }) {
  switch (rota) {
    case "jogos":
      return <Jogos />;
    case "regionais":
      return <Regionais />;
    case "lima-barreto":
      return <LimaBarreto />;
    case "times":
      return <Times />;
    case "disciplina":
      return <Disciplina />;
    case "financeiro":
      return <Financeiro />;
    case "regulamento":
      return <Regulamento />;
    default:
      return <Painel />;
  }
}
