/**
 * Generador local (sin IA) de posts, textos de anuncio y carruseles.
 *
 * Combina plantillas (messages: `demoLinkedinAds.templates`) con los datos de
 * la demo. Es determinístico: la misma demo, ángulo, tono y variante producen
 * el mismo texto. Se usa cuando la IA no está disponible y como punto de
 * partida editable.
 *
 * Reglas de veracidad: las plantillas no incluyen cifras de resultados,
 * testimonios ni clientes; los casos se plantean como hipótesis.
 */

import { SITE_URL } from '@/lib/site';
import {
  HASHTAGS_GLOBALES,
  LIMITES,
  type AdCta,
  type AnguloPost,
  type KoptupDemo,
  type TonoPost,
} from './data';

export interface Plantillas {
  hooks: Record<AnguloPost, string[]>;
  closings: Record<TonoPost, string[]>;
  ctaIntros: string[];
  context: Partial<Record<AnguloPost, string>>;
  bodyIntro: string;
  audience: string;
  ad: { headlines: string[]; intros: string[]; descriptions: string[] };
  carousel: {
    coverNote: string;
    problemTitle: string;
    problemNote: string;
    solutionTitle: string;
    solutionNote: string;
    moreTitle: string;
    moreNote: string;
    tryTitle: string;
    tryBullets: string[];
    tryNote: string;
    audienceTitle: string;
    audienceNote: string;
    ctaTitle: string;
    ctaContact: string;
    ctaNote: string;
  };
}

export interface PostGenerado {
  hook: string;
  cuerpo: string;
  cta: string;
  hashtags: string[];
  textoCompleto: string;
}

export interface AdCopyGenerado {
  headline: string;
  introText: string;
  description: string;
  cta: AdCta;
}

export interface CarruselSlide {
  numero: number;
  titulo: string;
  bullets: string[];
  notaVisual: string;
}

/* ───────────────────────────── utilidades ───────────────────────────── */

