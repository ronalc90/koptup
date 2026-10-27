// Reglas fiscales y utilidades puras de la demo de facturación electrónica (Colombia).
// Todo se calcula en el navegador con datos de ejemplo; nada se envía a la DIAN.

export type TaxCategory = 'iva19' | 'iva5' | 'exento' | 'excluido';
export const TAX_CATEGORIES: TaxCategory[] = ['iva19', 'iva5', 'exento', 'excluido'];
export const TAX_RATE: Record<TaxCategory, number> = { iva19: 0.19, iva5: 0.05, exento: 0, excluido: 0 };

/** Conceptos de retención en la fuente con tarifas de referencia (se ajustan con el contador). */
export type ReteConcept = 'none' | 'servicios' | 'honorarios' | 'compras' | 'software';
export const RETE_CONCEPTS: ReteConcept[] = ['none', 'servicios', 'honorarios', 'compras', 'software'];
export const RETE_RATE: Record<ReteConcept, number> = {
  none: 0,
  servicios: 0.04,
  honorarios: 0.11,
  compras: 0.025,
  software: 0.035,
};
/** ReteIVA: 15 % del IVA cuando el comprador es agente de retención de IVA. */
export const RETE_IVA_RATE = 0.15;

export interface TaxLine {
  qty: number;
  unitPrice: number;
  tax: TaxCategory;
  rete: ReteConcept;
}

export interface TaxBuyer {
  retIva: boolean;
  retIcaPerMil: number;
}

export interface Totals {
  subtotal: number;
  byTax: Record<TaxCategory, { base: number; tax: number }>;
  iva: number;
  total: number;
  rete: { fuente: number; iva: number; ica: number; total: number };
  /** Lo que el comprador pagaría después de practicar las retenciones (informativo). */
  netEstimate: number;
}

export const lineBase = (l: Pick<TaxLine, 'qty' | 'unitPrice'>) => Math.round((l.qty || 0) * (l.unitPrice || 0));

/**
 * Totales de un documento: total = subtotal + IVA. Las retenciones son
 * informativas (las practica el comprador) y no restan del total de la factura.
 */
export function computeTotals(lines: TaxLine[], buyer: TaxBuyer): Totals {
  const byTax: Totals['byTax'] = {
    iva19: { base: 0, tax: 0 },
    iva5: { base: 0, tax: 0 },
    exento: { base: 0, tax: 0 },
    excluido: { base: 0, tax: 0 },
  };
  let fuente = 0;
  for (const l of lines) {
    const base = lineBase(l);
    byTax[l.tax].base += base;
    byTax[l.tax].tax += Math.round(base * TAX_RATE[l.tax]);
    fuente += Math.round(base * RETE_RATE[l.rete]);
  }
  const subtotal = TAX_CATEGORIES.reduce((a, k) => a + byTax[k].base, 0);
  const iva = TAX_CATEGORIES.reduce((a, k) => a + byTax[k].tax, 0);
  const reteIva = buyer.retIva ? Math.round(iva * RETE_IVA_RATE) : 0;
  const reteIca = buyer.retIcaPerMil > 0 ? Math.round((subtotal * buyer.retIcaPerMil) / 1000) : 0;
  const total = subtotal + iva;
  const reteTotal = fuente + reteIva + reteIca;
  return {
    subtotal,
    byTax,
    iva,
    total,
    rete: { fuente, iva: reteIva, ica: reteIca, total: reteTotal },
    netEstimate: total - reteTotal,
  };
}

// ---------- NIT y dígito de verificación ----------

const DV_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación del NIT (algoritmo módulo 11 de la DIAN). */
export function nitDv(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    const d = Number(clean[clean.length - 1 - i]);
    sum += d * DV_WEIGHTS[i];
  }
  const r = sum % 11;
  return String(r >= 2 ? 11 - r : r);
}

export type NitState = 'empty' | 'short' | 'missingDv' | 'badDv' | 'ok';

