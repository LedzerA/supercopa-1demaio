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
import { Historico } from "./views/Historico";

/* A navegação é dividida em duas. Quem chega no site quer ver a
   tabela do seu time e quando ele joga — nada além disso. As telas
   de operação da Copa só aparecem para quem administra, senão o
   visitante encara oito abas das quais três não lhe dizem respeito. */
const ABAS_PUBLICAS = [
  { rota: "", nome: "Tabelas" },
  { rota: "jogos", nome: "Jogos" },
  { rota: "lima-barreto", nome: "Fase Final" },
  { rota: "times", nome: "Times" },
  { rota: "regulamento", nome: "Regras" },
  { rota: "historico", nome: "Histórico" },
];

const ABAS_ADMIN = [
  { rota: "painel", nome: "Painel" },
  { rota: "disciplina", nome: "Disciplina" },
  { rota: "financeiro", nome: "Financeiro" },
];

export function App() {
  const { autenticado, isAdmin, email, sair, carregando, erro, aviso } = useStore();
  const hash = useHash();
  const rota = partes(hash)[0] ?? "";
  const abas = isAdmin ? [...ABAS_PUBLICAS, ...ABAS_ADMIN] : ABAS_PUBLICAS;

  return (
    <>
      <header className="topo">
        <a
          className="marca-topo"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            irPara("#/");
          }}
        >
          <h1>
            {COPA.nome} <span className="ano">{COPA.edicao}</span>
          </h1>
          <div className="sub">{COPA.liga}</div>
        </a>
        <div className="direita">
          {autenticado ? (
            <>
              <span className="quem">{email}</span>
              <button className="botao-topo" onClick={sair}>
                Sair
              </button>
            </>
          ) : (
            <button className="botao-topo" onClick={() => irPara("#/entrar")}>
              Entrar
            </button>
          )}
        </div>
      </header>

      <nav className="abas" aria-label="Seções do site">
        {abas.map((a) => (
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
        {autenticado && !isAdmin && (
          <Aviso>
            <strong>Você está em modo leitura.</strong> Sua conta não está na
            lista de administradores desta competição. Para liberar, rode{" "}
            <code>supabase/admins.sql</code> com este e-mail.
          </Aviso>
        )}
        {erro && <Aviso erro>{erro}</Aviso>}
        {carregando ? (
          <p className="vazio">Carregando…</p>
        ) : rota === "entrar" ? (
          <Entrar />
        ) : (
          <Conteudo rota={rota} isAdmin={isAdmin} />
        )}
      </main>

      <footer className="rodape">
        <p>
          {COPA.nome} {COPA.edicao} · {COPA.liga}
        </p>
        <p>Futebol de várzea antifascista da Grande São Paulo.</p>
      </footer>

      {aviso && <div className="toast">{aviso}</div>}
    </>
  );
}

function Conteudo({ rota, isAdmin }: { rota: string; isAdmin: boolean }) {
  switch (rota) {
    case "jogos":
      return <Jogos />;
    case "lima-barreto":
      return <LimaBarreto />;
    case "times":
      return <Times />;
    case "regulamento":
      return <Regulamento />;
    case "historico":
      return <Historico />;
    case "painel":
      return isAdmin ? <Painel /> : <Regionais />;
    case "disciplina":
      return <Disciplina />;
    case "financeiro":
      return <Financeiro />;
    default:
      // A porta de entrada é a classificação: é o que praticamente
      // todo mundo veio ver.
      return <Regionais />;
  }
}
