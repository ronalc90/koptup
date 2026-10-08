// Tipos y datos de ejemplo de la demo de facturación electrónica.
// Empresas, NIT, correos (dominio .example) y cifras son ficticios. El DV de cada NIT
// se calcula con el algoritmo de la DIAN para que la validación de la demo sea coherente.

import { nitDv, type ReteConcept, type TaxCategory } from './fiscal';

/** Fecha fija de la simulación: evita depender del reloj y mantiene coherentes los plazos. */
export const DEMO_TODAY = '2026-10-08';
export const DEMO_PERIODS = ['2026-08', '2026-09', '2026-10'] as const;

export type DocType = 'factura' | 'notaCredito' | 'notaDebito' | 'pos';
export const DOC_TYPES: DocType[] = ['factura', 'notaCredito', 'notaDebito', 'pos'];
export type DocStatus = 'accepted' | 'rejected' | 'contingency';
export type IdType = 'NIT' | 'CC' | 'CF';
export type PaymentForm = 'contado' | 'credito';
export type PaymentMethod = 'transferencia' | 'efectivo' | 'tarjeta';

export const CONSUMIDOR_FINAL_ID = '222222222222';

/** Conceptos de corrección del anexo técnico de la DIAN. */
export const CREDIT_CONCEPTS = ['1', '2', '3', '4', '5', '6'] as const;
export const DEBIT_CONCEPTS = ['1', '2', '3', '4'] as const;

export interface Party {
  idType: IdType;
  idNumber: string;
  dv: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  /** El comprador es agente de retención de IVA (ReteIVA 15 % del IVA). */
  retIva: boolean;
  /** Tarifa de ReteICA por mil que practicaría el comprador (0 = no practica). */
  retIcaPerMil: number;
}

export interface DocLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  tax: TaxCategory;
  rete: ReteConcept;
  /** En notas crédito por devolución: línea de la factura de origen. */
  srcLineId?: string;
}

export type HistoryKey =
  | 'xml'
  | 'signed'
  | 'transmitted'
  | 'accepted'
  | 'rejected'
  | 'queued'
  | 'delivered'
  | 'sent'
  | 'corrected'
  | 'noteIssued';

export interface HistoryEntry {
  date: string;
  time: string;
  key: HistoryKey;
  detail?: string;
}

export interface BillingDoc {
  id: string;
  type: DocType;
  prefix: string;
  number: number;
  issueDate: string;
  /** HH:MM:SS-05:00 (hora de Colombia), como la pide la fórmula del CUFE. */
  issueTime: string;
  client: Party;
  lines: DocLine[];
  paymentForm: PaymentForm;
  paymentMethod: PaymentMethod;
  dueDate?: string;
  status: DocStatus;
  /** CUFE/CUDE de ejemplo (SHA-384). Vacío mientras se calcula. */
  cufe: string;
  refId?: string;
  concept?: string;
  note?: string;
  rejection?: 'badDv';
  history: HistoryEntry[];
}

export interface Issuer {
  name: string;
  nit: string;
  dv: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  prefix: string;
  /** Logo como data URL (lo sube el visitante; se guarda solo en este navegador). */
  logo: string | null;
}

export type RadianCode = '030' | '031' | '032' | '033' | '034';
export const CLAIM_REASONS = ['01', '02', '03', '04'] as const;
export type ClaimReason = (typeof CLAIM_REASONS)[number];

export interface RadianEvent {
  code: RadianCode;
  date: string;
  reason?: ClaimReason;
}

export interface IncomingInvoice {
  id: string;
  supplier: { name: string; nit: string; dv: string; city: string };
  number: string;
  issueDate: string;
  receivedDate: string;
  concept: string;
  tax: TaxCategory;
  base: number;
  /** 'self' = dirigida al NIT del emisor de la demo. */
  buyerNit: 'self' | string;
  cufe: string;
  events: RadianEvent[];
}

export interface Resolution {
  number: string;
  date: string;
  from: number;
  to: number;
  validTo: string;
}

/** Resolución de numeración de ejemplo (en tu proyecto se usa la que te autoriza la DIAN). */
export const RESOLUTION: Resolution = {
  number: '18764000000001',
  date: '2026-01-15',
  from: 1001,
  to: 5000,
  validTo: '2027-01-15',
};

