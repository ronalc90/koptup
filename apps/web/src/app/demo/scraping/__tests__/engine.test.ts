/**
 * Motor de la demo de extracción: lo que la demo promete debe ser cálculo real.
 * - Dígito de verificación del NIT (DIAN, módulo 11).
 * - Próximas ejecuciones de una expresión cron.
 * - Selectores generados con un clic y extracción con querySelectorAll.
 * - Comparación de ejecuciones (el taladro baja 11 % en El Martillo).
 * - Filtro del radar, umbral de documentos y reglas de alerta.
 * - Limpieza del HTML que pega el visitante (sin scripts ni eventos).
 * - Fechas de ejemplo corridas al día de hoy en Colombia y alertas sin repetir.
 */
import { nextRuns, parseCron } from '../lib/cron';
import {
  DEFAULT_DOCS, DEFAULT_FIELDS, DEFAULT_NORMATIVA, DEFAULT_RADAR, DEFAULT_RULES, NORMS_TODAY, PROCESSES_TODAY, RECORD_SELECTOR, STORES, catalogToday,
  normsFor, processesFor, storeHtml,
} from '../lib/data';
import { chartSeries, evaluateRules, runContratacion, runDocumentos, runNormativa, runPrecios, seedHistory, type SourceConfigs } from '../lib/engine';
import { BASE_CLOCK, clockAt, dayShift, parseNumber, shiftIso } from '../lib/format';
import { alignToDay, configsOf, defaultState, withScheduledRuns } from '../lib/store';
import { verificationDigit } from '../lib/nit';
import { buildSelector, extract, sanitizeHtml } from '../lib/selectors';

const DEMO_NOW = BASE_CLOCK.now;
const ctx = (corrections: Record<string, number> = {}, today = BASE_CLOCK.today) => ({ corrections, today });

const cfg = (patch: Partial<SourceConfigs> = {}): SourceConfigs => ({
  shift: 0,
  fields: DEFAULT_FIELDS,
  recordSelector: RECORD_SELECTOR,
  simulated: 0,
  radar: DEFAULT_RADAR,
  normativa: DEFAULT_NORMATIVA,
  docs: DEFAULT_DOCS,
  ...patch,
});

describe('NIT', () => {
  it('calcula el dígito de verificación de la DIAN', () => {
    expect(verificationDigit('901482736')).toBe(8);
    expect(verificationDigit('900315247')).toBe(1);
    expect(verificationDigit('901207583')).toBe(0);
  });
});

describe('cron', () => {
  it('valida y calcula las próximas ejecuciones desde el reloj de la demo', () => {
    expect(parseCron('99 * * * *')).toBeNull();
    expect(nextRuns('0 6 * * *', DEMO_NOW, 2)).toEqual(['2026-10-09T06:00', '2026-10-10T06:00']);
    // 8 oct. 2026 es jueves: de lunes a viernes a las 6:30 → vie. 9 y lun. 12
    expect(nextRuns('30 6 * * 1-5', DEMO_NOW, 2)).toEqual(['2026-10-09T06:30', '2026-10-12T06:30']);
  });
});

describe('números en formato colombiano', () => {
  it('lee precios y disponibilidad', () => {
    expect(parseNumber('$ 189.900')).toBe(189900);
    expect(parseNumber('3 disponibles')).toBe(3);
    expect(parseNumber('Agotado')).toBe(0);
    expect(parseNumber('1.234,5')).toBe(1234.5);
  });
});

describe('constructor por clic', () => {
  it('genera un selector dentro del registro y extrae todos los productos', () => {
    const root = document.createElement('div');
    root.innerHTML = storeHtml(STORES[1], catalogToday(0).b);
    document.body.appendChild(root);
    const envio = root.querySelector('.producto .envio')!;
    const { selector, scope } = buildSelector(envio, root, RECORD_SELECTOR);
    expect(scope).toBe('record');
    expect(root.querySelector(`.producto ${selector}`)).toBe(envio);
    const res = extract(root, RECORD_SELECTOR, [...DEFAULT_FIELDS, { id: 'e', name: 'Envío', selector, type: 'text', required: false, scope }]);
    expect(res.recordCount).toBe(5);
    expect(res.rows[0]).toMatchObject({ f1: 'Taladro percutor 1/2" 650 W', f2: 169900, f4: 3, e: 'Envío gratis' });
    root.remove();
  });
});

