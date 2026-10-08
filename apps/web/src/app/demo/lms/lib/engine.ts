/**
 * Reglas de la demo LMS sin dependencias de React (se prueban en
 * __tests__/engine.test.ts): precios y cupones, avance, ruta adaptativa,
 * logros, analítica de la cohorte, riesgo de abandono, CSV, calendario (.ics)
 * y enlace de verificación de certificados.
 */
import { addDays, bogotaInstant, diffDays, type ISODate } from './dates';
import type {
  CohortEnrollment, Coupon, Course, Enrollment, L, Lesson, LmsState, Locale, QuizQuestion,
} from './types';

export const IVA_RATE = 0.19;
export const PASS_PCT = 70;
export const XP = { lesson: 50, quizPass: 100, quizPerfect: 50, certificate: 200, weekly: 150 } as const;
export const LEVEL_XP = 500;
export const WEEKLY_GOAL = 3;

export const pick = (x: L, locale: Locale | string): string => (locale === 'en' ? x.en : x.es);

/** Generador pseudoaleatorio determinista (mismos datos en cada visita). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dígito de verificación del NIT (algoritmo de la DIAN). */
export function nitDv(nit: string): number {
  const w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * w[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

export function formatNit(nit: string): string {
  return `${nit.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitDv(nit)}`;
}

// ---------------------------------------------------------------------------
// Precios, cupones y pagos (simulados)
// ---------------------------------------------------------------------------
export interface Totals {
  gross: number;
  discount: number;
  total: number;
  /** Base gravable e IVA incluidos en el total (precio con IVA incluido). */
  base: number;
  iva: number;
}

export function totals(price: number, pct = 0): Totals {
  const discount = Math.round((price * pct) / 100);
  const total = price - discount;
  const base = Math.round(total / (1 + IVA_RATE));
  return { gross: price, discount, total, base, iva: total - base };
}

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; reason: 'empty' | 'notFound' | 'inactive' };

export function checkCoupon(code: string, coupons: Coupon[]): CouponCheck {
  const c = code.trim().toUpperCase();
  if (!c) return { ok: false, reason: 'empty' };
  const found = coupons.find((x) => x.code === c);
  if (!found) return { ok: false, reason: 'notFound' };
  if (!found.active) return { ok: false, reason: 'inactive' };
  return { ok: true, coupon: found };
}

export const COUPON_RE = /^[A-Z0-9]{4,16}$/;

/** Algoritmo de Luhn (validación del número de tarjeta en la simulación). */
export function luhn(num: string): boolean {
  const d = num.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_CO_RE = /^3\d{9}$/;

// ---------------------------------------------------------------------------
// Avance y ruta adaptativa
// ---------------------------------------------------------------------------
export function lessonsOf(course: Course): Lesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

export function findLesson(course: Course, lessonId: string): Lesson | undefined {
  return lessonsOf(course).find((x) => x.id === lessonId);
}

export function progressOf(course: Course, enr?: Enrollment): number {
  if (!enr) return 0;
  const all = lessonsOf(course);
  if (all.length === 0) return 0;
  const done = all.filter((x) => enr.completed[x.id]).length;
  return Math.round((done / all.length) * 100);
}

export function quizPct(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function gradeQuiz(questions: QuizQuestion[], answers: number[]) {
  const score = questions.reduce((acc, qq, i) => acc + (answers[i] === qq.correct ? 1 : 0), 0);
  const pct = quizPct(score, questions.length);
  const failed = questions.filter((qq, i) => answers[i] !== qq.correct);
  return { score, total: questions.length, pct, passed: pct >= PASS_PCT, failed };
}

export type PathStep =
  | { kind: 'lesson'; lesson: Lesson; state: 'done' | 'current' | 'pending' }
  | { kind: 'reinforce'; lesson: Lesson }
  | { kind: 'nextCourse'; courseId: string }
  | { kind: 'takeQuiz' };

/**
 * Ruta del estudiante: las lecciones en orden (hechas, la actual y las
 * pendientes) y, después de la evaluación, una rama que depende del
 * resultado: con menos de 70 % se recomiendan las lecciones de las preguntas
 * falladas; con 70 % o más, el siguiente curso.
 */
export function learningPath(course: Course, enr: Enrollment | undefined, nextCourseId?: string): PathStep[] {
  const all = lessonsOf(course);
  const content = all.filter((x) => x.kind !== 'quiz');
  const quizLesson = all.find((x) => x.kind === 'quiz');
  const firstPending = content.find((x) => !enr?.completed[x.id]);
  const steps: PathStep[] = content.map((lesson) => ({
    kind: 'lesson' as const,
    lesson,
    state: enr?.completed[lesson.id] ? ('done' as const) : lesson.id === firstPending?.id ? ('current' as const) : ('pending' as const),
  }));
  // La evaluación aparece como lección hecha cuando se aprueba; si no, como paso por presentar.
  if (quizLesson && enr?.completed[quizLesson.id]) steps.push({ kind: 'lesson', lesson: quizLesson, state: 'done' });
  else if (course.quiz.length > 0) steps.push({ kind: 'takeQuiz' });
  const attempt = enr?.quiz;
  if (!attempt) return steps;
  const pct = quizPct(attempt.score, attempt.total);
  if (pct < PASS_PCT) {
    const failedLessons = new Set<string>();
    course.quiz.forEach((qq, i) => {
      if (attempt.answers[i] !== qq.correct) failedLessons.add(qq.lessonId);
    });
    for (const id of failedLessons) {
      const lesson = all.find((x) => x.id === id);
      if (lesson) steps.push({ kind: 'reinforce', lesson });
    }
  } else if (nextCourseId) {
    steps.push({ kind: 'nextCourse', courseId: nextCourseId });
  }
  return steps;
}

/** ¿Ya cumple para el certificado? Todas las lecciones y evaluación aprobada. */
export function eligibleForCertificate(course: Course, enr: Enrollment): boolean {
  const all = lessonsOf(course);
  const allDone = all.every((x) => enr.completed[x.id]);
  const passed = course.quiz.length === 0 || (!!enr.quiz && quizPct(enr.quiz.best, enr.quiz.total) >= PASS_PCT);
  return allDone && passed;
}

// ---------------------------------------------------------------------------
// Logros (XP, nivel, racha, reto semanal, insignias)
// ---------------------------------------------------------------------------
export interface Achievements {
  xp: number;
  level: number;
  levelFloor: number;
  nextLevelXp: number;
  lessonsDone: number;
  quizzesPassed: number;
  perfectQuizzes: number;
  streak: number;
  weekly: number;
  weeklyDone: boolean;
  badges: Record<'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6', boolean>;
}

/** Días seguidos con al menos una lección completada, contando hasta hoy o ayer. */
export function streakDays(dates: ISODate[], today: ISODate): number {
  const set = new Set(dates);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function achievements(s: LmsState, today: ISODate): Achievements {
  const enrs = Object.values(s.enrollments);
  const dates = enrs.flatMap((e) => Object.values(e.completed));
  const lessonsDone = dates.length;
  const quizzesPassed = enrs.filter((e) => e.quiz && quizPct(e.quiz.best, e.quiz.total) >= PASS_PCT).length;
  const perfectQuizzes = enrs.filter((e) => e.quiz && e.quiz.best === e.quiz.total && e.quiz.total > 0).length;
  const weekly = dates.filter((d) => diffDays(today, d) >= 0 && diffDays(today, d) < 7).length;
  const weeklyDone = weekly >= WEEKLY_GOAL;
  const streak = streakDays(dates, today);
  const xp =
    lessonsDone * XP.lesson +
    quizzesPassed * XP.quizPass +
    perfectQuizzes * XP.quizPerfect +
    s.certificates.length * XP.certificate +
    (weeklyDone ? XP.weekly : 0);
  const level = Math.floor(xp / LEVEL_XP) + 1;
  return {
    xp,
    level,
    levelFloor: (level - 1) * LEVEL_XP,
    nextLevelXp: level * LEVEL_XP,
    lessonsDone,
    quizzesPassed,
    perfectQuizzes,
    streak,
    weekly,
    weeklyDone,
    badges: {
      b1: lessonsDone >= 1,
      b2: streak >= 3,
      b3: perfectQuizzes >= 1,
      b4: s.tutorQuestions >= 3,
      b5: s.notes.length >= 3,
      b6: s.certificates.length >= 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Analítica de la cohorte (vista Instructor)
// ---------------------------------------------------------------------------
export type Risk = 'high' | 'mid' | 'low' | 'done';

/** Regla transparente (no es IA): días sin entrar y avance. */
export function riskOf(e: Pick<CohortEnrollment, 'progress' | 'lastActive'>, today: ISODate): Risk {
  if (e.progress >= 100) return 'done';
  const idle = diffDays(today, e.lastActive);
  if (idle >= 14 && e.progress < 80) return 'high';
  if (idle >= 7 || (idle >= 4 && e.progress < 30)) return 'mid';
  return 'low';
}

export interface Analytics {
  enrolled: number;
  active7: number;
  completion: number;
  avgScore: number | null;
  trend: { date: ISODate; count: number }[];
  riskHighPct: number;
  atRisk: (CohortEnrollment & { risk: Risk; idle: number })[];
  lessonRates: { lesson: Lesson; courseId: string; rate: number }[];
}

export function analytics(rows: CohortEnrollment[], courses: Course[], today: ISODate): Analytics {
  const enrolled = rows.length;
  const active7 = rows.filter((r) => diffDays(today, r.lastActive) < 7).length;
  const completed = rows.filter((r) => r.progress >= 100).length;
  const scored = rows.filter((r) => r.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length) : null;

  const trend: { date: ISODate; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    trend.push({ date, count: rows.filter((r) => r.lastActive === date).length });
  }

  const withRisk = rows.map((r) => ({ ...r, risk: riskOf(r, today), idle: diffDays(today, r.lastActive) }));
  const open = withRisk.filter((r) => r.risk !== 'done');
  const high = open.filter((r) => r.risk === 'high').length;
  const order: Record<Risk, number> = { high: 0, mid: 1, low: 2, done: 3 };
  const atRisk = open
    .filter((r) => r.risk !== 'low')
    .sort((a, b) => order[a.risk] - order[b.risk] || b.idle - a.idle || a.progress - b.progress);

  const lessonRates: Analytics['lessonRates'] = [];
  for (const c of courses) {
    const cr = rows.filter((r) => r.courseId === c.id);
    if (cr.length === 0) continue;
    const all = lessonsOf(c);
    all.forEach((lesson, idx) => {
      const reached = cr.filter((r) => Math.round((r.progress / 100) * all.length) > idx).length;
      lessonRates.push({ lesson, courseId: c.id, rate: Math.round((reached / cr.length) * 100) });
    });
  }

  return {
    enrolled,
    active7,
    completion: enrolled ? Math.round((completed / enrolled) * 100) : 0,
    avgScore,
    trend,
    riskHighPct: open.length ? Math.round((high / open.length) * 100) : 0,
    atRisk,
    lessonRates,
  };
}

/** Fila de la cohorte que representa a quien recorre la demo. */
export function myCohortRow(course: Course, enr: Enrollment, name: string, today: ISODate): CohortEnrollment {
  const dates = Object.values(enr.completed).sort();
  const last = dates[dates.length - 1] ?? enr.enrolledAt;
  return {
    id: `me-${course.id}`,
    studentId: 'me',
    name,
    city: 'Pereira',
    courseId: course.id,
    enrolledAt: enr.enrolledAt,
    progress: progressOf(course, enr),
    lastActive: diffDays(today, last) < 0 ? today : last,
    score: enr.quiz ? quizPct(enr.quiz.best, enr.quiz.total) : null,
    method: 'pse',
    total: 0,
    discount: 0,
  };
}

// ---------------------------------------------------------------------------
// Archivos: CSV y calendario
// ---------------------------------------------------------------------------
export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Separador ";" para que Excel en español lo abra en columnas.
  return '\uFEFF' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
}

function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function sessionStart(t: { dayOffset: number | null; time: string; startedMinAgo?: number }, nowMs: number, today: ISODate): number {
  if (t.dayOffset === null) {
    // Redondeado al minuto para que el inicio no cambie en cada render.
    return Math.floor((nowMs - (t.startedMinAgo ?? 0) * 60000) / 60000) * 60000;
  }
  return bogotaInstant(addDays(today, t.dayOffset), t.time);
}

export function icsFor(ev: { uid: string; title: string; description: string; startMs: number; durationMin: number; stampMs: number }): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Academia Quinde//Demo LMS//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${icsDate(ev.stampMs)}`,
    `DTSTART:${icsDate(ev.startMs)}`,
    `DTEND:${icsDate(ev.startMs + ev.durationMin * 60000)}`,
    `SUMMARY:${icsText(ev.title)}`,
    `DESCRIPTION:${icsText(ev.description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// ---------------------------------------------------------------------------
// Verificación de certificados
// ---------------------------------------------------------------------------
export interface CertPayload {
  c: string; // código
  n: string; // nombre
  t: string; // curso
  h: number; // horas
  f: ISODate; // fecha de emisión
  o: string; // organización
}

/** Huella de 64 bits (dos FNV-1a de 32 bits). Es una firma de ejemplo, no criptográfica. */
export function fingerprint(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ch, 0x5bd1e995) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

const SALT = 'demo-lms-academia-quinde';

export function signCert(p: CertPayload): string {
  return fingerprint(`${SALT}|${p.c}|${p.n}|${p.t}|${p.h}|${p.f}|${p.o}`).toUpperCase();
}

function toB64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeCert(p: CertPayload): string {
  return toB64Url(JSON.stringify({ ...p, s: signCert(p) }));
}

export type CertCheck = { status: 'valid'; payload: CertPayload; signature: string } | { status: 'tampered'; payload: CertPayload } | { status: 'invalid' };

export function decodeCert(d: string | null | undefined): CertCheck {
  if (!d || d.length > 2000) return { status: 'invalid' };
  try {
    const raw = JSON.parse(fromB64Url(d)) as Partial<CertPayload> & { s?: string };
    if (
      typeof raw.c !== 'string' || typeof raw.n !== 'string' || typeof raw.t !== 'string' ||
      typeof raw.h !== 'number' || typeof raw.f !== 'string' || typeof raw.o !== 'string' || typeof raw.s !== 'string'
    ) {
      return { status: 'invalid' };
    }
    const payload: CertPayload = { c: raw.c, n: raw.n, t: raw.t, h: raw.h, f: raw.f, o: raw.o };
    return raw.s === signCert(payload) ? { status: 'valid', payload, signature: raw.s } : { status: 'tampered', payload };
  } catch {
    return { status: 'invalid' };
  }
}

export function verifyUrl(origin: string, p: CertPayload): string {
  return `${origin}/demo/lms/verificar?d=${encodeCert(p)}`;
}

// ---------------------------------------------------------------------------
// Tutor sin conexión: búsqueda local en el guion (sin IA)
// ---------------------------------------------------------------------------
const STOP = new Set(
  'a al algo como con cual cuales de del el en es esta este esto hay la las lo los me mi mis o para pero por que qué se si sin sobre su sus te tu tus un una uno y yo the a an and are as at be by do does for from how i in is it my of on or that the this to what which with you your'.split(
    ' ',
  ),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export interface LocalHit {
  lesson: Lesson;
  at: number | null;
  text: string;
  score: number;
}

/** Fragmentos del guion del curso que más se parecen a la pregunta. */
export function localSearch(course: Course, question: string, locale: Locale, k = 2): LocalHit[] {
  const qt = new Set(tokens(question));
  if (qt.size === 0) return [];
  const hits: LocalHit[] = [];
  for (const lesson of lessonsOf(course)) {
    for (const ln of lesson.lines) {
      const text = pick(ln.text, locale);
      const tt = tokens(text + ' ' + pick(lesson.title, locale));
      let score = 0;
      for (const w of qt) {
        if (tt.some((x) => x === w || (w.length > 4 && x.startsWith(w.slice(0, 5))))) score++;
      }
      if (score > 0) hits.push({ lesson, at: lesson.kind === 'video' ? ln.at : null, text, score });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}

/** Primer minuto [mm:ss] que aparece en un fragmento del material. */
export function firstStamp(chunk: string): number | null {
  const m = chunk.match(/\[(\d{1,2}):(\d{2})\]/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// ---------------------------------------------------------------------------
// Preguntas generadas del texto de las lecciones (reglas, sin IA)
// ---------------------------------------------------------------------------
export interface GeneratedQuestion {
  q: string;
  options: string[];
  correct: number;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/**
 * Arma preguntas de completar a partir del texto: en cada frase oculta su
 * palabra clave (la más larga que no sea palabra vacía) y usa como
 * distractores las palabras clave de otras frases. Es determinista.
 */
export function generateQuestions(texts: string[], max = 3, prompt = 'Completa: '): GeneratedQuestion[] {
  const sentences = texts
    .flatMap((t) => t.split(/(?<=[.!?])\s+|\n+/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 260);
  const wordsOf = (s: string) => (s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{5,}/g) ?? []).filter((w) => !STOP.has(w.toLowerCase()));
  const keyOf = (s: string) => [...wordsOf(s)].sort((a, b) => b.length - a.length || a.localeCompare(b))[0];
  // Distractores: palabras clave de todo el texto (las más largas primero).
  const vocabulary = [...new Set(sentences.flatMap(wordsOf))].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const out: GeneratedQuestion[] = [];
  const usedKeys = new Set<string>();
  for (const s of sentences) {
    if (out.length >= max) break;
    const key = keyOf(s);
    if (!key || usedKeys.has(key.toLowerCase())) continue;
    const inSentence = new Set(wordsOf(s).map((w) => w.toLowerCase()));
    const pool = vocabulary.filter((w) => !inSentence.has(w.toLowerCase())).slice(0, 12);
    if (pool.length < 3) continue;
    usedKeys.add(key.toLowerCase());
    const off = hashStr(key) % pool.length;
    const distractors = [0, 1, 2].map((i) => pool[(off + i) % pool.length]);
    const correct = hashStr(s) % 4;
    const options = [...distractors];
    options.splice(correct, 0, key);
    out.push({ q: prompt + s.replace(key, '_____'), options, correct });
  }
  return out;
}
