/**
 * Motor de la demo de extracción: lo que la demo promete debe ser cálculo real.
 * - Dígito de verificación del NIT (DIAN, módulo 11).
 * - Próximas ejecuciones de una expresión cron.
 * - Selectores generados con un clic y extracción con querySelectorAll.
 * - Comparación de ejecuciones (el taladro baja 11 % en El Martillo).
 * - Filtro del radar, umbral de documentos y reglas de alerta.
 * - Limpieza del HTML que pega el visitante (sin scripts ni eventos).
 */
import { nextRuns, parseCron } from '../lib/cron';
import { DEFAULT_DOCS, DEFAULT_FIELDS, DEFAULT_NORMATIVA, DEFAULT_RADAR, DEFAULT_RULES, RECORD_SELECTOR, STORES, catalogToday, storeHtml } from '../lib/data';
import { evaluateRules, runContratacion, runDocumentos, runNormativa, runPrecios, type SourceConfigs } from '../lib/engine';
import { DEMO_NOW, parseNumber } from '../lib/format';
import { verificationDigit } from '../lib/nit';
import { buildSelector, extract, sanitizeHtml } from '../lib/selectors';

const cfg = (patch: Partial<SourceConfigs> = {}): SourceConfigs => ({
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
    const hits = evaluateRules(r, DEFAULT_RULES, { corrections: {} });
    expect(hits.find((h) => h.key === 'newProcessOver')?.params).toMatchObject({ count: 3, department: 'Antioquia' });
  });

  it('documentos: el DV equivocado y la confianza baja van a revisión; una corrección válida lo resuelve', () => {
    const r = runDocumentos(cfg(), DEMO_NOW, 'manual');
    const status = Object.fromEntries(r.rows.map((x) => [x.id, x.status]));
    expect(status).toMatchObject({ D1: 'validated', D3: 'reviewDv', D4: 'reviewConfidence' });
    expect(evaluateRules(r, DEFAULT_RULES, { corrections: {} }).filter((h) => h.ruleId === 'r6')).toHaveLength(2);
    expect(evaluateRules(r, DEFAULT_RULES, { corrections: { D3: 0 } }).filter((h) => h.ruleId === 'r6')).toHaveLength(1);
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
