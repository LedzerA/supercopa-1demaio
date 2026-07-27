import { useState } from "react";
import { COPA } from "../config";
import { useStore } from "../state/store";
import { Aviso, Cartao } from "../components/ui";

export function Entrar() {
  const { entrar } = useStore();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const falha = await entrar(email, senha);
    if (falha) setErro(traduzir(falha));
    setEnviando(false);
  }

  return (
    <div className="entrar">
      <div className="marca">
        <h1>
          {COPA.nome} {COPA.edicao}
        </h1>
        <p>Área de administração · {COPA.liga}</p>
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
          O acesso é liberado pela Comissão Organizadora, na tabela{" "}
          <code>copa_admins</code>. É uma lista própria da SuperCopa — separada
          da do app do Proleta.
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