/** Reemplaza `{clave}` por su valor; deja intactas las claves desconocidas. */
export function rellenar(plantilla: string, vars: Record<string, string>): string {
  return plantilla.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

/** Pasa a minúscula la primera letra, salvo que sea una sigla (ERP, IPS, CRM…). */
export function minusculaInicial(s: string): string {
  if (s.length < 2) return s.toLowerCase();
  const [a, b] = [s.charAt(0), s.charAt(1)];
  if (b === b.toUpperCase() && b !== b.toLowerCase()) return s;
  return a.toLowerCase() + s.slice(1);
}

function quitarPuntoFinal(s: string): string {
  return s.replace(/[.\s]+$/, '');
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function truncar(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function dedupeHashtags(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((h) => {
    const k = h.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function variables(demo: KoptupDemo): Record<string, string> {
  const funcion0 = quitarPuntoFinal(demo.funciones[0] ?? demo.tagline);
  const funcion1 = quitarPuntoFinal(demo.funciones[1] ?? demo.tagline);
  const problema = quitarPuntoFinal(demo.problemaResuelve);
  return {
    emoji: demo.emoji,
    titulo: demo.titulo,
    tagline: quitarPuntoFinal(demo.tagline),
    industria: demo.industria,
    industriaLower: minusculaInicial(demo.industria),
    problema,
    problemaLower: minusculaInicial(problema),
    publico0: demo.publicoObjetivo[0] ?? '',
    publico0Lower: minusculaInicial(demo.publicoObjetivo[0] ?? ''),
    publico: demo.publicoObjetivo.slice(0, 3).join(', '),
    funcion0,
    funcion0Lower: minusculaInicial(funcion0),
    funcion1,
  };
}

/* ───────────────────────────── enlaces y UTM ───────────────────────────── */

export function urlDemo(demo: Pick<KoptupDemo, 'path'>): string {
  return `${SITE_URL}${demo.path}`;
}

export function consultaUtm(
  demo: Pick<KoptupDemo, 'slug'>,
  angulo: AnguloPost,
  medio: 'organic' | 'paid',
): string {
  return `utm_source=linkedin&utm_medium=${medio}&utm_campaign=koptup-demos&utm_content=${demo.slug}-${angulo}`;
}

/**
 * Agrega o quita los parámetros UTM del enlace de la demo dentro de un texto.
 * Funciona igual con el texto de plantillas, el de la IA o uno editado, siempre
 * que use la URL canónica de la demo.
 */
export function aplicarUtm(texto: string, url: string, consulta: string, conUtm: boolean): string {
  const conParametros = `${url}?${consulta}`;
  const limpio = texto.split(conParametros).join(url);
  if (!conUtm) return limpio;
  // Solo la URL exacta (no la seguida de "/" o "?" de otra ruta).
  const partes = limpio.split(url);
  return partes
    .map((parte, i) => {
      if (i === 0) return parte;
      const siguiente = parte.charAt(0);
      const esOtraRuta = siguiente === '/' || siguiente === '?' || /[\w-]/.test(siguiente);
      return (esOtraRuta ? url : conParametros) + parte;
    })
    .join('');
}

/* ───────────────────────────── generadores ───────────────────────────── */

const ESTILOS_BULLETS: Record<TonoPost, (items: string[]) => string> = {
  profesional: (items) => items.map((b) => `• ${b}`).join('\n'),
  cercano: (items) => items.map((b) => `✅ ${b}`).join('\n'),
  tecnico: (items) => items.map((b) => `→ ${b}`).join('\n'),
  storytelling: (items) => items.map((b, i) => `${i + 1}. ${b}`).join('\n'),
  controversial: (items) => items.map((b) => `▸ ${b}`).join('\n'),
};

export function generarPost(
  demo: KoptupDemo,
  angulo: AnguloPost,
  tono: TonoPost,
  variante: number,
  p: Plantillas,
): PostGenerado {
  const vars = variables(demo);
  const seed = hashSeed(`${demo.id}-${angulo}-${tono}`);
  const hook = rellenar(pick(p.hooks[angulo], seed + variante), vars);
  const contexto = p.context[angulo] ? rellenar(p.context[angulo] as string, vars) : '';
  const bullets = ESTILOS_BULLETS[tono](demo.funciones.slice(0, 4).map(quitarPuntoFinal));
  const cuerpo = [
    contexto,
    `${rellenar(p.bodyIntro, vars)}\n${bullets}`,
    rellenar(p.audience, vars),
  ]
    .filter(Boolean)
    .join('\n\n');
  const cierre = rellenar(pick(p.closings[tono], seed + variante + 1), vars);
  const ctaIntro = pick(p.ctaIntros, seed + variante + 2);
  const cta = `${cierre}\n\n${ctaIntro} ${urlDemo(demo)}`;
  const hashtags = dedupeHashtags([...HASHTAGS_GLOBALES.slice(0, 3), ...demo.hashtagsEspecificos]).slice(0, 7);
  const textoCompleto = [hook, cuerpo, cta, hashtags.join(' ')].join('\n\n');
  return { hook, cuerpo, cta, hashtags, textoCompleto };
}

export function generarAdCopy(demo: KoptupDemo, variante: number, p: Plantillas): AdCopyGenerado {
  const vars = variables(demo);
  const seed = hashSeed(`${demo.id}-ad`);
  return {
    headline: truncar(rellenar(pick(p.ad.headlines, seed + variante), vars), LIMITES.adHeadline),
    introText: truncar(rellenar(pick(p.ad.intros, seed + variante + 1), vars), LIMITES.adIntro),
    description: truncar(rellenar(pick(p.ad.descriptions, seed + variante + 2), vars), LIMITES.adDescription),
    cta: 'Probar demo',
  };
}

export function generarCarrusel(demo: KoptupDemo, p: Plantillas): CarruselSlide[] {
  const c = p.carousel;
  const f = demo.funciones.map(quitarPuntoFinal);
  return [
    { numero: 1, titulo: `${demo.emoji} ${demo.titulo}`, bullets: [quitarPuntoFinal(demo.tagline)], notaVisual: c.coverNote },
    { numero: 2, titulo: c.problemTitle, bullets: [quitarPuntoFinal(demo.problemaResuelve)], notaVisual: c.problemNote },
    { numero: 3, titulo: c.solutionTitle, bullets: f.slice(0, 2), notaVisual: c.solutionNote },
    { numero: 4, titulo: c.moreTitle, bullets: f.slice(2, 4), notaVisual: c.moreNote },
    { numero: 5, titulo: c.tryTitle, bullets: c.tryBullets, notaVisual: c.tryNote },
    { numero: 6, titulo: c.audienceTitle, bullets: demo.publicoObjetivo.slice(0, 4), notaVisual: c.audienceNote },
    {
      numero: 7,
      titulo: c.ctaTitle,
      bullets: [urlDemo(demo).replace(/^https?:\/\//, ''), c.ctaContact],
      notaVisual: c.ctaNote,
    },
  ];
}
