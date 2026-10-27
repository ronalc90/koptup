/**
 * Clasificador POR REGLAS de la demo (no es un modelo de IA).
 *
 * Busca señales (palabras y patrones en español y en inglés) sobre el texto
 * sin tildes y en minúsculas. Cada señal suma a una o varias categorías con un
 * peso; la confianza de una categoría es 1 − Π(1 − peso) de sus señales, con
 * tope de 0,99. Las señales de refuerzo («boost») solo cuentan si ya hay una
 * señal principal de esa categoría (así «profe» o «desde casa» solos no
 * marcan nada). Si ninguna categoría llega a MIN_SCORE, el resultado es
 * «sin infracción».
 *
 * En un proyecto real esto lo hace un modelo de moderación o un LLM con las
 * políticas de la plataforma; aquí sirve para que la cola, las reglas y las
 * métricas de la demo se calculen de verdad sobre el texto.
 */
import { CATEGORIES, type CategoryKey, type Label } from './types';

export const MAX_TEXT = 500;
export const MIN_SCORE = 0.2;

export interface Signal {
  id: string;
  re: RegExp;
  primary?: Partial<Record<CategoryKey, number>>;
  boost?: Partial<Record<CategoryKey, number>>;
}

export const SIGNALS: Signal[] = [
  // --- Pago o contacto por fuera de la plataforma
  { id: 'phone', re: /\b3[0-9x]{2}[ .-]?[0-9x]{3}[ .-]?[0-9x]{4}\b/, primary: { offPlatform: 0.45 }, boost: { illegalLending: 0.15, scam: 0.1, minors: 0.2 } },
  { id: 'outside', re: /\b(por fuera|fuera de la (app|aplicacion|plataforma|pagina)|outside (the|this) (app|platform|site)|off[- ]platform)\b/, primary: { offPlatform: 0.5 } },
  { id: 'contact', re: /\b(escribeme|escribame|llamame|text me|call me|message me|mi (numero|celular|correo)( personal)?|my (personal )?(number|phone|email))\b/, primary: { offPlatform: 0.35 }, boost: { minors: 0.25 } },
  { id: 'fee', re: /\b(ahorr\w* (la )?comision|sin (pagar )?comision|(skip|avoid|save on) (the )?(fee|commission))\b/, primary: { offPlatform: 0.35 } },
  { id: 'email', re: /[a-z0-9._-]+@[a-z0-9-]+\.[a-z.]{2,}|\[(correo|email)\]/, primary: { offPlatform: 0.3 } },

  // --- Estafa o fraude
  { id: 'upfront', re: /\b(envia|enviar|consigna|consignar|transfiere|paga|pagar|deposita|send|pay|deposit|transfer)\b(?:[^.]|\.(?=\d)){0,50}\b(kit|inscripcion|registro|activacion|activar|desbloqueo|sign[- ]?up|registration|activation|starter)\b/, primary: { scam: 0.55 } },
  { id: 'income', re: /\b(gana|ganar|ganas|earn|make)\b(?:[^.]|\.(?=\d)){0,40}(\$ ?[0-9][0-9.,]*|millones|diarios|semanales|a day|a week|per day|per week|weekly|daily)/, primary: { scam: 0.4 } },
  { id: 'home', re: /\b(desde (tu |la )?casa|sin experiencia|from home|no experience( needed)?)\b/, boost: { scam: 0.2 } },
  { id: 'double', re: /\b(duplica\w*|triplica\w*|doubles?|triples?)\b(?:[^.]|\.(?=\d)){0,30}\b(plata|dinero|inversion|money|cash|investment)\b/, primary: { scam: 0.5 } },
  { id: 'guaranteed', re: /\b(rentabilidad garantizada|ganancia garantizada|inversion segura|guaranteed (returns?|profits?)|risk[- ]free investment)\b/, primary: { scam: 0.4 } },
  { id: 'urgency', re: /\b(solo hoy|cupos limitados|ultimos cupos|empiezas hoy|invierte hoy|today only|limited spots|last spots|start today|invest today)\b/, boost: { scam: 0.15, spam: 0.15 } },
  { id: 'shortlink', re: /\b(bit\.ly|tinyurl\.com|cutt\.ly|t\.ly)\/[a-z0-9]+|\b(enlace|link) acortado\b|\bshortened link\b/, primary: { spam: 0.4 }, boost: { scam: 0.15 } },

  // --- Préstamo ilegal («gota a gota»)
  { id: 'loan', re: /\b(prestamos?|creditos?|plata prestada|loans?)\b(?:[^.]|\.(?=\d)){0,40}\b(sin papeleo|sin fiador|sin codeudor|sin estudio|inmediatos?|al instante|no paperwork|no guarantor|no credit check|instant|same[- ]day)\b|\b(instant|same[- ]day) (cash )?loans?\b/, primary: { illegalLending: 0.55 } },
  { id: 'daily', re: /\b(cobro diario|pago diario|cuotas diarias|gota a gota|daily (collection|payments?|installments?)|collected daily)\b/, primary: { illegalLending: 0.6 } },
  { id: 'bureau', re: /\b(sin centrales( de riesgo)?|reportados? en centrales|bad credit ok|no credit bureau)\b/, boost: { illegalLending: 0.3 } },

  // --- Reseña falsa
  { id: 'sameReview', re: /\b(misma resena|resenas? (identicas|iguales|repetidas)|same review|identical reviews?|duplicate reviews?)\b/, primary: { fakeReview: 0.55 } },
  { id: 'newAccounts', re: /\b(cuentas? (creadas?|nuevas?|abiertas?) (hoy|ayer|esta semana)|accounts? (created|opened) (today|yesterday|this week))\b/, primary: { fakeReview: 0.4 } },
  { id: 'paidReview', re: /\b(te pago|i'?ll pay you|paying)\b(?:[^.]|\.(?=\d)){0,30}\b(resenas?|reviews?)\b/, primary: { fakeReview: 0.5 } },
  { id: 'stars', re: /\b((5|cinco) estrellas|(5|five)[- ]stars?|100 ?% recomendad\w*|100 ?% recommended)/, boost: { fakeReview: 0.2 } },

  // --- Acoso, insultos o amenazas
  { id: 'insultMask', re: /\[(insulto|insult)\]/, primary: { harassment: 0.5 } },
  { id: 'insult', re: /\b(idiota|imbecil|estupid[oa]|inutil|basura|lambon|tarad[oa]|idiot|moron|stupid|useless|loser|trash)\b/, primary: { harassment: 0.45 } },
  { id: 'threat', re: /\b(te voy a (buscar|encontrar|hacer dano|partir la cara)|i('m| am) going to (find|get|hurt) you|i will (find|get|hurt) you)\b/, primary: { harassment: 0.55 } },
  { id: 'whereYouLive', re: /\b(se donde (vives|trabajas)|i know where you (live|work))\b/, primary: { harassment: 0.5 } },
  { id: 'getLost', re: /\b(largate|vete de aqui|nadie te quiere|get lost|get out of here|nobody wants you)\b/, primary: { harassment: 0.3 } },
  { id: 'fireHim', re: /\b(ojala (lo|la|te) (echen|boten|despidan)|hope they fire (him|her|you))\b/, primary: { harassment: 0.25 } },

  // --- Discurso de odio o discriminación
  { id: 'groupMask', re: /\[(grupo|group|origen|origin)\]/, primary: { hate: 0.35 } },
  { id: 'dehuman', re: /\b(plaga|ratas|parasitos|escoria|plague|rats|parasites|vermin)\b/, primary: { hate: 0.45 } },
  { id: 'exclude', re: /\b(no deberian? (poder )?(vivir|estar|entrar|trabajar)|should(n'?t| not) (be allowed to )?(live|be here|come|work))\b/, primary: { hate: 0.4 } },
  { id: 'onlyGender', re: /\b(solo (mujeres|hombres)|(women|men) only|only (women|men))\b/, primary: { hate: 0.45 } },
  { id: 'single', re: /\b(solter[oa]s?|single|unmarried)\b/, boost: { hate: 0.3 } },
  { id: 'age', re: /\b((menores|mayores) de \d+ anos|(under|over) \d+)\b/, boost: { hate: 0.3 } },

  // --- Protección de menores
  { id: 'secret', re: /\b(no (le )?(cuentes|digas) (nada )?(a tus (papas|padres)|a tu (mama|papa)|al profe|a nadie)|(nuestro|sera nuestro|es un) secreto|don'?t tell (your (parents|mom|dad)|the teacher|anyone)|our (little )?secret)\b/, primary: { minors: 0.6 } },
  { id: 'private', re: /\b(por interno|al privado|por privado|chat privado|private chat|privately|in private)\b/, boost: { minors: 0.35 } },
  { id: 'meetAlone', re: /\b(vernos a solas|encontremonos solos|meet alone|meet in private)\b/, primary: { minors: 0.5 } },
  { id: 'minorContext', re: /\b(tutor|profe|profesora?|estudiante|alumn[oa]s?|colegio|nina|nino|menor de edad|cuantos anos tienes|teacher|student|pupil|school|kid|minor|how old are you)\b/, boost: { minors: 0.3 } },

  // --- Contenido sexual
  { id: 'nudity', re: /\b(desnud\w*|semidesnud\w*|pornografi\w*|porno|xxx|contenido (sexual|para adultos)|nude|nudes|nudity|naked|porn\w*|sexual content|adult content)\b/, primary: { sexual: 0.6 } },
  { id: 'packs', re: /\b(packs?|fotos? (intimas|calientes)|spicy pics|intimate (photos|pics))\b/, primary: { sexual: 0.45 } },
  { id: 'explicit', re: /\b(explicit[oa]s?|explicit)\b/, boost: { sexual: 0.4 } },

  // --- Autolesión
  { id: 'cantGoOn', re: /\b(ya no (aguanto|puedo) mas|no quiero (vivir|seguir)|can'?t take (it|this) anymore|i can'?t go on|don'?t want to (live|go on))\b/, primary: { selfHarm: 0.45 } },
  { id: 'selfHarmExplicit', re: /\b(mejor no despertar|quitarme la vida|acabar con todo|hacerme dano|suicid\w*|better not to wake up|better never to wake up|end it all|kill myself|hurt myself)\b/, primary: { selfHarm: 0.6 } },
  { id: 'empty', re: /\b(me siento vaci[oa]|nadie me extranaria|i feel empty|no one would miss me)\b/, primary: { selfHarm: 0.35 } },

  // --- Suplantación
  { id: 'official', re: /\b((soporte|mesa de ayuda|servicio al cliente|equipo) oficial|somos (el banco|la billetera|la plataforma|soporte)|official (support|help ?desk|customer service|team)|we are (the bank|the wallet|the platform|support))\b/, primary: { impersonation: 0.45 } },
  { id: 'credentials', re: /\b(envia\w*|enviar|dame|comparte\w*|dicta\w*|send|give|share|tell)\b(?:[^.]|\.(?=\d)){0,30}\b(codigo|clave|contrasena|pin|token|code|password|otp)\b/, primary: { impersonation: 0.55, scam: 0.3 } },
  { id: 'unlock', re: /\b((desbloquear|verificar|reactivar) tu cuenta|(unlock|verify|reactivate) your account)\b/, primary: { impersonation: 0.3 }, boost: { scam: 0.2 } },
  { id: 'officialHandle', re: /\b(soporte|support|oficial|official|admin)[_.-][a-z0-9_.-]+/, primary: { impersonation: 0.35 } },

  // --- Spam
  { id: 'repeat', re: /\b([a-z]{3,})\b(?:\W+\1\b){2,}/, primary: { spam: 0.35 } },
  { id: 'bang', re: /[!¡]{3,}/, primary: { spam: 0.2 } },
  { id: 'promo', re: /\b(gana premios|entra ya|haz clic|clic aqui|oferta imperdible|sorteo|win prizes|click here|join now|unbeatable offer|giveaway)\b/, primary: { spam: 0.35 } },
];

/** Texto sin tildes y en minúsculas, con el índice original de cada carácter. */
export function normalize(text: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const n = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (let k = 0; k < n.length; k++) {
      norm += n[k];
      map.push(i);
    }
  }
  map.push(text.length);
  return { norm, map };
}

export interface SignalHit {
  id: string;
  spans: Array<[number, number]>;
  /** Fragmentos del texto original que activaron la señal. */
  fragments: string[];
}

export interface Classification {
  label: Label;
  /** Confianza de la categoría ganadora (0–0,99); en «sin infracción», la mayor. */
  score: number;
  scores: Record<CategoryKey, number>;
  hits: SignalHit[];
  /** Señales que cuentan para cada categoría (principales y refuerzos que aplicaron). */
  signalsBy: Record<CategoryKey, string[]>;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function emptyScores(): Record<CategoryKey, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<CategoryKey, number>;
}

export function classify(input: string): Classification {
  const text = input.slice(0, MAX_TEXT);
  const { norm, map } = normalize(text);
  const hits: SignalHit[] = [];
  for (const s of SIGNALS) {
    const re = new RegExp(s.re.source, 'g');
    const spans: Array<[number, number]> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm))) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      spans.push([map[m.index], map[m.index + m[0].length - 1] + 1]);
    }
    if (spans.length) hits.push({ id: s.id, spans, fragments: spans.map(([a, b]) => text.slice(a, b)) });
  }

  const hitIds = new Set(hits.map((h) => h.id));
  const scores = emptyScores();
  const signalsBy = Object.fromEntries(CATEGORIES.map((c) => [c, [] as string[]])) as Record<CategoryKey, string[]>;
  for (const cat of CATEGORIES) {
    const primaries = SIGNALS.filter((s) => s.primary?.[cat] !== undefined && hitIds.has(s.id));
    if (!primaries.length) continue;
    const boosts = SIGNALS.filter((s) => s.boost?.[cat] !== undefined && hitIds.has(s.id));
    let rest = 1;
    for (const s of primaries) rest *= 1 - (s.primary![cat] as number);
    for (const s of boosts) rest *= 1 - (s.boost![cat] as number);
    scores[cat] = Math.min(0.99, round2(1 - rest));
    signalsBy[cat] = [...primaries, ...boosts].map((s) => s.id);
  }

  let best: CategoryKey = CATEGORIES[0];
  for (const cat of CATEGORIES) if (scores[cat] > scores[best]) best = cat;
  const top = scores[best];
  return { label: top >= MIN_SCORE ? best : 'none', score: top, scores, hits, signalsBy };
}

/** Rangos del texto que explican la categoría (para resaltar), sin solaparse. */
export function highlightSpans(c: Classification, cat: Label): Array<[number, number]> {
  if (cat === 'none') return [];
  const ids = new Set(c.signalsBy[cat]);
  const spans = c.hits.filter((h) => ids.has(h.id)).flatMap((h) => h.spans);
  spans.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
}

/** Corta el texto en partes normales y resaltadas. */
export function splitHighlights(text: string, spans: Array<[number, number]>): Array<{ text: string; mark: boolean }> {
  const out: Array<{ text: string; mark: boolean }> = [];
  let pos = 0;
  for (const [a, b] of spans) {
    if (a > pos) out.push({ text: text.slice(pos, a), mark: false });
    out.push({ text: text.slice(a, b), mark: true });
    pos = b;
  }
  if (pos < text.length) out.push({ text: text.slice(pos), mark: false });
  return out;
}

/** Las categorías con mayor confianza (para mostrar el detalle). */
export function topCategories(c: Classification, n = 3): Array<{ cat: CategoryKey; score: number }> {
  return CATEGORIES.map((cat) => ({ cat, score: c.scores[cat] }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
