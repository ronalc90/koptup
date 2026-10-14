/**
 * Reglas de la demo LMS: precios y cupones, ruta adaptativa, certificados,
 * logros, verificación por enlace, calendario y búsqueda local del tutor.
 */
import { COURSES } from '../lib/catalog';
import {
  achievements,
  certificatesFromStored,
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
  registryLookup,
  riskOf,
  stem,
  streakDays,
  toCsv,
  totals,
} from '../lib/engine';
import { addDays } from '../lib/dates';
import { buildCohort, buildState, studentName } from '../lib/seed';
import { courseDocs } from '../lib/tutor';
import { activeCertificates, salesList, headerStats } from '../lib/selectors';
import { reducer, type Action, type Payload } from '../lib/store';
import type { LmsState } from '../lib/types';

const act = (s: LmsState, a: Payload) => reducer(s, { ...a, today: TODAY } as Action) as LmsState;

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

  it('no propone opciones que solo cambian en plural o tildes', () => {
    expect(stem('Entradas')).toBe(stem('entrada'));
    expect(stem('clientes')).toBe(stem('cliente'));
    expect(stem('ciudades')).toBe(stem('ciudad'));
    const texts = [
      'Cada entrada de inventario se registra con fecha, cantidad y costo unitario del producto recibido.',
      'Las entradas y las salidas de mercancía se concilian cada semana contra el conteo físico de la bodega.',
      'El margen de contribución muestra cuánto aporta cada producto después de cubrir su costo variable directo.',
      'Los proveedores entregan facturas electrónicas que la contabilidad revisa antes de programar los pagos.',
      'Un presupuesto mensual compara lo planeado con lo ejecutado y explica las diferencias más importantes.',
    ];
    const qs = generateQuestions(texts, 5);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(new Set(q.options.map(stem)).size).toBe(q.options.length);
    // Cada pregunta recuerda de qué texto (lección) salió.
    for (const q of qs) expect(texts[q.source]).toContain(q.options[q.correct]);
  });

  it('cambiar el nombre no reescribe certificados ya emitidos; reemitir anula el anterior', () => {
    let s = buildState(TODAY);
    const original = s.certificates[0];
    s = act(s, { type: 'profile.update', profile: { ...s.profile, name: 'Laura Martínez' } });
    expect(s.certificates[0].name).toBe('Valentina Ríos');
    s = act(s, { type: 'cert.reissue', id: original.id });
    const vigentes = activeCertificates(s);
    expect(vigentes).toHaveLength(1);
    expect(vigentes[0].name).toBe('Laura Martínez');
    expect(vigentes[0].replaces).toBe(original.id);
    expect(vigentes[0].id).toBe(`AQ-2026-${String(s.seq).padStart(4, '0')}`);
    expect(s.certificates.find((c) => c.id === original.id)?.replacedBy).toBe(vigentes[0].id);
    expect(s.enrollments.datos.certificateId).toBe(vigentes[0].id);
    // Reemitir otra vez con el mismo nombre no hace nada; los logros cuentan un solo certificado.
    expect(act(s, { type: 'cert.reissue', id: vigentes[0].id })).toBe(s);
    expect(achievements(s, TODAY).xp).toBe(7 * 50 + 100 + 50 + 200);
  });

  it('el registro del navegador confirma, anula o no encuentra un certificado', () => {
    const s = buildState(TODAY);
    const c = s.certificates[0];
    const p = { c: c.id, n: c.name, t: 'Protección de datos personales (Ley 1581)', h: c.hours, f: c.date, o: 'Academia Quindé S.A.S.' };
    const stored = JSON.stringify(s);
    expect(registryLookup(certificatesFromStored(stored), p)).toEqual({ status: 'found' });
    expect(registryLookup(certificatesFromStored(null), p)).toEqual({ status: 'none' });
    expect(registryLookup(certificatesFromStored('{roto'), p)).toEqual({ status: 'none' });
    expect(registryLookup(certificatesFromStored(stored), { ...p, c: 'AQ-2026-9999' })).toEqual({ status: 'notFound' });
    expect(registryLookup(certificatesFromStored(stored), { ...p, n: 'Otra Persona' })).toEqual({ status: 'mismatch' });
    const renamed = act(act(s, { type: 'profile.update', profile: { ...s.profile, name: 'Laura Martínez' } }), { type: 'cert.reissue', id: c.id });
    const by = activeCertificates(renamed)[0].id;
    expect(registryLookup(certificatesFromStored(JSON.stringify(renamed)), p)).toEqual({ status: 'replaced', by });
    // Mismo código, pero de otro certificado (otro navegador numera igual): nunca se informa como «anulado».
    expect(registryLookup(certificatesFromStored(JSON.stringify(renamed)), { ...p, n: 'Otra Persona' })).toEqual({ status: 'mismatch' });
  });

  it('el registro guardado vence con la misma regla de 7 días que la demo', () => {
    const s = buildState(TODAY);
    const stored = JSON.stringify(s);
    expect(certificatesFromStored(stored, TODAY)).toHaveLength(1);
    expect(certificatesFromStored(stored, addDays(TODAY, 7))).toHaveLength(1);
    expect(certificatesFromStored(stored, addDays(TODAY, 8))).toBeNull();
    expect(certificatesFromStored(stored, addDays(TODAY, -1))).toBeNull();
  });

  it('los estudiantes de ejemplo tienen nombres únicos y apellidos variados', () => {
    const names = Array.from({ length: 320 }, (_, i) => studentName(i));
    expect(new Set(names).size).toBe(names.length);
    const cohort = buildState(TODAY).cohort;
    const lastNames = new Map<string, number>();
    const seen = new Set<string>();
    for (const r of cohort) {
      if (seen.has(r.studentId)) continue;
      seen.add(r.studentId);
      const last = r.name.split(' ').pop() as string;
      lastNames.set(last, (lastNames.get(last) ?? 0) + 1);
    }
    expect(lastNames.size).toBeGreaterThanOrEqual(25);
    expect(Math.max(...lastNames.values()) / seen.size).toBeLessThan(0.08);
  });

  it('marca las vistas de rol visitadas (primeros pasos)', () => {
    const s = act(buildState(TODAY), { type: 'role.visit', role: 'admin' });
    expect(s.visited).toEqual({ admin: true });
    expect(act(s, { type: 'role.visit', role: 'admin' })).toBe(s);
  });
});
