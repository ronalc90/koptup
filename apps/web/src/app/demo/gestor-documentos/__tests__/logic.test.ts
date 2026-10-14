/**
 * Lógica de la demo gestor-documentos: NIT, fechas, datos de ejemplo,
 * búsqueda, cláusulas, versiones, retención, vistas y CSV.
 */
import { detectClauses, hasClauses } from '../lib/clauses';
import { addYears, fillDates, fmtDate, isoToBogota } from '../lib/dates';
import { diffWords, summarize } from '../lib/diff';
import { buildSampleDocs, invoiceTotals, sampleCufe, SAMPLE_RETENTION } from '../lib/sample';
import { queryTerms, rank, snippet } from '../lib/search';
import { toApiError } from '../lib/serverApi';
import { checkUpload, formatNit, isValidNit, keepUntil, nitCheckDigit, toCsv } from '../lib/util';
import { expandedSearch, indexDocs, selectDocs } from '../lib/view';
import type { Filters } from '../lib/types';

const NOW = '2026-10-10T09:00:00';
const NO_FILTERS: Filters = { type: 'all', date: 'all', tag: '' };
const docs = buildSampleDocs(NOW, 'es');
const byId = (id: string) => docs.find((d) => d.id === id)!;

describe('NIT', () => {
  it('calcula el dígito de verificación de la DIAN', () => {
    expect(nitCheckDigit('901482376')).toBe(1);
    expect(nitCheckDigit('900735218')).toBe(8);
    expect(nitCheckDigit('830514927')).toBe(1);
    expect(formatNit('901482376')).toBe('901.482.376-1');
    expect(isValidNit('901.482.376-1')).toBe(true);
    expect(isValidNit('901.482.376-2')).toBe(false);
  });

  it('todos los NIT que aparecen en los textos de ejemplo son válidos', () => {
    const all = docs.flatMap((d) => [d.text || '', ...(d.versions || []).map((v) => v.text)]).join('\n');
    const nits = Array.from(all.matchAll(/NIT (\d{3}\.\d{3}\.\d{3}-\d)/g)).map((m) => m[1]);
    expect(nits.length).toBeGreaterThan(10);
    for (const nit of nits) expect(isValidNit(nit)).toBe(true);
  });
});

describe('fechas', () => {
  it('rellena fechas relativas a hoy en hora de Colombia', () => {
    expect(fillDates('Firmado el {{d:-9}} ({{ds:-9}}); presupuesto {{y:1}}', NOW)).toBe('Firmado el 1 de octubre de 2026 (2026-10-01); presupuesto 2027');
    expect(isoToBogota('2026-10-10T03:00:00.000Z')).toBe('2026-10-09T22:00:00');
    expect(fmtDate('2026-02-16T10:00:00', 'es')).toBe('16 feb. 2026');
    expect(fmtDate('2026-02-16T10:00:00', 'en')).toBe('Feb 16, 2026');
    expect(addYears('2024-02-29T00:00:00', 1)).toBe('2025-02-28T00:00:00');
  });
});