export const PREFIXES: Record<DocType, string> = { factura: 'FE', notaCredito: 'NC', notaDebito: 'ND', pos: 'POS' };
export const FIRST_NUMBER: Record<DocType, number> = { factura: 1001, notaCredito: 101, notaDebito: 51, pos: 2001 };

/** Claves de ejemplo para la fórmula del CUFE/CUDE (ambiente de pruebas). */
export const TECH_KEY_SAMPLE = 'clave-tecnica-de-ejemplo-koptup';
export const SOFTWARE_PIN_SAMPLE = '12345';
export const ENVIRONMENT_TEST = '2';

const nit = (n: string) => ({ nit: n, dv: nitDv(n) });

export const SAMPLE_ISSUER: Issuer = {
  name: 'Ceibalto Software S.A.S.',
  ...nit('901512346'),
  city: 'Bogotá D.C.',
  address: 'Cl. 93 # 00-00 (dirección de ejemplo)',
  email: 'facturacion@ceibalto.example',
  phone: '601 000 0000',
  prefix: 'FE',
  logo: null,
};

const company = (
  idNumber: string,
  name: string,
  city: string,
  email: string,
  extra: Partial<Party> = {},
): Party => ({
  idType: 'NIT',
  idNumber,
  dv: nitDv(idNumber),
  name,
  email,
  city,
  phone: '',
  retIva: false,
  retIcaPerMil: 0,
  ...extra,
});

export const SAMPLE_CLIENTS: Party[] = [
  company('901234517', 'Comercializadora Nubarán S.A.S.', 'Bogotá D.C.', 'facturas@nubaran.example', { retIcaPerMil: 9.66 }),
  company('900876543', 'Clínica Veralta IPS S.A.S.', 'Medellín', 'cuentas@veralta.example', { retIva: true }),
  company('901456120', 'Logística Arrayán del Caribe S.A.S.', 'Barranquilla', 'pagos@arrayan.example'),
  company('900345678', 'Instituto Educativo Monteluz S.A.S.', 'Cali', 'contabilidad@monteluz.example'),
  company('901777210', 'Ferrecentro Altavista S.A.S.', 'Bucaramanga', 'compras@altavista.example'),
];

export const CONSUMIDOR_FINAL: Party = {
  idType: 'CF',
  idNumber: CONSUMIDOR_FINAL_ID,
  dv: '',
  name: 'Consumidor final',
  email: '',
  city: 'Bogotá D.C.',
  phone: '',
  retIva: false,
  retIcaPerMil: 0,
};

export interface CatalogItem {
  id: string;
  description: string;
  unitPrice: number;
  tax: TaxCategory;
  rete: ReteConcept;
}

/** Servicios de ejemplo del emisor (una empresa de software). */
export const CATALOG: CatalogItem[] = [
  { id: 'lic', description: 'Licencia de software de gestión (mensual)', unitPrice: 1_450_000, tax: 'iva19', rete: 'software' },
  { id: 'sop', description: 'Soporte técnico (hora)', unitPrice: 120_000, tax: 'iva19', rete: 'servicios' },
  { id: 'cap', description: 'Capacitación a usuarios (hora)', unitPrice: 150_000, tax: 'iva19', rete: 'servicios' },
  { id: 'dev', description: 'Desarrollo a la medida (hora)', unitPrice: 180_000, tax: 'iva19', rete: 'servicios' },
  { id: 'hos', description: 'Hosting administrado (mensual)', unitPrice: 690_000, tax: 'iva19', rete: 'servicios' },
  { id: 'tal', description: 'Taller presencial de facturación electrónica (cupo)', unitPrice: 80_000, tax: 'iva19', rete: 'none' },
];

const item = (id: string) => CATALOG.find((c) => c.id === id) as CatalogItem;

const line = (docId: string, idx: number, itemId: string, qty: number): DocLine => {
  const c = item(itemId);
  return { id: `${docId}-l${idx}`, description: c.description, qty, unitPrice: c.unitPrice, tax: c.tax, rete: c.rete };
};

/** Líneas con las que arranca el formulario de factura. */
export const DEFAULT_LINES: DocLine[] = [
  { ...line('draft', 1, 'lic', 1) },
  { ...line('draft', 2, 'sop', 10) },
  { ...line('draft', 3, 'cap', 4) },
];

/** Líneas con las que arranca el documento POS (venta en mostrador). */
export const POS_DEFAULT_LINES: DocLine[] = [{ ...line('draft', 1, 'tal', 2), rete: 'none' }];

