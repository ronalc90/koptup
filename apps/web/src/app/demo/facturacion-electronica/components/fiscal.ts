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

/** Festivos de Colombia que caen en el horizonte de la simulación (oct 2026 – ene 2027). */
export const CO_HOLIDAYS = new Set([
  '2026-10-12',
  '2026-11-02',
  '2026-11-16',
  '2026-12-08',
  '2026-12-25',
  '2027-01-01',
  '2027-01-11',
]);

export function isBusinessDay(iso: string): boolean {
  const w = weekday(iso);
  return w !== 0 && w !== 6 && !CO_HOLIDAYS.has(iso);
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
