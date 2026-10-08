/**
 * Lógica de la demo code-review-ia: lectura de diffs, reglas locales, código
 * con sugerencias aplicadas, puntaje y coherencia de los datos de ejemplo.
 */
import {
  parseInput, analyzeParsed, effectiveNewLines, oldLines, diffRows, countChanges, displayLineOf,
  scoreFor, riskFor, formatStamp, formatNumber, toCsv, MAX_INPUT_LINES,
} from '../components/analyzer';
import { SAMPLE_PRS, SAMPLE_DIFF } from '../components/data';

describe('parseInput', () => {
  it('lee un diff unificado con sus números de línea', () => {
    const r = parseInput(SAMPLE_DIFF);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.isDiff).toBe(true);
    expect(r.value.files).toHaveLength(1);
    const f = r.value.files[0];
    expect(f.path).toBe('src/clientes/notificar.ts');
    expect(f.newCode).toHaveLength(14);
    expect(f.oldCode).toHaveLength(5);
    expect(f.newNumbers?.[0]).toBe(1);
    expect(r.value.added[f.path].filter(Boolean)).toHaveLength(11);
  });

  it('trata el texto sin cabeceras de diff como un fragmento agregado', () => {
    const r = parseInput('const a = 1;\nconst b = 2;');
    if (!r.ok) throw new Error(r.error);
    expect(r.value.isDiff).toBe(false);
    expect(r.value.files[0].newCode).toEqual(['const a = 1;', 'const b = 2;']);
  });

  it('rechaza texto vacío, demasiadas líneas o un diff sin cambios', () => {
    expect(parseInput('   ')).toEqual({ ok: false, error: 'empty' });
    expect(parseInput(Array.from({ length: MAX_INPUT_LINES + 1 }, (_, i) => `l${i}`).join('\n'))).toEqual({ ok: false, error: 'tooManyLines' });
    expect(parseInput('--- a/x.ts\n+++ b/x.ts\n@@ -1,1 +1,1 @@\n a')).toEqual({ ok: false, error: 'noChanges' });
  });

  it('separa varios archivos de un mismo diff', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts', '--- a/a.ts', '+++ b/a.ts', '@@ -1,1 +1,2 @@', ' x', '+y',
      'diff --git a/b.py b/b.py', '--- a/b.py', '+++ b/b.py', '@@ -10,1 +10,1 @@', '-old', '+new',
    ].join('\n');
    const r = parseInput(diff);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.files.map((f) => f.path)).toEqual(['a.ts', 'b.py']);
    expect(r.value.files[1].newNumbers).toEqual([10]);
  });
});

describe('reglas locales', () => {
  it('encuentra los hallazgos esperados en el diff de ejemplo', () => {
    const r = parseInput(SAMPLE_DIFF);
    if (!r.ok) throw new Error(r.error);
    const ids = analyzeParsed(r.value).map((f) => f.rule.id).sort();
    expect(ids).toEqual([
      'dato-personal-en-log', 'http-sin-tls', 'igualdad-laxa', 'jwt-sin-algoritmo',
      'monto-con-decimales', 'secreto-en-codigo', 'tipo-any',
    ]);
  });

  it('propone correcciones automáticas solo cuando sabe hacerlas', () => {
    const r = parseInput("+++ b/x.ts\n@@ -0,0 +1,3 @@\n+jwt.verify(token, secret);\n+if (a == 'b') {}\n+https.request({ rejectUnauthorized: false });");
    if (!r.ok) throw new Error(r.error);
    const byRule = Object.fromEntries(analyzeParsed(r.value).map((f) => [f.rule.id, f.fix]));
    expect(byRule['jwt-sin-algoritmo']).toBe("jwt.verify(token, secret, { algorithms: ['HS256'] });");
    expect(byRule['igualdad-laxa']).toBe("if (a === 'b') {}");
    expect(byRule['tls-desactivado']).toBe('https.request({ rejectUnauthorized: true });');
  });

  it('solo revisa líneas agregadas', () => {
    const r = parseInput("+++ b/x.ts\n@@ -1,2 +1,1 @@\n-console.log(usuario.cedula);\n const ok = true;");
    if (!r.ok) throw new Error(r.error);
    expect(analyzeParsed(r.value)).toHaveLength(0);
  });
});

