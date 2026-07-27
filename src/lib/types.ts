/* Tipos espelham as colunas do Postgres (snake_case), sem camada
   de mapeamento — mesma convenção do statsproleta. */

export type Serie = "ouro" | "prata" | "bronze";
export type Fase = "regional" | "final_regional" | "lima_barreto";
export type Etapa = "repescagem" | "semifinal" | "final";
export type StatusJogo = "agendado" | "encerrado" | "wo" | "adiado" | "anulado";
export type TipoCartao = "amarelo" | "vermelho" | "agressao" | "expulsao_copa";

export type Regional = {
  id: string;
  nome: string;
  regiao: string;
  posicao: number;
};

export type Time = {
  id: string;
  regional_id: string;
  nome: string;
  apelido: string | null;
  responsavel: string | null;
  contato: string | null;
  desistente: boolean;
  lista_fechada: boolean;
};

export type Jogo = {
  id: string;
  regional_id: string | null;
  fase: Fase;
  serie: Serie | null;
  etapa: Etapa | null;
  chave: string | null;
  rodada: number | null;
  ordem: number;
  mandante_id: string | null;
  visitante_id: string | null;
  mandante_slot: string | null;
  visitante_slot: string | null;
  data: string | null;
  horario: string | null;
  local: string | null;
  status: StatusJogo;
  gols_mandante: number | null;
  gols_visitante: number | null;
  wo_favoravel: "mandante" | "visitante" | null;
  observacoes: string | null;
  updated_at: string;
};

export type Jogador = {
  id: string;
  time_id: string;
  nome: string;
  documento: string | null;
  numero: number | null;
  inscrito_em: string | null;
};

export type Cartao = {
  id: string;
  jogo_id: string | null;
  time_id: string;
  jogador_id: string | null;
  jogador_nome: string | null;
  tipo: TipoCartao;
  minuto: number | null;
  descricao: string | null;
  cumprido_em: string[];
};

export type Ajuste = {
  id: string;
  time_id: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  pontos: number;
  motivo: string;
};

export type Pagamento = {
  id: string;
  time_id: string;
  parcela: number;
  valor: number;
  pago: boolean;
  pago_em: string | null;
  observacao: string | null;
};

export type RankingFinal = {
  id: string;
  serie: Serie;
  papel: "campeao" | "vice";
  posicao: number;
  time_id: string;
};

/** Linha calculada da tabela de classificação. */
export type LinhaTabela = {
  time: Time;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo: number;
  pontos: number;
  vermelhos: number;
  /** Critério que decidiu a posição em relação ao time logo acima. */
  desempate?: string;
};
