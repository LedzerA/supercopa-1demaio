import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { irPara } from "../lib/router";
import { Aviso, Cartao } from "../components/ui";

export function Entrar() {
  const { entrar, autenticado, isAdmin } = useStore();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Entrou: volta para o painel. O site em si é público — esta tela
  // só existe para quem vai gerenciar.
  useEffect(() => {
    if (autenticado) irPara("#/");
  }, [autenticado]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const falha = await entrar(email, senha);
    if (falha) setErro(traduzir(falha));
    setEnviando(false);
  }

  if (autenticado) {
    return (
      <div className="entrar">
        <Cartao>
          <p className="dica" style={{ margin: 0 }}>
            {isAdmin
              ? "Você já está logado como administrador."
              : "Você já está logado, mas esta conta não administra a Copa."}
          </p>
        </Cartao>
      </div>
    );
  }

  return (
    <div className="entrar">
      <div className="marca">
        <h1>Entrar</h1>
        <p>Só para quem administra a competição</p>
      </div>
      <Cartao>
        <form className="pilha" onSubmit={enviar}>
          <label className="campo">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="campo">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {erro && <Aviso erro>{erro}</Aviso>}
          <button className="primario" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="dica" style={{ marginTop: "0.8rem" }}>
          Para acompanhar a competição você <strong>não precisa de conta</strong> —
          é só{" "}
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              irPara("#/");
            }}
          >
            voltar
          </a>
          . O login serve para lançar resultados, e é liberado pela Comissão
          Organizadora.
        </p>
      </Cartao>
    </div>
  );
}

function traduzir(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "E-mail ainda não confirmado.";
  return msg;
}
