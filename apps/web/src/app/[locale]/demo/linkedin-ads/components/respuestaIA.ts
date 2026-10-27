/**
 * Respuesta de «Generar con IA» (POST /api/linkedin-ads/generate) convertida
 * al paquete que muestra la demo: publicación, texto de anuncio y carrusel.
 */

import { AD_CTAS, type AdCta, type KoptupDemo } from './data';
import { incluyeEnlace, normalizarEnlaceDemo, type AdCopyGenerado, type CarruselSlide } from './generador';
import type { CuerpoError } from './errores';

export interface AiPack {
  id: number;
  textoPost: string;
  ad: AdCopyGenerado;
  carrusel: CarruselSlide[];
  estrategia: string;
  model: string;
}

export interface RespuestaIA extends CuerpoError {
  data?: {
    post?: { hook?: unknown; body?: unknown; cta?: unknown; hashtags?: unknown };
    ad?: { headline?: unknown; introText?: unknown; description?: unknown; cta?: unknown };
    carrusel?: unknown;
    estrategia?: unknown;
  };
  model?: string;
}

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/**
 * Convierte la respuesta de la IA en el paquete que muestra la demo. Lleva el
 * enlace a la demo a su URL canónica y, si la IA no lo escribió, lo agrega al
 * cierre del post (así la UTM y la revisión funcionan igual que con plantillas).
 */
export function adaptarRespuesta(json: RespuestaIA, id: number, demo: Pick<KoptupDemo, 'path'>, url: string): AiPack | null {
  const d = json.data;
  if (!d?.post || !d.ad) return null;
  const { hook, body, cta, hashtags } = d.post;
  if (!esTexto(hook) || !esTexto(body) || !esTexto(cta)) return null;
  // Una etiqueta de LinkedIn no lleva espacios ni signos: se limpian.
  const tags = Array.isArray(hashtags)
    ? hashtags
        .filter(esTexto)
        .map((h) => h.replace(/[^\p{L}\p{N}_]/gu, ''))
        .filter(Boolean)
        .map((h) => `#${h}`)
    : [];
  const adCta = AD_CTAS.includes(d.ad.cta as AdCta) ? (d.ad.cta as AdCta) : 'Más información';
  if (!esTexto(d.ad.headline) || !esTexto(d.ad.introText) || !esTexto(d.ad.description)) return null;
  const slides: CarruselSlide[] = Array.isArray(d.carrusel)
    ? (d.carrusel as Record<string, unknown>[])
        .filter((s) => esTexto(s?.titulo))
        .map((s, i) => ({
          // Se renumeran en orden: el modelo puede repetir o saltar números.
          numero: i + 1,
          titulo: s.titulo as string,
          bullets: Array.isArray(s.bullets) ? (s.bullets as unknown[]).filter(esTexto) : [],
          notaVisual: esTexto(s.notaVisual) ? s.notaVisual : '',
        }))
    : [];
  const norm = (texto: string) => normalizarEnlaceDemo(texto, demo.path, url);
  const [h, b] = [norm(hook), norm(body)];
  let c = norm(cta);
  if (!incluyeEnlace(`${h}\n${b}\n${c}`, url)) c = `${c}\n👉 ${url}`;
  return {
    id,
    textoPost: [h, b, c, tags.join(' ')].filter(Boolean).join('\n\n'),
    ad: { headline: d.ad.headline, introText: norm(d.ad.introText), description: d.ad.description, cta: adCta },
    carrusel: slides,
    estrategia: esTexto(d.estrategia) ? d.estrategia : '',
    model: json.model || 'OpenAI',
  };
}
