/**
 * Reglas de la demo LMS: precios y cupones, ruta adaptativa, certificados,
 * logros, verificación por enlace, calendario y búsqueda local del tutor.
 */
import { COURSES } from '../lib/catalog';
import {
  achievements,
  checkCoupon,
  decodeCert,
  eligibleForCertificate,
  encodeCert,
  firstStamp,
  generateQuestions,
  gradeQuiz,
  icsFor,
  learningPath,
  localSearch,
  luhn,
  nitDv,
  riskOf,
  streakDays,
  toCsv,
  totals,
} from '../lib/engine';
import { buildCohort, buildState } from '../lib/seed';
import { courseDocs } from '../lib/tutor';
import { salesList, headerStats } from '../lib/selectors';

const TODAY = '2026-10-08';
const course = (id: string) => COURSES.find((c) => c.id === id)!;

describe('demo LMS · motor', () => {
  it('calcula el dígito de verificación del NIT de la academia', () => {
    expect(nitDv('901482736')).toBe(8);
    expect(nitDv('800197268')).toBe(4);
  });

  it('aplica cupones y separa el IVA incluido', () => {
    const t = totals(890000, 10);
    expect(t.discount).toBe(89000);
    expect(t.total).toBe(801000);
    expect(t.base + t.iva).toBe(801000);
    expect(Math.round(t.base * 0.19)).toBe(t.iva);
    const coupons = [
      { code: 'BIENVENIDA10', pct: 10, active: true, uses: 0 },
      { code: 'VERANO15', pct: 15, active: false, uses: 0 },
    ];
    expect(checkCoupon(' bienvenida10 ', coupons)).toEqual({ ok: true, coupon: coupons[0] });
    expect(checkCoupon('VERANO15', coupons)).toEqual({ ok: false, reason: 'inactive' });
    expect(checkCoupon('NOEXISTE', coupons)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('valida tarjetas con Luhn', () => {
    expect(luhn('4242 4242 4242 4242')).toBe(true);
    expect(luhn('4242 4242 4242 4241')).toBe(false);
  });

  it('cada curso tiene contenido propio y respuestas correctas válidas', () => {
    const titles = new Set(COURSES.map((c) => c.quiz[0].q.es));
    expect(titles.size).toBe(COURSES.length);
    for (const c of COURSES) {
      const ids = new Set(c.modules.flatMap((m) => m.lessons.map((l) => l.id)));
      for (const qq of c.quiz) {
        expect(qq.correct).toBeLessThan(qq.options.length);
        expect(ids.has(qq.lessonId)).toBe(true);
      }
      expect(c.suggestions).toHaveLength(3);
      expect(courseDocs(c, 'es').length).toBeGreaterThan(0);
    }
  });

  it('la ruta adaptativa abre refuerzo con menos de 70 % y sugiere otro curso al aprobar', () => {
    const c = course('finanzas');
    const enr = { courseId: 'finanzas', enrolledAt: TODAY, completed: {}, lastLessonId: 'finanzas-l1', position: {} };
    const wrong = c.quiz.map((qq) => (qq.correct + 1) % qq.options.length);
    const failed = { ...enr, quiz: { answers: wrong, score: 0, total: 4, at: TODAY, best: 0 } };
    const steps = learningPath(c, failed, 'contabilidad');
    expect(steps.filter((s) => s.kind === 'reinforce')).toHaveLength(4);
    const right = c.quiz.map((qq) => qq.correct);
    const passed = { ...enr, quiz: { answers: right, score: 4, total: 4, at: TODAY, best: 4 } };
    expect(learningPath(c, passed, 'contabilidad').some((s) => s.kind === 'nextCourse')).toBe(true);
    expect(gradeQuiz(c.quiz, right).passed).toBe(true);
    expect(gradeQuiz(c.quiz, wrong).passed).toBe(false);
  });

  it('el certificado exige todas las lecciones y la evaluación aprobada', () => {
    const c = course('excel');
    const all = Object.fromEntries(c.modules.flatMap((m) => m.lessons).map((l) => [l.id, TODAY]));
    const base = { courseId: 'excel', enrolledAt: TODAY, completed: all, lastLessonId: 'excel-l5', position: {} };
    expect(eligibleForCertificate(c, base)).toBe(false);
    expect(eligibleForCertificate(c, { ...base, quiz: { answers: [], score: 3, total: 4, at: TODAY, best: 3 } })).toBe(true);
  });

  it('la verificación detecta enlaces modificados', () => {
    const p = { c: 'AQ-2026-0200', n: 'Valentina Ríos', t: 'Excel para análisis de datos', h: 24, f: TODAY, o: 'Academia Quindé S.A.S.' };
    const d = encodeCert(p);
    expect(decodeCert(d)).toMatchObject({ status: 'valid', payload: p });
    const raw = JSON.parse(Buffer.from(d.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    raw.n = 'Otra Persona';
    const forged = Buffer.from(JSON.stringify(raw), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeCert(forged).status).toBe('tampered');
    expect(decodeCert('basura').status).toBe('invalid');
    expect(decodeCert(null).status).toBe('invalid');
  });

  it('cuenta la racha y los logros a partir del estado', () => {
    expect(streakDays(['2026-10-07', '2026-10-06', '2026-10-04'], TODAY)).toBe(2);
    expect(streakDays(['2026-10-08', '2026-10-07'], TODAY)).toBe(2);
    const s = buildState(TODAY);
    const a = achievements(s, TODAY);
    expect(a.lessonsDone).toBe(7);
    expect(a.badges.b6).toBe(true);
    expect(a.xp).toBe(7 * 50 + 100 + 50 + 200);
  });

  it('genera datos de ejemplo deterministas y coherentes', () => {
    const a = buildCohort(TODAY);
    const b = buildCohort(TODAY);
    expect(a).toEqual(b);
    for (const r of a) {
      expect(r.lastActive <= TODAY).toBe(true);
      expect(r.enrolledAt <= r.lastActive).toBe(true);
    }
    const s = buildState(TODAY);
    const sales = salesList(s);
    expect(sales).toHaveLength(s.cohort.length + s.sales.length);
    expect(new Set(sales.map((x) => x.invoice)).size).toBe(sales.length);
    const issued = s.cohort.filter((r) => r.progress >= 100).length;
    expect(s.seq).toBe(issued + 1);
    expect(headerStats(s).courses).toBe(COURSES.length);
    expect(riskOf({ progress: 100, lastActive: '2026-01-01' }, TODAY)).toBe('done');
    expect(riskOf({ progress: 20, lastActive: '2026-09-01' }, TODAY)).toBe('high');
  });

  it('exporta CSV con separador ; y calendario .ics válido', () => {
    const csv = toCsv([['a', 'b;c'], [1, 'x"y']]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"b;c"');
    expect(csv).toContain('"x""y"');
    const ics = icsFor({ uid: 'u1', title: 'Taller, caja', description: 'd', startMs: Date.UTC(2026, 9, 10, 0, 0), durationMin: 90, stampMs: Date.UTC(2026, 9, 8) });
    expect(ics).toContain('DTSTART:20261010T000000Z');
    expect(ics).toContain('DTEND:20261010T013000Z');
    expect(ics).toContain('SUMMARY:Taller\\, caja');
  });

  it('el tutor sin conexión encuentra el fragmento y el minuto en el guion', () => {
    const hits = localSearch(course('finanzas'), '¿Qué diferencia hay entre utilidad y flujo de caja?', 'es');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.lesson.id === 'finanzas-l3' && h.at === 192) || hits.some((h) => h.lesson.id === 'finanzas-l2')).toBe(true);
    expect(firstStamp('[03:12] La diferencia clave')).toBe(192);
  });

  it('genera preguntas de completar desde el texto, con la respuesta entre las opciones', () => {
    const texts = course('finanzas').modules.flatMap((m) => m.lessons.flatMap((l) => l.lines.map((x) => x.text.es)));
    const qs = generateQuestions(texts, 3);
    expect(qs).toHaveLength(3);
    for (const q of qs) {
      expect(q.q).toContain('_____');
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      expect(q.q.replace('_____', q.options[q.correct])).toContain(q.options[q.correct]);
    }
    expect(generateQuestions(texts, 3)).toEqual(qs);
    expect(generateQuestions(['Muy corto.'], 3)).toEqual([]);
  });
});

