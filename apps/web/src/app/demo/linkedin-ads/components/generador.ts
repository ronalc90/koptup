/**
 * Generador determinístico de posts LinkedIn.
 *
 * No usa LLM — combina plantillas + datos del demo para producir copy
 * con estructura probada (hook → contexto → bullets → CTA → hashtags).
 *
 * Tradeoff: menos creativo que un LLM, pero 100% offline, gratis y
 * consistente. La idea es que sirva como punto de partida que el usuario
 * edita en LinkedIn antes de publicar.
 */

import {
  ANGULOS_LABELS,
  HASHTAGS_GLOBALES,
  type AnguloPost,
  type KoptupDemo,
  type TonoPost,
} from './data';

export interface PostGenerado {
  hook: string;
  cuerpo: string;
  cta: string;
  hashtags: string[];
  textoCompleto: string;
  caracteres: number;
}

export interface AdCopyGenerado {
  headline: string;
  introText: string;
  description: string;
  cta: 'Más información' | 'Visitar sitio web' | 'Registrarse' | 'Probar demo';
}

const HOOK_PLANTILLAS: Record<AnguloPost, (d: KoptupDemo) => string[]> = {
  lanzamiento: (d) => [
    `${d.emoji} Acabamos de lanzar: ${d.titulo}.`,
    `🚀 Nuevo demo en Koptup: ${d.titulo}.`,
    `${d.emoji} ${d.titulo} ya está vivo. Mirá lo que hace.`,
    `Recién salido del horno: ${d.titulo}. ${d.emoji}`,
  ],
  'caso-uso': (d) => [
    `Imaginá esto: una empresa de ${d.industria.split(' / ')[0].toLowerCase()} ${d.problemaResuelve.toLowerCase().split(' ').slice(0, 8).join(' ')}…`,
    `${d.emoji} Cómo ${d.publicoObjetivo[0]} usa ${d.titulo} en la vida real.`,
    `Caso real: ${d.problemaResuelve}.`,
    `${d.emoji} Una historia rápida sobre por qué construimos ${d.titulo}.`,
  ],
  educativo: (d) => [
    `${d.emoji} ¿Sabés cómo funciona ${d.caracteristicasIA[0]}? Spoiler: es más simple de lo que parece.`,
    `Hilo corto: qué es ${d.caracteristicasIA[0]} y por qué importa en ${d.industria.split(' / ')[0]}.`,
    `${d.emoji} 3 cosas que tu equipo debería entender sobre ${d.titulo}.`,
    `Mucha gente me pregunta cómo hace ${d.caracteristicasIA[0]}. Acá va la versión sin tecnicismos.`,
  ],
  testimonio: (d) => [
    `${d.emoji} "${d.metricaImpactante}". Eso me dijo un cliente esta semana.`,
    `No es marketing: ${d.metricaImpactante}. Así.`,
    `${d.emoji} Reflexión rápida después de cerrar la semana con ${d.titulo}.`,
    `"Esto debería existir hace 5 años" — un cliente probando ${d.titulo}.`,
  ],
  'detras-camaras': (d) => [
    `🛠️ Cómo construimos ${d.titulo} sin un equipo de 30 personas.`,
    `${d.emoji} Stack tecnológico detrás de ${d.titulo}.`,
    `Behind the scenes: las 3 decisiones técnicas más duras en ${d.titulo}.`,
    `🛠️ Lo que aprendimos construyendo ${d.titulo} en 6 semanas.`,
  ],
  comparativa: (d) => [
    `${d.emoji} Antes: ${d.problemaResuelve}. Ahora: ${d.metricaImpactante}.`,
    `⚖️ Lo que cambia cuando reemplazás procesos manuales por ${d.titulo}.`,
    `${d.emoji} Solución tradicional vs ${d.titulo}. Mirá la diferencia.`,
    `La diferencia entre hacerlo a mano y hacerlo con ${d.titulo}: ${d.metricaImpactante}.`,
  ],
  'tip-rapido': (d) => [
    `💡 Tip de hoy: ${d.beneficiosClave[0].toLowerCase()}.`,
    `${d.emoji} Si tu equipo de ${d.publicoObjetivo[0].toLowerCase()} no está haciendo esto, lo está haciendo mal.`,
    `💡 30 segundos: una cosa que cambia cómo usás ${d.titulo}.`,
    `${d.emoji} Pequeño truco para ${d.industria.split(' / ')[0].toLowerCase()}: probá esto.`,
  ],
  'pregunta-engagement': (d) => [
    `${d.emoji} Pregunta para ${d.publicoObjetivo[0]}: ¿cómo manejás hoy ${d.problemaResuelve.toLowerCase().split(' ').slice(-4).join(' ')}?`,
    `¿Cuánto tiempo invierte tu equipo en ${d.industria.split(' / ')[0].toLowerCase()}? Curiosidad genuina ${d.emoji}`,
    `${d.emoji} Si tuvieras que automatizar UNA tarea de ${d.industria.split(' / ')[0].toLowerCase()}, ¿cuál sería?`,
    `Pregunta abierta: ¿qué es lo que más frustra a tu equipo en ${d.publicoObjetivo[0].toLowerCase()}? ${d.emoji}`,
  ],
};

