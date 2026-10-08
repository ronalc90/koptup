/**
 * Revisión automática de veracidad de un texto antes de publicarlo.
 * Detecta cifras que parecen resultados (porcentajes, multiplicadores,
 * tiempos, "+500"…) y frases que suenan a testimonio o cita de cliente.
 * Es una ayuda: no reemplaza la revisión humana.
 */

export interface RevisionVeracidad {
  cifras: string[];
  testimonio: boolean;
  enlace: boolean;
  utm: boolean;
  caracteres: number;
}

const UNIDADES =
  '(?:%|x\\b|×|veces|horas?|hrs?|h\\b|minutos?|min\\b|segundos?|seg\\b|s\\b|ms\\b|días?|semanas?|meses|años?|times|hours?|minutes?|seconds?|days?|weeks?|months?|years?)';

const RE_CIFRAS = new RegExp(
  [
    `[+\\-−]?\\d+(?:[.,]\\d+)?\\s?${UNIDADES}`, // 30%, 3x, 2 horas, 90 segundos
    `[+−]\\d+(?:[.,]\\d+)?`, // +45, −30
    `[<>≤≥]\\s?\\d+(?:[.,]\\d+)?\\s?\\w*`, // <1.5s, >99
    `\\b\\d{2,}(?:[.,]\\d+)*\\+`, // 500+, 1.000+
  ].join('|'),
  'gi',
);

const RE_TESTIMONIO =
  /(me dijo un cliente|un cliente (?:me )?(?:dijo|coment[oó]|cont[oó]|escribi[oó])|seg[uú]n (?:un|nuestro) cliente|nuestros clientes (?:dicen|logran|ahorran|reportan)|testimonio|a (?:client|customer) (?:told|said)|our (?:clients|customers) (?:say|save|report)|testimonial|["“«][^"”»\n]{12,}["”»]\s*[—–-]\s*\p{L})/iu;

/** Quita URLs y hashtags para no confundir sus números con cifras. */
function limpiar(texto: string): string {
  return texto.replace(/https?:\/\/\S+/g, ' ').replace(/#[\p{L}\d_]+/gu, ' ');
}

export function revisarTexto(texto: string, pathDemo: string): RevisionVeracidad {
  const limpio = limpiar(texto);
  const cifras = Array.from(new Set((limpio.match(RE_CIFRAS) ?? []).map((c) => c.trim()))).slice(0, 6);
  return {
    cifras,
    testimonio: RE_TESTIMONIO.test(limpio),
    enlace: texto.includes(pathDemo),
    utm: /[?&]utm_source=linkedin\b/.test(texto),
    caracteres: texto.length,
  };
}
