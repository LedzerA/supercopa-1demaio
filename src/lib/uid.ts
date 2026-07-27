/** IDs de texto com prefixo, como no statsproleta (nada de uuid). */
export function uid(prefixo: string): string {
  const aleatorio = Math.random().toString(36).slice(2, 9);
  return `${prefixo}-${Date.now().toString(36)}${aleatorio}`;
}