describe('ejecuciones', () => {
  it('precios: detecta la baja del taladro en El Martillo con los campos del usuario', () => {
    const r = runPrecios(cfg(), DEMO_NOW, 'manual');
    expect(r.rows).toHaveLength(16);
    const ch = r.changes.find((c) => c.key === 'b|Taladro percutor 1/2" 650 W');
    expect(ch?.kind).toBe('modified');
    expect(Math.round(Number(ch?.meta?.pricePct))).toBe(-11);
    // Sin el campo Precio ya no hay forma de detectar cambios de precio.
    const sinPrecio = runPrecios(cfg({ fields: DEFAULT_FIELDS.filter((f) => f.id !== 'f2') }), DEMO_NOW, 'manual');
    expect(sinPrecio.changes.some((c) => c.diffs.some((d) => d.field === 'f2'))).toBe(false);
  });

  it('precios: un cambio simulado en la tienda aparece en la siguiente ejecución', () => {
    const r = runPrecios(cfg({ simulated: 1 }), DEMO_NOW, 'manual');
    expect(r.changes.some((c) => c.key === 'a|Taladro percutor 1/2" 650 W')).toBe(true);
  });

  it('radar: filtra por palabra clave, departamento y cuantía', () => {
    const r = runContratacion(cfg(), DEMO_NOW, 'manual');
    expect(r.rows).toHaveLength(9);
    expect(r.changes.filter((c) => c.kind === 'added')).toHaveLength(4);
    const conValle = runContratacion(cfg({ radar: { ...DEFAULT_RADAR, departments: [...DEFAULT_RADAR.departments, 'Valle del Cauca'] } }), DEMO_NOW, 'manual');
    expect(conValle.rows).toHaveLength(11);
    const hits = evaluateRules(r, DEFAULT_RULES, ctx());
    expect(hits.find((h) => h.key === 'newProcessOver')?.params).toMatchObject({ count: 3, department: 'Antioquia' });
  });

  it('documentos: el DV equivocado y la confianza baja van a revisión; una corrección válida lo resuelve', () => {
    const r = runDocumentos(cfg(), DEMO_NOW, 'manual');
    const status = Object.fromEntries(r.rows.map((x) => [x.id, x.status]));
    expect(status).toMatchObject({ D1: 'validated', D3: 'reviewDv', D4: 'reviewConfidence' });
    expect(evaluateRules(r, DEFAULT_RULES, ctx()).filter((h) => h.ruleId === 'r6')).toHaveLength(2);
    expect(evaluateRules(r, DEFAULT_RULES, ctx({ D3: 0 })).filter((h) => h.ruleId === 'r6')).toHaveLength(1);
    expect(runDocumentos(cfg({ docs: { ...DEFAULT_DOCS, threshold: 60 } }), DEMO_NOW, 'manual').rows.find((x) => x.id === 'D4')?.status).toBe('validated');
  });

  it('normativa: sigue solo las entidades elegidas', () => {
    expect(runNormativa(cfg(), DEMO_NOW, 'manual').changes).toHaveLength(2);
    const una = runNormativa(cfg({ normativa: { entities: ['Ministerio Demo de Vivienda'], keyword: '' } }), DEMO_NOW, 'manual');
    expect(una.rows).toHaveLength(1);
    expect(una.changes).toHaveLength(0);
  });
});

describe('HTML del visitante', () => {
  it('quita scripts, eventos, enlaces javascript: y no descarga imágenes', () => {
    const { html } = sanitizeHtml('<img src="x" onerror="alert(1)"><script>alert(2)</script><a href="java\tscript:alert(3)">x</a><svg><g/></svg><p class="ok" onclick="x()">hola</p>');
    expect(html).not.toMatch(/script|onerror|onclick|svg/i);
    expect(html).toContain('data-src="x"');
    expect(html).toContain('<p class="ok">hola</p>');
  });
});