function stdHistory(date: string, time: string, email: string, status: DocStatus): HistoryEntry[] {
  const hhmm = time.slice(0, 5);
  const h: HistoryEntry[] = [
    { date, time: hhmm, key: 'xml' },
    { date, time: hhmm, key: 'signed' },
    { date, time: hhmm, key: 'transmitted' },
  ];
  if (status === 'rejected') h.push({ date, time: hhmm, key: 'rejected' });
  else {
    h.push({ date, time: hhmm, key: 'accepted' });
    if (email) h.push({ date, time: hhmm, key: 'delivered', detail: email });
  }
  return h;
}

interface SampleSpec {
  type: DocType;
  number: number;
  date: string;
  time: string;
  client: Party;
  items: [string, number][];
  payment?: [PaymentForm, PaymentMethod];
  status?: DocStatus;
  refId?: string;
  concept?: string;
  note?: string;
  customLines?: DocLine[];
}

function sampleDoc(s: SampleSpec): BillingDoc {
  const prefix = PREFIXES[s.type];
  const id = `${prefix}${s.number}`;
  const [paymentForm, paymentMethod] = s.payment || ['credito', 'transferencia'];
  const status = s.status || 'accepted';
  return {
    id,
    type: s.type,
    prefix,
    number: s.number,
    issueDate: s.date,
    issueTime: `${s.time}-05:00`,
    client: s.client,
    lines: s.customLines || s.items.map(([itemId, qty], i) => line(id, i + 1, itemId, qty)),
    paymentForm,
    paymentMethod,
    dueDate: paymentForm === 'credito' ? addDaysIso(s.date, 30) : undefined,
    status,
    cufe: '',
    refId: s.refId,
    concept: s.concept,
    note: s.note,
    rejection: status === 'rejected' ? 'badDv' : undefined,
    history: stdHistory(s.date, s.time, s.client.email, status),
  };
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
}

const [C1, C2, C3, C4, C5] = SAMPLE_CLIENTS;

/** Cliente con el DV mal digitado: la DIAN (simulada) rechazó la factura FE1013. */
const C5_BAD_DV: Party = { ...C5, dv: C5.dv === '7' ? '8' : '7' };

export function buildSampleDocs(): BillingDoc[] {
  const docs: BillingDoc[] = [
    sampleDoc({ type: 'factura', number: 1001, date: '2026-08-04', time: '09:12:30', client: C1, items: [['lic', 1], ['sop', 6]], payment: ['contado', 'transferencia'] }),
    sampleDoc({ type: 'factura', number: 1002, date: '2026-08-11', time: '10:40:02', client: C2, items: [['lic', 1], ['cap', 8]] }),
    sampleDoc({ type: 'factura', number: 1003, date: '2026-08-19', time: '15:05:47', client: C3, items: [['dev', 40]] }),
    sampleDoc({ type: 'factura', number: 1004, date: '2026-08-27', time: '11:22:10', client: C4, items: [['lic', 1], ['hos', 1]], payment: ['contado', 'transferencia'] }),
    sampleDoc({ type: 'factura', number: 1005, date: '2026-09-03', time: '09:01:55', client: C1, items: [['lic', 1], ['sop', 4]] }),
    sampleDoc({ type: 'factura', number: 1006, date: '2026-09-09', time: '14:30:18', client: C5, items: [['sop', 12], ['cap', 4]] }),
    sampleDoc({ type: 'factura', number: 1007, date: '2026-09-15', time: '16:48:09', client: C2, items: [['lic', 1], ['hos', 1]] }),
    sampleDoc({ type: 'factura', number: 1008, date: '2026-09-22', time: '08:55:41', client: C3, items: [['dev', 24]] }),
    sampleDoc({
      type: 'notaDebito',
      number: 51,
      date: '2026-09-28',
      time: '10:10:10',
      client: C3,
      items: [],
      refId: 'FE1003',
      concept: '1',
      note: 'Intereses de mora por pago tardío de FE1003',
      customLines: [
        { id: 'ND51-l1', description: 'Intereses de mora sobre FE1003', qty: 1, unitPrice: 96_000, tax: 'excluido', rete: 'none' },
      ],
    }),
    sampleDoc({ type: 'factura', number: 1009, date: '2026-09-30', time: '17:20:33', client: C4, items: [['cap', 12]] }),
    sampleDoc({ type: 'factura', number: 1010, date: '2026-10-01', time: '09:30:00', client: C1, items: [['lic', 1], ['sop', 10], ['cap', 4]] }),
    sampleDoc({ type: 'factura', number: 1011, date: '2026-10-02', time: '10:05:12', client: C2, items: [['lic', 1], ['dev', 10]] }),
    sampleDoc({
      type: 'notaCredito',
      number: 101,
      date: '2026-10-05',
      time: '11:15:42',
      client: C4,
      items: [],
      refId: 'FE1009',
      concept: '1',
      note: 'Tres horas de capacitación no prestadas',
      customLines: [
        { id: 'NC101-l1', description: 'Capacitación a usuarios (hora)', qty: 3, unitPrice: 150_000, tax: 'iva19', rete: 'servicios', srcLineId: 'FE1009-l1' },
      ],
    }),
    sampleDoc({ type: 'factura', number: 1012, date: '2026-10-06', time: '15:40:27', client: C3, items: [['hos', 1], ['sop', 5]] }),
    sampleDoc({ type: 'factura', number: 1013, date: '2026-10-07', time: '09:48:03', client: C5_BAD_DV, items: [['sop', 8]], status: 'rejected' }),
    sampleDoc({ type: 'pos', number: 2001, date: '2026-10-07', time: '18:02:11', client: CONSUMIDOR_FINAL, items: [['tal', 1]], payment: ['contado', 'efectivo'] }),
  ];
  // Más recientes primero.
  return docs.sort((a, b) => (b.issueDate + b.issueTime).localeCompare(a.issueDate + a.issueTime));
}

