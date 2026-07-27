# SuperCopa 1º de Maio 2026 — site de administração

Site para a Comissão Organizadora tocar a competição: lançar placares e
W.O., acompanhar a classificação com os desempates do Art. 9º, fechar as
finais regionais, montar o chaveamento da Fase Lima Barreto, controlar
inscrições, suspensões e as parcelas da taxa.

Feito em React 18 + TypeScript + Vite. Banco: **Supabase (Postgres)**.

---

## Por que Supabase e não Firebase

O projeto do statsproleta já roda num Supabase configurado e pago, com
autenticação e RLS prontos. A classificação da Copa é puro relacional —
tabela, desempate por confronto direto, agregação por grupo —, que é
exatamente onde Postgres é confortável e o Firestore é desconfortável.
Reaproveitar sai mais barato e mais rápido do que subir um Firebase novo.

**As permissões, porém, são separadas.** Este app usa a tabela
`copa_admins` e a função `is_copa_admin()`, criadas por `schema.sql`.
Quem é admin do statsproleta (tabela `admins`) **não** ganha acesso à
Copa, e quem é admin da Copa **não** ganha acesso ao Proleta. As duas
listas só compartilham o pool de contas (`auth.users`) — cada uma
precisa ser preenchida à mão. As sessões do navegador também são
separadas (`storageKey` próprio), então dá para ficar logado nos dois
apps com contas diferentes ao mesmo tempo.

Nenhuma tabela do Proleta é lida, alterada ou referenciada. Todas as
tabelas daqui usam o prefixo `copa_`. Se um dia quiser um projeto
Supabase exclusivo da Copa, é só trocar as duas constantes em
`src/config.ts` e rodar os mesmos dois SQLs lá.

---

## Instalação

```bash
cd supercopa-admin
npm install
npm run dev      # http://localhost:5173
```

### 1. Criar as tabelas

No Supabase → **SQL Editor**, rode na ordem:

1. `supabase/schema.sql` — tabelas, RLS e a função `is_copa_admin()`
2. `supabase/seed.sql` — as 3 regionais, os 18 times, os jogos já
   realizados, os que faltam, as finais e o chaveamento em branco

Os dois são idempotentes: podem ser rodados de novo sem apagar nada que
você já tenha editado pelo site.

### 2. Liberar um administrador

Cadastre a pessoa em **Authentication → Users** (ou peça para ela se
cadastrar) e depois rode, trocando o e-mail:

```sql
insert into public.copa_admins (user_id, nome, email)
select id, 'Nome da pessoa', email from auth.users
where email = 'fulano@exemplo.com'
on conflict (user_id) do nothing;
```

Para revogar sem apagar a conta:

```sql
delete from public.copa_admins
where user_id = (select id from auth.users where email = 'fulano@exemplo.com');
```

Quem entra sem estar em `copa_admins` vê tudo em **modo leitura** — os
botões de escrita somem, e o RLS bloqueia no servidor mesmo que alguém
force a mão pelo navegador.

### 3. Publicar

`npm run build` gera `dist/`, que é estático e pode ir para GitHub
Pages, Netlify, Vercel ou qualquer hospedagem de arquivos. O Vite usa
`base: "./"`, então funciona em qualquer subpasta.

---

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck estrito + build de produção
- `npm run verificar` — confere a classificação calculada contra a
  tabela publicada pela liga (as três regionais, o confronto direto, os
  cartões vermelhos e a punição do Art. 31)

Não há suíte de testes além dessa; um build limpo + `verificar`
passando é a régua.

---

## As telas

| Tela | O que resolve |
|---|---|
| **Painel** | Quanto falta para fechar cada regional, jogos sem data marcada, suspensões em aberto, caixa |
| **Jogos** | Lançar placar, W.O., data, horário e campo. Filtra por situação, regional e time |
| **Regionais** | Classificação com os 5 critérios de desempate e o critério que decidiu cada posição. Botão para definir as finais Ouro/Prata/Bronze pela classificação |
| **Lima Barreto** | Ordem por campanha acumulada, chaveamento das 3 séries com propagação dos vencedores, e opção de fixar a ordem oficial |
| **Times** | Elencos, inscrição de atletas, trava da lista (Art. 13 §3º), responsável de cada equipe |
| **Disciplina** | Cartões e agressões, suspensões pendentes com baixa por jogo, ajustes de pontos |
| **Financeiro** | As 3 parcelas de R$ 100 por equipe, quem está em dia e quanto falta entrar |
| **Regulamento** | Consulta rápida dos artigos que mais aparecem na mesa |