describe('fechas relativas a hoy (hora de Colombia)', () => {
  it('calcula hoy en Colombia sin depender de la zona del equipo', () => {
    // 14 oct. 2026, 15:30 UTC = 10:30 a. m. en Bogotá.
    expect(clockAt(new Date(Date.UTC(2026, 9, 14, 15, 30)))).toEqual({ now: '2026-10-14T10:30', today: '2026-10-14', day: '2026-10-14' });
    // 3:00 UTC del 15 = 10:00 p. m. del 14 en Bogotá.
    expect(clockAt(new Date(Date.UTC(2026, 9, 15, 3, 0))).today).toBe('2026-10-14');
    // Antes de las 6:20 a. m. la última ejecución programada es la de ayer.
    expect(clockAt(new Date(Date.UTC(2026, 9, 14, 10, 0)))).toMatchObject({ now: '2026-10-14T05:00', today: '2026-10-14', day: '2026-10-13' });
  });

  it('corre procesos y normas sin cambiar cuántos días faltan ni el año de las referencias', () => {
    const shift = dayShift('2027-01-05');
    const base = processesFor(PROCESSES_TODAY, 0);
    const moved = processesFor(PROCESSES_TODAY, shift);
    expect(base[0].ref).toBe('PROC-26-0371');
    // Cada proceso cierra los mismos días después de "hoy".
    moved.forEach((p, i) => expect(shiftIso(base[i].closes, shift)).toBe(p.closes));
    // Los publicados "hoy" ya llevan el año nuevo en la referencia.
    expect(moved.find((p) => p.ref.endsWith('-0446'))?.ref).toBe('PROC-27-0446');
    const n6 = normsFor(NORMS_TODAY, shift).find((d) => d.id === 'N6')!;
    expect(n6.number).toBe('Resolución 2031 de 2027');
    expect(n6.url).toBe('https://normas-demo.example/resolucion-2031-2027.pdf');
  });

  it('el radar da el mismo resultado cualquier día y "cierra en N días" se cuenta desde hoy', () => {
    const today = '2027-03-02';
    const r = runContratacion(cfg({ shift: dayShift(today) }), `${today}T06:00`, 'scheduled');
    expect(r.rows).toHaveLength(9);
    expect(r.changes.filter((c) => c.kind === 'added')).toHaveLength(4);
    const closing = evaluateRules(r, DEFAULT_RULES, ctx({}, today)).filter((h) => h.key === 'closingSoon');
    expect(closing.map((h) => h.params.days).sort()).toEqual([1, 5]);
    expect(seedHistory(today)[0].at.slice(0, 10)).toBe('2027-02-24');
    expect(chartSeries('precios', 16, today).at(-1)).toMatchObject({ date: today, value: 16, today: true });
  });

  it('lo guardado otro día conserva la configuración y vuelve a armar las ejecuciones', () => {
    const old = withScheduledRuns({ ...defaultState('2026-10-08'), radar: { ...DEFAULT_RADAR, minAmount: 50_000_000 } });
    expect(old.results.contratacion?.at).toBe('2026-10-08T06:00');
    const { state, moved } = alignToDay(old, '2026-10-14');
    expect(moved).toBe(true);
    expect(state.results).toEqual({});
    expect(state.radar.minAmount).toBe(50_000_000);
    const fresh = withScheduledRuns(state);
    expect(fresh.results.contratacion?.at).toBe('2026-10-14T06:00');
    expect(configsOf(fresh).shift).toBe(6);
    expect(alignToDay(fresh, '2026-10-14').moved).toBe(false);
  });
});

describe('alertas sin repetir', () => {
  it('una alerta creada para un producto que ya cumple la regla general sale una sola vez', () => {
    const r = runPrecios(cfg(), DEMO_NOW, 'manual');
    const key = 'b|Taladro percutor 1/2" 650 W';
    const general = evaluateRules(r, DEFAULT_RULES, ctx()).filter((h) => h.key === 'priceDrop');
    const withTarget = evaluateRules(r, [...DEFAULT_RULES, { id: 'r9', sourceId: 'precios', type: 'priceDrop', value: 1, enabled: true, targetKey: key }], ctx()).filter((h) => h.key === 'priceDrop');
    expect(withTarget).toHaveLength(general.length);
    expect(withTarget.filter((h) => h.params.store === 'Herramientas El Martillo Demo' && String(h.params.product).startsWith('Taladro'))).toHaveLength(1);
  });
});