const ESTILOS_BULLETS: Record<TonoPost, (items: string[]) => string> = {
  profesional: (items) => items.map((b) => `• ${b}`).join('\n'),
  cercano: (items) => items.map((b) => `✅ ${b}`).join('\n'),
  tecnico: (items) => items.map((b) => `→ ${b}`).join('\n'),
  storytelling: (items) => items.map((b, i) => `${i + 1}. ${b}`).join('\n'),
  controversial: (items) => items.map((b) => `▸ ${b}`).join('\n'),
};

const FRASES_CIERRE: Record<TonoPost, string[]> = {
  profesional: [
    'Probá la demo y nos cuentás qué te parece.',
    'Disponible para una reunión esta semana si querés profundizar.',
    'Si tu empresa está evaluando algo similar, hablemos.',
  ],
  cercano: [
    '¿Te suena familiar? Contame en los comentarios 👇',
    'Probalo y me cuentás qué tal 😉',
    '¿Algún caso parecido en tu empresa? Te leo 👇',
  ],
  tecnico: [
    '¿Querés que abramos parte del código? Pinguéame.',
    'Detalles de arquitectura en los comentarios si interesa.',
    'Si querés que escriba un deep-dive del stack, dejá un comentario.',
  ],
  storytelling: [
    '¿Tu empresa tiene una historia parecida? Compartila 👇',
    'Si esto te resonó, dale share que ayuda a más founders.',
    '¿Qué hubieras hecho distinto? Curiosidad genuina.',
  ],
  controversial: [
    '¿Estás de acuerdo o me estoy yendo al pasto? Argumenten 👇',
    '¿Cambio de opinión? Convénzanme.',
    'Hot take, lo sé. ¿Qué dicen?',
  ],
};