---

## Regras que o código implementa

- **Art. 9º — desempate.** Confronto direto → vitórias → saldo → cartões
  vermelhos → gols feitos, nessa ordem. Quando um critério separa o
  grupo, os critérios são reaplicados do início dentro de cada subgrupo,
  com o confronto direto recalculado só entre quem continua empatado. A
  tela mostra qual critério decidiu cada posição.
- **Art. 24 — W.O.** dá 3×0 à vencedora, independente do que estiver
  gravado no placar.
- **Art. 25 e 29 — suspensões.** Vermelho suspende 1 jogo; agressão, 4.
  A baixa é dada escolhendo em qual jogo foi cumprida.
- **Art. 31 — invasão.** Lançada como ajuste de −3 pontos.
- **Art. 6º — Lima Barreto.** J1 = 3º melhor campeão × 3º melhor vice;
  J2 = 1º × 2º melhor vice; J3 = 1º melhor campeão × vencedor do J1;
  J4 = 2º melhor campeão × vencedor do J2; final = J3 × J4. Os
  vencedores propagam sozinhos conforme os placares entram.
- **Art. 3º — taxa.** R$ 300 por equipe em 3 parcelas de R$ 100.

O regulamento **não define** os critérios de "melhor campanha
acumulada" do Art. 6º. O app sugere pontos → vitórias → saldo → gols
feitos (somando fase regional + final regional) e deixa a Comissão fixar
outra ordem na tela da Lima Barreto; a ordem fixada sempre prevalece
sobre a sugerida.

---

## Pontos dos dados que precisam de conferência

O seed veio do arquivo `Regional Adriana Albuquerque.txt`. Três coisas
ficaram em aberto e estão marcadas com `CONFERIR` no `seed.sql`:

1. **Formigueiro 3×2 Academia BNH (3ª rodada da Lapa).** O jogo aparece
   como não realizado no txt, mas a classificação só fecha com esse
   placar — Formigueiro com 3 jogos, GP 15 e GC 4, e o BNH com GP 3 e
   GC 13. O placar foi deduzido; confirme na súmula.
2. **Havana (Guarulhos).** A classificação traz GP 6 / GC 1, mas os
   jogos listados somam 5 gols pró e 0 contra. Os jogos são a fonte da
   verdade no site — corrija o placar quando souber qual está certo.
3. **TGFC (Guarulhos).** Perdeu os 5 jogos por 3×0, que é exatamente o
   placar de W.O. do Art. 24, e não aparece na classificação. Entrou
   como desistente, com os 5 jogos marcados como W.O. Se ele segue na
   competição, desmarque em *Times*.

E um caso que não é erro, é falta de dado:

4. **Regional Carrão.** O txt traz só a classificação acumulada das
   rodadas 1 a 4, sem os placares jogo a jogo. Essa campanha entrou em
   `copa_ajustes` (tela *Disciplina → Ajustes de classificação*) e a 5ª
   rodada entrou como jogo normal. **Quando você tiver os 12 placares,
   cadastre os jogos e apague os 6 ajustes** — senão a campanha conta
   duas vezes. A tela da regional avisa enquanto os ajustes existirem.

## Jogos que ainda faltam

Pelo que o txt mostra, faltam **16 jogos** para fechar a fase regional:

- **Lapa (7):** União Lapa × Futantã (atrasado da 2ª rodada) e as
  rodadas 4 e 5 inteiras.
- **Guarulhos (6):** Família × Havana, Família × Sevira, Havana ×
  Palestino, Havana × Sevira, Palestino × Libertários, Sevira ×
  Libertários. Os pares foram distribuídos entre 4ª e 5ª rodadas por
  conta própria — reorganize em *Jogos* se a tabela oficial for outra.
- **Carrão (3):** Proletariado × Rayo, Só de Virada × Corote, TAP ×
  Código Verde.

Depois vêm as 9 finais regionais e os 15 jogos da Fase Lima Barreto, que
já estão cadastrados esperando os times.
