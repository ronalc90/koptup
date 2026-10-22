/**
 * Motor de la demo de automatización: plantillas, lectura de facturas,
 * condiciones, reintentos, casos para revisar, reanudación y datos de ejemplo.
 */
import es from '../../../../../messages/demos/automatizacion.es.json';
import en from '../../../../../messages/demos/automatizacion.en.json';
import { TYPE_DEFS } from '../lib/catalog';
import { classify, executeRun, parseNum, readInvoice, render, setPath, type JsRunner, type RunCtx } from '../lib/engine';
import { addMinutes, fmtCop, fmtNit, nextMonthStart, nitDv } from '../lib/format';
import { computeLayout, dropIndex, edgePath } from '../lib/canvas-layout';
import { COMPANY_NIT, SUPPLIERS, buildSamples, buildSheets, invoiceXml, templateSteps, type SeedText } from '../lib/samples';
import { buildSeed, isValidState } from '../lib/seed';
import { monthUsage } from '../lib/store';
import type { Counters, Loc, Step, TemplateKey } from '../lib/types';

const TEXT: Record<Loc, SeedText> = {
  es: es.demoAutomation.seed as unknown as SeedText,
  en: en.demoAutomation.seed as unknown as SeedText,
};
const NOW = '2026-10-10T10:30:00';

