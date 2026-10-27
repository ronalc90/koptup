/**
 * "Prueba con tu CSV": lectura, mapeo de columnas y armado del dataset en el
 * navegador. El archivo no se envía a ningún servidor.
 */
import { monthOf, normalizeDate } from './dates';
import type { Dataset, MonthKey, SaleRow, SectorId } from './types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 50_000;

export type Field = 'date' | 'customer' | 'value' | 'city' | 'line' | 'seller' | 'cost' | 'invoice';
export const REQUIRED_FIELDS: Field[] = ['date', 'customer', 'value'];
export const OPTIONAL_FIELDS: Field[] = ['city', 'line', 'seller', 'cost', 'invoice'];
export type Mapping = Partial<Record<Field, number>>;

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

/** Detecta el separador mirando la primera línea (`;`, `,` o tabulador). */
function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = [';', ',', '\t'].map((d) => ({ d, n: first.split(d).length - 1 }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

/** Parser CSV con comillas dobles (RFC 4180). */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) out.push(row);
      row = [];
      if (out.length > MAX_ROWS + 1) break;
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) out.push(row);
  }
  const headers = (out.shift() ?? []).map((h) => h.trim());
  return { headers, rows: out, delimiter };
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const HINTS: Record<Field, string[]> = {
  date: ['fecha', 'fechafactura', 'fechaemision', 'date', 'invoicedate', 'dia'],
  customer: ['cliente', 'razonsocial', 'nombrecliente', 'customer', 'client', 'tercero', 'comprador'],
  value: ['valor', 'venta', 'ventas', 'ventaneta', 'subtotal', 'total', 'monto', 'importe', 'value', 'amount', 'sales', 'revenue'],
  city: ['ciudad', 'sede', 'sucursal', 'municipio', 'region', 'city', 'branch', 'store', 'tienda'],
  line: ['linea', 'lineadenegocio', 'categoria', 'producto', 'familia', 'servicio', 'line', 'category', 'product'],
  seller: ['vendedor', 'asesor', 'comercial', 'ejecutivo', 'seller', 'salesrep', 'rep'],
  cost: ['costo', 'costodeventa', 'costoventas', 'cost', 'cogs'],
  invoice: ['factura', 'numerofactura', 'nofactura', 'documento', 'invoice', 'invoicenumber', 'numero'],
};

/** Sugiere qué columna corresponde a cada campo según el encabezado. */
export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<number>();
  const fields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
  // Primero coincidencias exactas, luego parciales.
  for (const exact of [true, false]) {
    for (const f of fields) {
      if (mapping[f] !== undefined) continue;
      const idx = headers.findIndex((h, i) => {
        if (used.has(i)) return false;
        const n = norm(h);
        return HINTS[f].some((hint) => (exact ? n === hint : n.includes(hint)));
      });
      if (idx >= 0) {
        mapping[f] = idx;
        used.add(idx);
      }
    }
  }
  return mapping;
}

/** Convierte "1.234.567", "$ 1,234,567.89", "1234567,5" o "(1.200)" en número. */
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/COP|USD|\$|\s/gi, '');
  if (s.startsWith('-')) {
    negative = !negative;
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s)) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    normalized = s.split(thou).join('').replace(dec, '.');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const parts = s.split(sep);
    const isThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    normalized = isThousands ? parts.join('') : parts.join('.');
  } else normalized = s;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

export interface UploadResult {
  dataset: Dataset | null;
  used: number;
  skipped: number;
  reasons: { badDate: number; badValue: number; noCustomer: number };
  truncated: boolean;
}

export interface Placeholders {
  noCity: string;
  noLine: string;
  noSeller: string;
}

export function buildUploadDataset(
  parsed: ParsedCsv,
  mapping: Mapping,
  fileName: string,
  sector: SectorId,
  ph: Placeholders,
): UploadResult {
  const reasons = { badDate: 0, badValue: 0, noCustomer: 0 };
  const rows: SaleRow[] = [];
  const truncated = parsed.rows.length > MAX_ROWS;
  const source = parsed.rows.slice(0, MAX_ROWS);
  const get = (r: string[], f: Field) => (mapping[f] === undefined ? '' : (r[mapping[f]!] ?? '').trim());
  let hasCost = mapping.cost !== undefined;
  source.forEach((r, i) => {
    const date = normalizeDate(get(r, 'date'));
    if (!date) {
      reasons.badDate++;
      return;
    }
    const value = parseAmount(get(r, 'value'));
    if (value === null) {
      reasons.badValue++;
      return;
    }
    const customer = get(r, 'customer');
    if (!customer) {
      reasons.noCustomer++;
      return;
    }
    const cost = hasCost ? parseAmount(get(r, 'cost')) : null;
    rows.push({
      id: get(r, 'invoice') || `#${i + 2}`,
      date,
      customer,
      city: get(r, 'city') || ph.noCity,
      line: get(r, 'line') || ph.noLine,
      seller: get(r, 'seller') || ph.noSeller,
      value,
      cost,
      due: null,
      paid: null,
    });
  });
  if (hasCost && rows.some((r) => r.cost === null)) {
    // Si el costo viene incompleto no se calcula margen (sería engañoso).
    hasCost = false;
    for (const r of rows) r.cost = null;
  }
  const skipped = reasons.badDate + reasons.badValue + reasons.noCustomer;
  if (!rows.length) return { dataset: null, used: 0, skipped, reasons, truncated };
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const months = Array.from(new Set(rows.map((r) => monthOf(r.date)))).sort() as MonthKey[];
  return {
    dataset: {
      source: 'upload',
      sector,
      fileName,
      rows,
      expenses: null,
      months,
      cutoff: rows[rows.length - 1].date,
      cashStart: null,
      supplierDays: null,
      hasCost,
      hasReceivables: false,
      iva: null,
    },
    used: rows.length,
    skipped,
    reasons,
    truncated,
  };
}

/** Escapa un valor para CSV con el separador dado. */
function cell(v: string | number | null, sep: string): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con BOM (Excel lo abre con tildes) y `;` en español / `,` en inglés. */
export function toCsv(headers: string[], rows: (string | number | null)[][], loc: 'es' | 'en'): string {
  const sep = loc === 'es' ? ';' : ',';
  const lines = [headers, ...rows].map((r) => r.map((v) => cell(v, sep)).join(sep));
  return `﻿${lines.join('\r\n')}\r\n`;
}