const CTAS_LINK: string[] = [
  '👉 Probalo gratis:',
  '🔗 Demo interactiva:',
  '➡️ Mirá la demo:',
  '🎬 Pruébalo en 30 segundos:',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export function generarPost(
  demo: KoptupDemo,
  angulo: AnguloPost,
  tono: TonoPost,
  variante: number = 0,
  baseUrl: string = 'https://koptup.com',
): PostGenerado {
  const seedBase = hashSeed(`${demo.id}-${angulo}-${tono}-${variante}`);
  const hooks = HOOK_PLANTILLAS[angulo](demo);
  const hook = pick(hooks, seedBase + variante);

  const beneficiosFiltrados = demo.beneficiosClave.slice(0, 4);
  const bullets = ESTILOS_BULLETS[tono](beneficiosFiltrados);

  const cierre = pick(FRASES_CIERRE[tono], seedBase + variante + 1);
  const ctaLink = pick(CTAS_LINK, seedBase + variante + 2);

  const contextoIndustria =
    angulo === 'caso-uso'
      ? `\n\n📌 Contexto: en ${demo.industria.split(' / ')[0]}, ${demo.problemaResuelve.toLowerCase()}.`
      : angulo === 'educativo'
      ? `\n\n📚 Por qué importa en ${demo.industria.split(' / ')[0]}: ${demo.problemaResuelve.toLowerCase()}.`
      : '';

  const metricaLinea =
    angulo === 'comparativa' || angulo === 'testimonio'
      ? `\n\n📈 Resultado: ${demo.metricaImpactante}.`
      : `\n\n📈 ${demo.metricaImpactante}.`;

  const cuerpo = `${contextoIndustria}

¿Qué hace ${demo.titulo}?
${bullets}${metricaLinea}

👥 Pensado para: ${demo.publicoObjetivo.slice(0, 3).join(', ')}.`;

  const cta = `${cierre}\n\n${ctaLink} ${baseUrl}${demo.path}`;

  const hashtags = dedupeHashtags([
    ...HASHTAGS_GLOBALES.slice(0, 4),
    ...demo.hashtagsEspecificos,
  ]).slice(0, 9);

  const textoCompleto = `${hook}${cuerpo}\n\n${cta}\n\n${hashtags.join(' ')}`;

  return {
    hook,
    cuerpo: cuerpo.trim(),
    cta: cta.trim(),
    hashtags,
    textoCompleto,
    caracteres: textoCompleto.length,
  };
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

/**
 * Ad copy para LinkedIn Sponsored Content (formato distinto al orgánico).
 * Headline máx 70 chars, intro máx 150, description máx 70.
 */
export function generarAdCopy(demo: KoptupDemo, variante: number = 0): AdCopyGenerado {
  const seed = hashSeed(`${demo.id}-ad-${variante}`);

  const headlines = [
    `${demo.titulo} para ${demo.publicoObjetivo[0]}`,
    `${demo.metricaImpactante.split('·')[0].trim()}`,
    `${demo.tagline}`,
    `Cómo ${demo.publicoObjetivo[0]} usan IA`,
  ];

  const introsBase = [
    `${demo.emoji} ${demo.tagline}. ${demo.metricaImpactante}. Probá la demo gratis.`,
    `Si liderás ${demo.publicoObjetivo[0].toLowerCase()}, esto te interesa: ${demo.beneficiosClave[0]}.`,
    `${demo.emoji} Reemplazá procesos manuales por IA. ${demo.metricaImpactante}.`,
  ];

  const descriptions = [
    'Probá la demo en 30 segundos',
    'Demo interactiva sin registro',
    'Solicitá una llamada',
    'Mirá cómo funciona',
  ];

  return {
    headline: truncate(pick(headlines, seed), 70),
    introText: truncate(pick(introsBase, seed + 1), 150),
    description: truncate(pick(descriptions, seed + 2), 70),
    cta: 'Probar demo',
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Slides de carrusel (5-7 slides). Cada slide es texto corto pensado
 * para una imagen 1080x1080 generada externamente o capturada del demo.
 */
export interface CarruselSlide {
  numero: number;
  titulo: string;
  bullets: string[];
  notaVisual: string;
}

export function generarCarrusel(demo: KoptupDemo): CarruselSlide[] {
  return [
    {
      numero: 1,
      titulo: `${demo.emoji} ${demo.titulo}`,
      bullets: [demo.tagline],
      notaVisual: 'Slide portada: logo Koptup grande + título demo',
    },
    {
      numero: 2,
      titulo: 'El problema',
      bullets: [demo.problemaResuelve],
      notaVisual: 'Imagen problema: persona frustrada / proceso manual roto',
    },
    {
      numero: 3,
      titulo: 'Cómo lo resolvemos',
      bullets: demo.beneficiosClave.slice(0, 3),
      notaVisual: `Screenshot del demo ${demo.titulo} mostrando la interfaz`,
    },
    {
      numero: 4,
      titulo: 'Capacidades IA',
      bullets: demo.caracteristicasIA.slice(0, 4),
      notaVisual: 'Diagrama de arquitectura simplificado',
    },
    {
      numero: 5,
      titulo: 'Resultados reales',
      bullets: [demo.metricaImpactante],
      notaVisual: 'Métrica grande tipo "94%" centrada',
    },
    {
      numero: 6,
      titulo: '¿Para quién?',
      bullets: demo.publicoObjetivo.slice(0, 4),
      notaVisual: 'Iconos de industrias / logos placeholder',
    },
    {
      numero: 7,
      titulo: 'Probalo gratis',
      bullets: [`koptup.com${demo.path}`, 'Sin registro, sin tarjeta'],
      notaVisual: 'CTA grande + QR opcional',
    },
  ];
}