/** En Jest no hay Worker: el código se corre con Function (mismo contrato). */
const runJs: JsRunner = async (code, data) => {
  try {
    // eslint-disable-next-line no-new-func
    const value = new Function('datos', code)(data);
    return { ok: true, value: JSON.parse(JSON.stringify(value ?? null)) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

function ctx(loc: Loc = 'es', seq = 100): RunCtx {
  const counters: Counters = { run: seq, review: 0, wf: 3, cxp: 411, crm: 0, pay: 0 };
  return { loc, now: NOW, seq, counters, sheets: buildSheets(TEXT[loc]), kb: TEXT[loc].kb, runJs };
}

function flow(key: TemplateKey, loc: Loc = 'es'): Step[] {
  return templateSteps(key, TEXT[loc]);
}

function sample(id: string, loc: Loc = 'es') {
  const s = buildSamples(NOW, TEXT[loc]).find((x) => x.id === id);
  if (!s) throw new Error(`sin ejemplo ${id}`);
  return s;
}

describe('formatos y datos de ejemplo', () => {
  it('calcula el dígito de verificación del NIT como la DIAN', () => {
    expect(nitDv('800197268')).toBe(4);
    expect(fmtNit(COMPANY_NIT)).toMatch(/^901\.345\.678-\d$/);
  });

  it('formatea pesos y lee números con o sin separadores', () => {
    expect(fmtCop(4284000, 'es')).toBe('$ 4.284.000');
    expect(fmtCop(4284000, 'en')).toBe('$ 4,284,000');
    expect(parseNum('4.284.000')).toBe(4284000);
    expect(parseNum('4,284,000')).toBe(4284000);
    expect(parseNum('0,5')).toBe(0.5);
    expect(parseNum('abc')).toBeNull();
  });

  it('llena plantillas y reporta los campos que faltan', () => {
    const r = render('Factura {{f.n}} por {{f.total|cop}} a {{x.y}}', { f: { n: 'FE-1', total: 1500000 } }, 'es');
    expect(r.text).toBe('Factura FE-1 por $ 1.500.000 a ');
    expect(r.missing).toEqual(['x.y']);
    expect(setPath({ a: { b: 1 } }, 'a.c', 2)).toEqual({ a: { b: 1, c: 2 } });
  });

  it('el mes se reinicia el día 1 del mes siguiente', () => {
    expect(nextMonthStart(NOW)).toEqual({ day: '2026-11-01', daysLeft: 22 });
    expect(nextMonthStart('2026-12-31T20:00:00').day).toBe('2027-01-01');
  });

  it('las facturas de ejemplo suman bien y los NIT tienen dígito válido', () => {
    for (const id of ['invOk', 'invMismatch', 'invRetry']) {
      const xml = String((sample(id).payload.documento as { contenido: string }).contenido);
      const res = readInvoice(xml);
      expect(res.missing).toEqual([]);
      expect(res.issues).toEqual([]);
      expect(res.confidence).toBe(97);
      expect((res.fields.subtotal ?? 0) + (res.fields.iva ?? 0)).toBe(res.fields.total);
    }
  });

  it('la lectura baja la confianza si faltan campos o el NIT no cuadra', () => {
    const partial = readInvoice(String((sample('invPartial').payload.documento as { contenido: string }).contenido));
    expect(partial.missing.sort()).toEqual(['fecha', 'iva']);
    expect(partial.confidence).toBe(67);
    const bad = invoiceXml({ number: 'X-1', date: '2026-10-09', supplier: SUPPLIERS.sabana, subtotal: 100, iva: 19, total: 119 }).replace(
      `schemeID="${nitDv(SUPPLIERS.sabana.nit)}">${SUPPLIERS.sabana.nit}`,
      `schemeID="${(nitDv(SUPPLIERS.sabana.nit) + 1) % 10}">${SUPPLIERS.sabana.nit}`,
    );
    expect(readInvoice(bad).issues).toContain('dv');
  });

  it('clasifica por palabras clave y detecta la ciudad', () => {
    const rules = TEXT.es.templates.leads.config.classify.rules;
    expect(classify('Quiero cotizar 40 cajas, precio por volumen. Medellín', rules)).toMatchObject({ categoria: 'compra', ciudad: 'Medellín' });
    expect(classify('El pedido llegó incompleto y roto, pongo una queja', rules).categoria).toBe('queja');
    expect(classify('Hola', rules).categoria).toBe('otro');
  });
});

describe('ejecución de flujos', () => {
  it('factura que cuadra: seis pasos exitosos y duración = suma de los pasos', async () => {
    const out = await executeRun({ steps: flow('invoices'), sample: sample('invOk'), ctx: ctx() });
    expect(out.status).toBe('success');
    expect(out.steps).toHaveLength(6);
    expect(out.durationMs).toBe(out.steps.reduce((a, s) => a + s.durationMs + (s.waitMs ?? 0), 0));
    expect(out.data.registro).toMatchObject({ numero: 'CxP-2026-00412', valor: 2618000 });
    expect(String((out.data.aviso as { texto: string }).texto)).toContain('$ 2.618.000');
  });

  it('factura que no cuadra: queda en revisión en la condición y se puede aprobar', async () => {
    const steps = flow('invoices');
    const out = await executeRun({ steps, sample: sample('invMismatch'), ctx: ctx() });
    expect(out.status).toBe('review');
    expect(out.review).toMatchObject({ kind: 'exception', stepId: steps[3].id, resumeFrom: steps[4].id });
    expect(out.steps[3].msg).toMatchObject({ key: 'log.condFalseApprox', params: { diff: '7,1' } });
    const resumed = await executeRun({ steps, sample: sample('invMismatch'), ctx: ctx('es', 101), startIndex: 4, data: out.review!.data, resume: true });
    expect(resumed.status).toBe('success');
    expect(resumed.steps.map((s) => s.stepId)).toEqual([steps[4].id, steps[5].id]);
  });

  it('subir la tolerancia de la condición deja pasar la factura', async () => {
    const steps = flow('invoices');
    steps[3] = { ...steps[3], config: { ...steps[3].config, tolerance: 10 } };
    const out = await executeRun({ steps, sample: sample('invMismatch'), ctx: ctx() });
    expect(out.status).toBe('success');
  });

  it('error temporal: reintenta con espera y termina exitosa con reintento', async () => {
    const out = await executeRun({ steps: flow('invoices'), sample: sample('invRetry'), ctx: ctx() });
    expect(out.status).toBe('retried');
    const retry = out.steps.find((s) => s.status === 'retry');
    expect(retry).toMatchObject({ type: 'app.accounting', attempt: 1, waitMs: 2000 });
    expect(out.steps.filter((s) => s.type === 'app.accounting').map((s) => s.attempt)).toEqual([1, 2]);
  });

  it('sin reintentos, el mismo error deja la ejecución fallida y en revisión', async () => {
    const steps = flow('invoices');
    steps[4] = { ...steps[4], retry: { ...steps[4].retry, attempts: 0 } };
    const out = await executeRun({ steps, sample: sample('invRetry'), ctx: ctx() });
    expect(out.status).toBe('failed');
    expect(out.review).toMatchObject({ kind: 'failure', stepId: steps[4].id, reason: { key: 'err.retriesExhausted' } });
  });

  it('XML incompleto: la confianza queda bajo el umbral y va a revisión', async () => {
    const out = await executeRun({ steps: flow('invoices'), sample: sample('invPartial'), ctx: ctx() });
    expect(out.status).toBe('review');
    expect(out.steps[1].msg).toMatchObject({ key: 'log.extractLow', params: { conf: 67, threshold: 80, count: 2 } });
  });

  it('sin credencial el conector falla', async () => {
    const steps = flow('invoices');
    steps[2] = { ...steps[2], credential: '' };
    const out = await executeRun({ steps, sample: sample('invOk'), ctx: ctx() });
    expect(out.status).toBe('failed');
    expect(out.steps[2].msg.key).toBe('err.noCredential');
  });

  it('cobranza: vencida hace poco termina sin acción; sin celular falla y se corrige el dato', async () => {
    const steps = flow('collections');
    const recent = await executeRun({ steps, sample: sample('colRecent'), ctx: ctx() });
    expect(recent.status).toBe('stopped');
    const noPhone = await executeRun({ steps, sample: sample('colNoPhone'), ctx: ctx() });
    expect(noPhone.status).toBe('failed');
    expect(noPhone.review).toMatchObject({ missingPath: 'cartera.celular', stepId: steps[5].id });
    const again = await executeRun({ steps, sample: sample('colNoPhone'), ctx: ctx(), startIndex: 5, data: noPhone.review!.data, resume: true });
    expect(again.status).toBe('failed');
    const fixed = await executeRun({ steps, sample: sample('colNoPhone'), ctx: ctx(), startIndex: 5, data: setPath(noPhone.review!.data, 'cartera.celular', '3005550199'), resume: true });
    expect(fixed.status).toBe('success');
    const bad = await executeRun({ steps, sample: sample('colNoPhone'), ctx: ctx(), startIndex: 5, data: setPath(noPhone.review!.data, 'cartera.celular', '12345'), resume: true });
    expect(bad.steps[0].msg.key).toBe('err.badPhone');
  });

  it('cobranza: el recordatorio lleva saldo, días y enlace de pago', async () => {
    const out = await executeRun({ steps: flow('collections'), sample: sample('colOk'), ctx: ctx() });
    expect(out.status).toBe('success');
    const texto = String((out.data.borrador as { texto: string }).texto);
    expect(texto).toContain('$ 3.450.000');
    expect(texto).toContain('12 días');
    expect(texto).toMatch(/https:\/\/pagos\.example\/l\/[0-9A-Z]{6}/);
  });

  it.each<Loc>(['es', 'en'])('leads: asigna por ciudad y manda las quejas a revisión (%s)', async (loc) => {
    const steps = flow('leads', loc);
    const mde = await executeRun({ steps, sample: sample('leadMde', loc), ctx: ctx(loc) });
    expect(mde.status).toBe('success');
    expect(mde.data.asignacion).toMatchObject({ responsable: 'Valentina Ríos' });
    const complaint = await executeRun({ steps, sample: sample('leadComplaint', loc), ctx: ctx(loc) });
    expect(complaint.status).toBe('review');
    expect(complaint.review?.stepId).toBe(steps[2].id);
  });

  it.each<Loc>(['es', 'en'])('asistente: cita la fuente o pasa a una persona (%s)', async (loc) => {
    const steps = flow('assistant', loc);
    const ok = await executeRun({ steps, sample: sample('chatShipping', loc), ctx: ctx(loc) });
    expect(ok.status).toBe('success');
    expect(String((ok.data.aviso as { texto: string }).texto)).toContain(TEXT[loc].kb[0].source);
    const unknown = await executeRun({ steps, sample: sample('chatUnknown', loc), ctx: ctx(loc) });
    expect(unknown.status).toBe('review');
  });

  it('el paso de código recibe los datos y su resultado pasa al siguiente', async () => {
    const steps = flow('invoices').slice(0, 2);
    steps.push({ id: 's9', type: 'code.js', name: 'JS', config: { code: 'return { doble: datos.factura.total * 2 };', saveAs: 'calculo' }, retry: TYPE_DEFS['code.js'].retry, credential: '' });
    const out = await executeRun({ steps, sample: sample('invOk'), ctx: ctx() });
    expect(out.status).toBe('success');
    expect(out.data.calculo).toEqual({ doble: 5236000 });
    steps[2] = { ...steps[2], config: { code: 'throw new Error("ups")', saveAs: 'calculo' } };
    const bad = await executeRun({ steps, sample: sample('invOk'), ctx: ctx() });
    expect(bad.status).toBe('failed');
    expect(bad.steps[2].msg).toMatchObject({ key: 'err.js', params: { error: 'ups' } });
  });
});

describe('estado inicial y lienzo', () => {
  it('las ejecuciones de ejemplo son coherentes con la hora actual', async () => {
    const seed = await buildSeed(NOW, TEXT.es, 'es', runJs);
    expect(isValidState(seed)).toBe(true);
    expect(seed.runs).toHaveLength(8);
    for (const r of seed.runs) {
      expect(r.startedAt <= NOW).toBe(true);
      expect(r.durationMs).toBe(r.steps.reduce((a, s) => a + s.durationMs + (s.waitMs ?? 0), 0));
    }
    const sorted = [...seed.runs].sort((a, b) => b.seq - a.seq);
    expect(seed.runs.map((r) => r.id)).toEqual(sorted.map((r) => r.id));
    expect(seed.reviews.filter((r) => r.status === 'open')).toHaveLength(3);
    expect(seed.workflows[0].versions.map((v) => v.steps.length)).toEqual([3, 5, 6]);
    for (const w of seed.workflows) for (const v of w.versions) expect(v.at < NOW).toBe(true);
  });

  it('antes de las 8:15 la revisión de cartera de ejemplo es la de ayer', async () => {
    const early = '2026-10-10T07:00:00';
    const seed = await buildSeed(early, TEXT.es, 'es', runJs);
    const col = seed.runs.filter((r) => r.workflowId === 'wf-2');
    expect(col.every((r) => r.startedAt.startsWith('2026-10-09T08:00'))).toBe(true);
    expect(seed.runs.every((r) => r.startedAt <= early)).toBe(true);
  });

  it('uso del mes: ritmo de ejemplo más lo ejecutado; el ahorro sale de los minutos', async () => {
    const seed = await buildSeed(NOW, TEXT.es, 'es', runJs);
    const u = monthUsage(seed, NOW);
    expect(u.runs).toBe(Math.round(18 * 9) + Math.round(34 * 9) + Math.round(9 * 9) + seed.runs.length);
    expect(u.hours).toBeCloseTo(u.rows.reduce((a, r) => a + (r.ok * r.wf.minutesPerRun) / 60, 0));
    // En noviembre el conteo vuelve a empezar: las ejecuciones de octubre ya no cuentan.
    expect(monthUsage(seed, addMinutes(NOW, 60 * 24 * 30)).runs).toBe((18 + 34 + 9) * 8);
  });

  it('distribución en serpiente: la segunda fila va al revés y las flechas siguen el orden', () => {
    const l = computeLayout(6, 880);
    expect(l.cols).toBe(3);
    expect(l.positions.map((p) => p.col)).toEqual([0, 1, 2, 2, 1, 0]);
    expect(edgePath(l.positions[3], l.positions[4], l.nodeW)).toMatch(/^M (\d+) \d+ L (\d+)/);
    const [x1, x2] = edgePath(l.positions[3], l.positions[4], l.nodeW).match(/\d+(\.\d+)?/g)!.map(Number).filter((_, i) => i === 0 || i === 2);
    expect(x2).toBeLessThan(x1);
    const mobile = computeLayout(6, 366);
    expect(mobile.cols).toBe(1);
    expect(mobile.nodeW).toBeGreaterThan(184);
    expect(dropIndex(l, 0, 0)).toBe(1);
    const last = l.positions[5];
    expect(dropIndex(l, last.x - 20, last.y + 30)).toBe(6);
  });
});