describe('datos de ejemplo', () => {
  it('arma 16 documentos con uno en la papelera y fechas pasadas coherentes', () => {
    expect(docs).toHaveLength(16);
    expect(docs.filter((d) => d.deleted)).toHaveLength(1);
    for (const d of docs) {
      expect(d.createdAt <= NOW).toBe(true);
      expect(d.summary).toBeTruthy();
      expect(d.text).toBeTruthy();
      expect(d.text).not.toMatch(/\{\{/);
      expect(d.name).not.toMatch(/\{\{/);
    }
    expect(byId('s-junta').name).toContain('2027');
  });

  it('las facturas escaneadas cuadran: líneas, IVA 19 % y total', () => {
    for (const d of docs.filter((x) => x.ocr)) {
      const totals = invoiceTotals(d.ocr!.lines);
      const total = d.ocr!.fields.find((f) => f.key === 'total')!.value;
      expect(Number(total.replace(/\D/g, ''))).toBe(totals.total);
      expect(totals.iva).toBe(Math.round(totals.subtotal * 0.19));
      expect(isValidNit(d.ocr!.fields.find((f) => f.key === 'nit')!.value)).toBe(true);
    }
    expect(sampleCufe('CV-4417')).toMatch(/^[0-9a-f]{96}$/);
  });

  it('aplica los cambios guardados del visitante', () => {
    const changed = buildSampleDocs(NOW, 'en', {
      's-obra': { name: 'Renombrado.pdf', favorite: false, folder: 'Mi carpeta' },
      's-andamios': { deletedAt: null },
      's-notas': { removed: true },
    });
    expect(changed).toHaveLength(15);
    const obra = changed.find((d) => d.id === 's-obra')!;
    expect(obra).toMatchObject({ name: 'Renombrado.pdf', favorite: false, folder: 'Mi carpeta' });
    expect(obra.summary).toMatch(/^Civil works contract/);
    expect(changed.find((d) => d.id === 's-andamios')!.deleted).toBe(false);
  });
});

describe('búsqueda', () => {
  it('encuentra por texto con plural y sin tildes, y devuelve el fragmento', () => {
    const ranked = rank(indexDocs(docs), queryTerms('clausulas penales', false));
    const ids = ranked.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['s-obra', 's-suministro']));
    const s = snippet(byId('s-obra').text!, ['clausula', 'penal']);
    const marked = s!.parts.filter((x) => x.hit).map((x) => x.text.toLowerCase());
    expect(marked).toEqual(expect.arrayContaining(['penal', 'cláusula']));
  });

  it('la búsqueda ampliada pone primero los contratos que se renuevan solos', () => {
    const hits = expandedSearch(docs, 'contratos que se renuevan solos');
    expect(hits.slice(0, 2).map((h) => h.doc.id).sort()).toEqual(['s-arriendo', 's-suministro']);
    expect(hits[0].related.length).toBeGreaterThan(0);
  });
});

describe('cláusulas', () => {
  it('clasifica el riesgo del contrato de obra (penal 20 % alto, multas 10 % medio)', () => {
    const c = detectClauses(byId('s-obra').text!);
    expect(c.find((x) => x.heading.includes('PENAL'))).toMatchObject({ type: 'penalty', risk: 'high', percent: 20 });
    expect(c.find((x) => x.heading.includes('MULTAS'))).toMatchObject({ type: 'penalty', risk: 'medium', percent: 10 });
    expect(c.filter((x) => x.risk === 'high')).toHaveLength(1);
  });

  it('detecta prórroga automática, pago a 60 días e indemnidad sin límite', () => {
    const s = detectClauses(byId('s-suministro').text!);
    expect(s.find((x) => x.type === 'renewal')?.risk).toBe('medium');
    expect(s.find((x) => x.reason === 'paymentLong')).toBeTruthy();
    expect(detectClauses(byId('s-nda').text!).find((x) => x.type === 'indemnity')?.risk).toBe('high');
    expect(detectClauses(byId('s-arriendo').text!).find((x) => x.type === 'termination')?.reason).toBe('terminationCost');
    expect(hasClauses(byId('s-poliza').text)).toBe(false);
  });
});

describe('versiones', () => {
  it('compara v1 y v2 del contrato palabra por palabra', () => {
    const [v1, v2] = byId('s-obra').versions!;
    const parts = diffWords(v1.text, v2.text);
    expect(parts.filter((p) => p.op === 'del').map((p) => p.text).join(' ')).toMatch(/12/);
    expect(parts.filter((p) => p.op === 'add').map((p) => p.text).join(' ')).toMatch(/14/);
    const s = summarize(parts);
    expect(s.changes + s.additions + s.deletions).toBeGreaterThan(3);
    // Reconstrucción: las partes iguales y agregadas forman la versión nueva.
    expect(parts.filter((p) => p.op !== 'del').map((p) => p.text).join('').replace(/\s+/g, ' ').trim()).toBe(v2.text.replace(/\s+/g, ' ').trim());
    expect(parts.filter((p) => p.op !== 'add').map((p) => (p.op === 'equal' ? p.before : p.text)).join('')).toBe(v1.text);
  });
});

describe('retención y vistas', () => {
  it('calcula hasta cuándo se conserva', () => {
    expect(keepUntil('2026-02-16T10:00:00', 'y10')).toBe('2036-02-16');
    expect(keepUntil('2026-02-16T10:00:00', 'perm')).toBe('perm');
    expect(keepUntil('2026-02-16T10:00:00', 'none')).toBeNull();
    expect(SAMPLE_RETENTION['@contracts'].policy).toBe('y10');
  });

  it('filtra por vista, tipo, fecha y búsqueda', () => {
    const opts = { view: 'all' as const, folder: '', query: '', filters: NO_FILTERS, sort: 'newest' as const, now: NOW };
    expect(selectDocs(docs, opts)).toHaveLength(15);
    expect(selectDocs(docs, { ...opts, view: 'trash' })).toHaveLength(1);
    expect(selectDocs(docs, { ...opts, view: 'favorites' })).toHaveLength(2);
    expect(selectDocs(docs, { ...opts, view: 'recent' })).toHaveLength(10);
    expect(selectDocs(docs, { ...opts, view: 'folder', folder: '@invoices' })).toHaveLength(3);
    expect(selectDocs(docs, { ...opts, filters: { ...NO_FILTERS, type: 'pdf' } })).toHaveLength(8);
    expect(selectDocs(docs, { ...opts, filters: { ...NO_FILTERS, type: 'pdf', date: 'd30' } })).toHaveLength(3);
    const newest = selectDocs(docs, opts)[0].doc;
    expect(newest.id).toBe('s-notas');
    const found = selectDocs(docs, { ...opts, query: 'póliza', sort: 'relevance' });
    expect(found[0].doc.id).toBe('s-poliza');
  });
});

describe('archivos y errores', () => {
  it('valida la subida con las reglas del servidor', () => {
    expect(checkUpload({ name: 'a.pdf', size: 100 })).toBeNull();
    expect(checkUpload({ name: 'a.xlsx', size: 100 })).toBe('type');
    expect(checkUpload({ name: 'a.docx', size: 11 * 1024 * 1024 })).toBe('size');
    expect(checkUpload({ name: 'a.txt', size: 0 })).toBe('empty');
  });

  it('escapa el CSV', () => {
    expect(toCsv([['a', 'b,c'], ['d"e', 1]])).toBe('﻿a,"b,c"\r\n"d""e",1\r\n');
  });

  it('traduce los errores de la API a códigos propios', () => {
    expect(toApiError({ response: { status: 401, data: {} } }).code).toBe('login');
    expect(toApiError({ response: { status: 429, data: {} } }).code).toBe('rateLimit');
    expect(toApiError({ response: { status: 503, data: { code: 'budget_exhausted' } } }).code).toBe('aiBudget');
    expect(toApiError({ response: { status: 400, data: { message: 'Document has no extractable text' } } }).code).toBe('noText');
    expect(toApiError({ code: 'ERR_NETWORK' }).code).toBe('network');
  });
});
