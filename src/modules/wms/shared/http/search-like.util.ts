/**
 * Remove caracteres especiais de padrão ILIKE para evitar wildcard indesejado.
 */
export function sanitizeIlikeFragment(value: string): string {
  return value
    .replace(/[%_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
