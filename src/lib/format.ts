/** Datas guardadas em ISO (YYYY-MM-DD), exibidas em DD/MM/AAAA. */
export function dataBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

export function dinheiro(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Saldo de gols com sinal explícito, como no txt da liga: 20, (-4). */
export function saldoBR(v: number): string {
  return v < 0 ? `(${v})` : String(v);
}

export function plural(n: number, um: string, muitos: string): string {
  return `${n} ${n === 1 ? um : muitos}`;
}
