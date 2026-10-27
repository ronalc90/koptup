/**
 * Límite de la meta description. Google muestra unos 155–160 caracteres; lo
 * más largo se corta a la mitad de una frase. Recorta en una palabra completa.
 */
export const MAX_DESCRIPTION_LENGTH = 160;

export function clampDescription(text: string, max = MAX_DESCRIPTION_LENGTH): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.\-–]+$/, '')}…`;
}