const supplier = (n: string, name: string, city: string) => ({ name, ...nit(n), city });

export function buildSampleIncoming(): IncomingInvoice[] {
  return [
    {
      id: 'in-1',
      supplier: supplier('900612784', 'Energía del Altiplano S.A. E.S.P.', 'Tunja'),
      number: 'EA558210',
      issueDate: '2026-10-01',
      receivedDate: '2026-10-01',
      concept: 'Energía eléctrica — septiembre 2026',
      tax: 'excluido',
      base: 1_180_000,
      buyerNit: 'self',
      cufe: '',
      events: [
        { code: '030', date: '2026-10-01' },
        { code: '032', date: '2026-10-02' },
        { code: '033', date: '2026-10-05' },
      ],
    },
    {
      id: 'in-2',
      supplier: supplier('901398265', 'Conectar Fibra Andina S.A.S.', 'Bogotá D.C.'),
      number: 'CFA90412',
      issueDate: '2026-10-05',
      receivedDate: '2026-10-05',
      concept: 'Internet empresarial 300 Mbps — octubre 2026',
      tax: 'iva19',
      base: 389_900,
      buyerNit: 'self',
      cufe: '',
      events: [{ code: '030', date: '2026-10-05' }],
    },
    {
      id: 'in-3',
      supplier: supplier('900951357', 'Inmobiliaria Torreverde S.A.S.', 'Bogotá D.C.'),
      number: 'TV3317',
      issueDate: '2026-10-02',
      receivedDate: '2026-10-02',
      concept: 'Arrendamiento de oficina — octubre 2026',
      tax: 'iva19',
      base: 6_500_000,
      buyerNit: 'self',
      cufe: '',
      events: [
        { code: '030', date: '2026-10-02' },
        { code: '032', date: '2026-10-06' },
      ],
    },
    {
      id: 'in-4',
      supplier: supplier('901620483', 'Papelería Guayacán S.A.S.', 'Bogotá D.C.'),
      number: 'PG77120',
      issueDate: '2026-10-07',
      receivedDate: '2026-10-07',
      concept: 'Útiles de oficina',
      tax: 'iva19',
      base: 284_000,
      buyerNit: 'self',
      cufe: '',
      events: [],
    },
    {
      id: 'in-5',
      supplier: supplier('900534219', 'Mensajería Cumbre Express S.A.S.', 'Bogotá D.C.'),
      number: 'MCE12058',
      issueDate: '2026-10-07',
      receivedDate: '2026-10-07',
      concept: 'Mensajería urbana — septiembre 2026',
      tax: 'iva19',
      base: 145_000,
      buyerNit: '901512364',
      cufe: '',
      events: [],
    },
  ];
}
