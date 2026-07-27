import { Cartao } from "../components/ui";

/** Consulta rápida em campo. O texto integral é a Minuta do
 *  Regulamento aprovada no Congresso Técnico de 15/04/2026. */
export function Regulamento() {
  return (
    <div className="regulamento">
      <Cartao titulo="Consulta rápida">
        <p className="dica" style={{ marginTop: 0 }}>
          Resumo dos artigos que mais aparecem na mesa. Art. 5º — o regramento é
          imutável durante a competição e de cumprimento obrigatório. Art. 38 —
          casos omissos são resolvidos pela Comissão Organizadora.
        </p>
      </Cartao>

      <Cartao titulo="Fórmula de disputa">
        <Item art="Art. 6º" titulo="Duas fases">
          Fase Regional (Guarulhos, Lapa e Carrão, 6 equipes cada, todos contra
          todos) e Fase Lima Barreto (eliminatória). Ao fim da regional:
          Final Ouro 1º×2º, Final Prata 3º×4º, Final Bronze 5º×6º — três
          troféus.
        </Item>
        <Item art="Art. 6º" titulo="Lima Barreto">
          Cada série reúne as 3 campeãs e as 3 vices das finais regionais. As
          duas campeãs de melhor campanha acumulada vão direto à semifinal.
          Repescagem: J1 = 3º melhor campeão × 3º melhor vice; J2 = 1º melhor
          vice × 2º melhor vice. Semifinais: J3 = 1º melhor campeão × vencedor
          do J1; J4 = 2º melhor campeão × vencedor do J2. Final: J3 × J4.
        </Item>
        <Item art="Art. 9º" titulo="Desempate na fase regional">
          Nesta ordem: 1) confronto direto; 2) número de vitórias; 3) saldo de
          gols; 4) cartões vermelhos; 5) gols feitos.
        </Item>
      </Cartao>

      <Cartao titulo="Jogos">
        <Item art="Art. 15" titulo="Duração">
          80 minutos, dois tempos de 40, com 10 de intervalo — ou o que o
          horário do campo alugado permitir. Em caso de calor, pausa de 3
          minutos para hidratação.
        </Item>
        <Item art="Art. 16" titulo="Interrupção">
          Passados 2/3 do tempo, a partida é considerada encerrada com o
          resultado do momento. Antes disso, remarca-se apenas o tempo
          restante, mantido o placar.
        </Item>
        <Item art="Art. 18 e 19" titulo="Número de atletas e tolerância">
          7 jogadores (6 de linha + goleiro). Sem isso, W.O. ao adversário e
          desclassificação. A tolerância para entrar em campo é de 15 minutos.
        </Item>
        <Item art="Art. 20" titulo="Substituições">
          Ilimitadas, com retorno de atletas que já saíram.
        </Item>
        <Item art="Art. 22" titulo="Sem arbitragem">
          O jogo não é computado (vira amistoso). Com ao menos 1 dos 3 membros
          do trio e acordo entre as equipes, o jogo pode valer — e não cabe
          revisão posterior.
        </Item>
        <Item art="Art. 24" titulo="W.O.">
          Placar de 3×0 para a equipe vencedora. Quem dá W.O. continua devendo
          a taxa do campeonato.
        </Item>
      </Cartao>

      <Cartao titulo="Inscrições">
        <Item art="Art. 13" titulo="Uma equipe por atleta">
          Atleta em duas equipes é eliminado; a equipe também pode ser. Todas as
          partidas em que atuou irregularmente são anuladas, com W.O. ao
          adversário.
        </Item>
        <Item art="Art. 13 §3º" titulo="Prazo">
          Inscrição por formulário até um dia antes de cada jogo. A lista fecha
          um dia antes do jogo da 3ª rodada e vale, fechada, para todos os
          jogos seguintes das duas fases. Quem não está no formulário impresso
          levado ao campo não joga.
        </Item>
      </Cartao>

      <Cartao titulo="Disciplina">
        <Item art="Art. 25" titulo="Cartões">
          Amarelo não suspende. Vermelho suspende o jogo seguinte, em qualquer
          fase.
        </Item>
        <Item art="Art. 26" titulo="Comemoração">
          Toda comemoração é permitida — subir no alambrado, tirar a camisa.
          Só há amarelo quando a comemoração ofende ou provoca o adversário.
        </Item>
        <Item art="Art. 27" titulo="Comissão técnica">
          Equipara-se a atleta para efeitos disciplinares.
        </Item>
        <Item art="Art. 29 e 30" titulo="Agressão">
          4 jogos de suspensão. Agressão a árbitro ou mesário: exclusão da
          competição.
        </Item>
        <Item art="Art. 31" titulo="Invasão de campo">
          Perda de 3 pontos; nas fases finais, W.O. ao adversário. Invasão que
          termine em agressão desclassifica a equipe, que pode voltar no ano
          seguinte.
        </Item>
        <Item art="Art. 32" titulo="Briga generalizada">
          Ambas as equipes desclassificadas; a Comissão define o seguimento da
          competição.
        </Item>
        <Item art="Art. 33" titulo="Opressão">
          Ofensa racista, machista, xenofóbica, homofóbica, lesbofóbica,
          transfóbica ou a qualquer minoria, relatada em súmula:{" "}
          <strong>expulsão</strong> do jogador ou da equipe. Ofensas reiteradas
          ou coletivas vão à Comissão para desclassificação. Se partirem de
          pessoas ligadas à equipe fora de campo, o time fica obrigado a fazer
          conversas públicas antes de todos os seus jogos, sob pena de anulação
          das partidas em que não houver.
        </Item>
        <Item art="Art. 34" titulo="Recurso">
          A equipe que observar irregularidade pode recorrer, comprovando o
          descumprimento, para análise da Comissão em reunião extraordinária.
        </Item>
      </Cartao>

      <Cartao titulo="Custos">
        <Item art="Art. 3º" titulo="Taxa">
          R$ 300 por equipe, em três parcelas iguais recolhidas nos três
          primeiros jogos da fase regional. Cobre troféus e parte da arbitragem.
        </Item>
        <Item art="Art. 28" titulo="Inadimplência">
          Passível de exclusão do campeonato — os valores são necessários aos
          trabalhadores da arbitragem e aos campos.
        </Item>
      </Cartao>
    </div>
  );
}

function Item({
  art,
  titulo,
  children,
}: {
  art: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.8rem" }}>
      <h3 style={{ marginBottom: "0.15rem" }}>
        <span className="art">{art}</span> — {titulo}
      </h3>
      <p>{children}</p>
    </div>
  );
}