/** Valida "900123456-7" / "9001234567": 8 a 10 dígitos más DV calculado. */
export function checkNit(raw: string): { state: NitState; digits: string; dv: string; expectedDv: string } {
  const value = raw.trim();
  if (!value) return { state: 'empty', digits: '', dv: '', expectedDv: '' };
  const m = value.replace(/[.\s]/g, '').match(/^(\d+)(?:-(\d))?$/);
  if (!m) return { state: 'short', digits: '', dv: '', expectedDv: '' };
  const digits = m[1];
  if (digits.length < 8 || digits.length > 10) return { state: 'short', digits, dv: m[2] || '', expectedDv: '' };
  const expectedDv = nitDv(digits);
  if (m[2] === undefined) return { state: 'missingDv', digits, dv: '', expectedDv };
  return { state: m[2] === expectedDv ? 'ok' : 'badDv', digits, dv: m[2], expectedDv };
}

/** Cédula de ciudadanía: 6 a 10 dígitos, sin DV. */
export function checkCc(raw: string): boolean {
  return /^\d{6,10}$/.test(raw.replace(/[.\s]/g, ''));
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// ---------- Formatos (deterministas: sin toLocaleString para evitar diferencias servidor/navegador) ----------

export function groupThousands(n: number): string {
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const formatCOP = (n: number) => (n < 0 ? '-$ ' : '$ ') + groupThousands(Math.abs(n));

/** "901234567" + "8" → "901.234.567-8" */
export function formatNit(digits: string, dv?: string): string {
  const g = digits ? groupThousands(Number(digits)) : '';
  return dv ? `${g}-${dv}` : g;
}

/** Monto con dos decimales y punto, como lo pide la fórmula del CUFE. */
export const amount2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

// ---------- Fechas (cadenas ISO, sin depender de la zona horaria) ----------

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const isoOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoOf(year, month, day);
}

/** Lunes siguiente (o el mismo día si ya es lunes): festivos trasladables de la Ley 51 de 1983. */
function nextMonday(iso: string): string {
  const w = weekday(iso);
  return w === 1 ? iso : addDays(iso, (8 - w) % 7);
}

const holidayCache = new Map<number, Set<string>>();

/** Festivos de Colombia de un año: fijos, trasladables al lunes y los que dependen de la Pascua. */
export function coHolidays(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const e = easter(year);
  const fixed = [isoOf(year, 1, 1), isoOf(year, 5, 1), isoOf(year, 7, 20), isoOf(year, 8, 7), isoOf(year, 12, 8), isoOf(year, 12, 25)];
  const moved = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ].map(([m, d]) => nextMonday(isoOf(year, m, d)));
  const easterBased = [addDays(e, -3), addDays(e, -2), addDays(e, 43), addDays(e, 64), addDays(e, 71)];
  const set = new Set([...fixed, ...moved, ...easterBased]);
  holidayCache.set(year, set);
  return set;
}

export function isBusinessDay(iso: string): boolean {
  const w = weekday(iso);
  return w !== 0 && w !== 6 && !coHolidays(Number(iso.slice(0, 4))).has(iso);
}

/** Suma días hábiles (lunes a viernes, sin festivos). */
export function addBusinessDays(iso: string, n: number): string {
  let cur = iso;
  let left = n;
  while (left > 0) {
    cur = addDays(cur, 1);
    if (isBusinessDay(cur)) left--;
  }
  return cur;
}

/** Resta días hábiles: el n-ésimo día hábil antes de `iso`. */
export function subBusinessDays(iso: string, n: number): string {
  let cur = iso;
  let left = n;
  while (left > 0) {
    cur = addDays(cur, -1);
    if (isBusinessDay(cur)) left--;
  }
  return cur;
}

/** "2026-10" → "2026-09" */
export function addMonthsYm(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

/**
 * Fecha y hora actuales de Colombia (UTC−5 todo el año, sin horario de verano).
 * Solo se usa después de montar o en acciones del usuario, nunca en el primer render.
 */
export function colombiaNow(): { date: string; time: string } {
  const iso = new Date(Date.now() - 5 * 3600000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
}

/** Días hábiles que faltan desde `from` (exclusivo) hasta `to` (inclusivo). */
export function businessDaysUntil(from: string, to: string): number {
  if (to <= from) return 0;
  let count = 0;
  let cur = from;
  while (cur < to) {
    cur = addDays(cur, 1);
    if (isBusinessDay(cur)) count++;
  }
  return count;
}

// ---------- SHA-384 (CUFE / CUDE de ejemplo) ----------

/** SHA-384 en hexadecimal con Web Crypto (el algoritmo que usa la DIAN para CUFE y CUDE). */
export async function sha384Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