describe('código efectivo, diff y puntaje', () => {
  const pr = SAMPLE_PRS.find((p) => p.id === 'p218');
  if (!pr) throw new Error('falta p218');
  const file = pr.files[0];
  const c2 = pr.comments.find((c) => c.id === 'c218-2');
  if (!c2) throw new Error('falta c218-2');

  it('aplica una sugerencia de varias líneas sin perder los anclajes', () => {
    const lines = effectiveNewLines(file, [c2]);
    expect(lines).toHaveLength(file.newCode.length + 2);
    expect(displayLineOf(lines, 10)).toBe(10);
    expect(displayLineOf(lines, 12)).toBe(14);
    const { additions, deletions } = countChanges(diffRows(oldLines(file), lines));
    expect(additions).toBe(15);
    expect(deletions).toBe(0);
  });

  it('calcula puntaje y riesgo con los hallazgos pendientes', () => {
    expect(scoreFor(['blocking', 'blocking', 'warning', 'suggestion'])).toBe(59);
    expect(riskFor(['warning', 'info'])).toBe('medium');
    expect(riskFor([])).toBe('low');
    expect(scoreFor(Array(10).fill('blocking'))).toBe(0);
  });
});

describe('datos de ejemplo', () => {
  it('cada comentario apunta a un archivo y una línea que existen, sin sugerencias solapadas', () => {
    for (const pr of SAMPLE_PRS) {
      const ranges: Record<string, [number, number][]> = {};
      for (const c of pr.comments) {
        const f = pr.files.find((x) => x.path === c.file);
        expect(f).toBeDefined();
        expect(c.line).toBeGreaterThanOrEqual(1);
        expect(c.endLine ?? c.line).toBeLessThanOrEqual(f?.newCode.length ?? 0);
        if (c.fix !== undefined) {
          const list = (ranges[c.file] ??= []);
          for (const [a, b] of list) expect(c.line > b || (c.endLine ?? c.line) < a).toBe(true);
          list.push([c.line, c.endLine ?? c.line]);
        }
      }
      for (const d of pr.dependencies ?? []) {
        if (d.fixCommentId) expect(pr.comments.some((c) => c.id === d.fixCommentId)).toBe(true);
      }
    }
    const ids = SAMPLE_PRS.flatMap((p) => [...p.comments.map((c) => c.id), ...p.tests.map((x) => x.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las cifras que citan los comentarios son correctas', () => {
    // NIT de ejemplo 900.123.456: DV correcto 8; con los pesos al revés da 6.
    const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const dv = (nit: string, reverse: boolean) => {
      const d = nit.split('').map(Number);
      if (reverse) d.reverse();
      const r = d.reduce((acc, x, i) => acc + x * PESOS[i], 0) % 11;
      return r > 1 ? 11 - r : r;
    };
    expect(dv('900123456', true)).toBe(8);
    expect(dv('900123456', false)).toBe(6);
    // IVA: 19 % de 1.999 centavos = 379,81; las pruebas sugeridas esperan enteros.
    expect(Number((1999 * 0.19).toFixed(2))).toBe(379.81);
    expect(Math.round((199_900 * 19) / 100)).toBe(37_981);
    expect(Math.round((1_050 * 19) / 100)).toBe(200);
  });
});

describe('formato determinista', () => {
  it('formatea fechas y números sin depender de la zona horaria', () => {
    expect(formatStamp('2026-10-07T16:40', 'es')).toBe('7 oct 2026, 16:40');
    expect(formatStamp('2026-10-07T16:40', 'en')).toBe('Oct 7, 2026, 16:40');
    expect(formatNumber(1234567.89, 'es', 1)).toBe('1.234.567,9');
    expect(formatNumber(1234567.89, 'en', 1)).toBe('1,234,567.9');
  });

  it('escapa el CSV', () => {
    expect(toCsv([['a,b', 'c"d', 1]])).toBe('"a,b","c""d",1');
  });
});
