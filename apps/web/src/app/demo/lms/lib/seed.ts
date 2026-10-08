/**
 * Estado inicial de la demo: el perfil de ejemplo de quien la recorre (dos
 * cursos comprados, uno terminado con certificado), los cupones y una cohorte
 * de estudiantes de ejemplo generada de forma determinista, con fechas
 * relativas al día en que se abre la demo.
 */
import { addDays, diffDays, yearOf, type ISODate } from './dates';
import { CITIES, COHORT_SIZE, COURSES, FIRST_NAMES, LAST_NAMES } from './catalog';
import { lessonsOf, prng, totals } from './engine';
import type { CohortEnrollment, Coupon, Enrollment, LmsState, PayMethod, Sale } from './types';

export const STATE_VERSION = 5;

export const SEED_COUPONS: Coupon[] = [
  { code: 'BIENVENIDA10', pct: 10, active: true, uses: 0 },
  { code: 'EMPRESA20', pct: 20, active: true, uses: 0 },
  { code: 'VERANO15', pct: 15, active: false, uses: 0 },
];

const POOL = 320;

export function studentName(sid: number): string {
  return `${FIRST_NAMES[sid % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(sid / FIRST_NAMES.length) % LAST_NAMES.length]}`;
}

function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

export function buildCohort(today: ISODate): CohortEnrollment[] {
  const rows: CohortEnrollment[] = [];
  for (const course of COURSES) {
    const rnd = prng(hashId(course.id) ^ 0x9e3779b9);
    const n = COHORT_SIZE[course.id] ?? 0;
    const steps = lessonsOf(course).length;
    const used = new Set<number>();
    for (let i = 0; i < n; i++) {
      let sid = Math.floor(rnd() * POOL);
      while (used.has(sid)) sid = (sid + 1) % POOL;
      used.add(sid);
      const enrolledAgo = Math.floor(Math.pow(rnd(), 1.35) * 175);
      const stalled = rnd() < 0.2;
      const pace = 0.6 + rnd() * 2.6;
      let progress = Math.min(100, enrolledAgo * pace);
      if (stalled) progress = Math.min(progress, rnd() * 60);
      const done = Math.round((progress / 100) * steps);
      progress = Math.round((done / steps) * 100);
      let lastAgo: number;
      if (progress >= 100) lastAgo = Math.floor(rnd() * Math.max(1, enrolledAgo));
      else if (stalled) lastAgo = Math.min(enrolledAgo, 14 + Math.floor(rnd() * 30));
      else lastAgo = Math.min(enrolledAgo, Math.floor(Math.pow(rnd(), 1.6) * 9));
      let score: number | null = null;
      if (progress >= 100) score = rnd() < 0.55 ? 100 : 75;
      else if (done === steps - 1 && rnd() < 0.5) score = rnd() < 0.5 ? 50 : 25;
      const r = rnd();
      const method: PayMethod = r < 0.45 ? 'pse' : r < 0.8 ? 'card' : 'nequi';
      const rc = rnd();
      const coupon =
        enrolledAgo > 120 && rc < 0.15 ? 'VERANO15' : enrolledAgo <= 120 && rc < 0.18 ? 'BIENVENIDA10' : enrolledAgo <= 120 && rc < 0.25 ? 'EMPRESA20' : undefined;
      const pct = coupon ? SEED_COUPONS.find((c) => c.code === coupon)?.pct ?? 0 : 0;
      const tt = totals(course.price, pct);
      rows.push({
        id: `${course.id}-${i + 1}`,
        studentId: `s${sid}`,
        name: studentName(sid),
        city: CITIES[(sid * 3) % CITIES.length],
        courseId: course.id,
        enrolledAt: addDays(today, -enrolledAgo),
        progress,
        lastActive: addDays(today, -lastAgo),
        score,
        method,
        coupon,
        total: tt.total,
        discount: tt.discount,
      });
    }
  }
  return rows;
}

export function buildState(today: ISODate): LmsState {
  const year = yearOf(today);
  const profile = { name: 'Valentina Ríos', email: 'valentina.rios@example.com', doc: '1088123456' };
  const cohort = buildCohort(today);
  // Numeración de certificados coherente con los que ya emitió la academia de ejemplo.
  const issued = cohort.filter((r) => r.progress >= 100).length;
  const certId = `AQ-${year}-${String(Math.max(1, issued - 25)).padStart(4, '0')}`;
  const datos: Enrollment = {
    courseId: 'datos',
    enrolledAt: addDays(today, -34),
    completed: {
      'datos-l1': addDays(today, -30),
      'datos-l2': addDays(today, -29),
      'datos-l3': addDays(today, -27),
      'datos-l4': addDays(today, -25),
      'datos-l5': addDays(today, -22),
    },
    lastLessonId: 'datos-l5',
    position: {},
    quiz: { answers: [1, 0, 1, 2], score: 4, total: 4, at: addDays(today, -22), best: 4 },
    certificateId: certId,
  };
  const excel: Enrollment = {
    courseId: 'excel',
    enrolledAt: addDays(today, -9),
    completed: { 'excel-l1': addDays(today, -2), 'excel-l2': addDays(today, -1) },
    lastLessonId: 'excel-l3',
    position: {},
  };
  const sale = (id: string, courseId: string, date: ISODate, method: PayMethod, coupon?: string, last4?: string): Sale => {
    const course = COURSES.find((c) => c.id === courseId)!;
    const pct = coupon ? SEED_COUPONS.find((c) => c.code === coupon)?.pct ?? 0 : 0;
    const tt = totals(course.price, pct);
    return {
      id,
      ref: `AQ-${date.replace(/-/g, '').slice(2)}-${id.toUpperCase()}`,
      invoice: '',
      date,
      courseId,
      buyer: profile.name,
      email: profile.email,
      doc: profile.doc,
      method,
      gross: tt.gross,
      discount: tt.discount,
      total: tt.total,
      coupon,
      last4,
      mine: true,
    };
  };
  const coupons = SEED_COUPONS.map((c) => ({ ...c }));
  const mySales = [sale('m1', 'datos', addDays(today, -34), 'card', undefined, '4242'), sale('m2', 'excel', addDays(today, -9), 'pse', 'BIENVENIDA10')];
  for (const c of coupons) {
    c.uses = cohort.filter((r) => r.coupon === c.code).length + mySales.filter((s) => s.coupon === c.code).length;
  }
  return {
    version: STATE_VERSION,
    baseDate: today,
    savedAt: today,
    seq: issued + 1,
    idSeq: 2,
    profile,
    enrollments: { datos, excel },
    sales: mySales,
    coupons,
    certificates: [{ id: certId, courseId: 'datos', name: profile.name, date: addDays(today, -22), hours: 12, score: 4, total: 4 }],
    notes: [],
    cohort,
    customCourses: [],
    reminders: {},
    live: {},
    tutorQuestions: 0,
  };
}

/** Mueve la cohorte de ejemplo al día actual (los datos propios no se tocan). */
export function rebaseCohort(s: LmsState, today: ISODate): LmsState {
  const delta = diffDays(today, s.baseDate);
  if (delta === 0) return s;
  return {
    ...s,
    baseDate: today,
    cohort: s.cohort.map((r) => ({ ...r, enrolledAt: addDays(r.enrolledAt, delta), lastActive: addDays(r.lastActive, delta) })),
    reminders: Object.fromEntries(Object.entries(s.reminders).filter(([, d]) => diffDays(today, d) < 7)),
  };
}
