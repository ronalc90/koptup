// Borrador del documento que se está construyendo en "Emisión" y sus validaciones previas.

import {
  CONSUMIDOR_FINAL,
  DEFAULT_LINES,
  POS_DEFAULT_LINES,
  RESOLUTION,
  type BillingDoc,
  type DocLine,
  type DocType,
  type IdType,
  type Party,
  type PaymentForm,
  type PaymentMethod,
} from './data';
import { docTotals, invoiceBalance, nextNumber, notesFor, returnedQty } from './docs';
import { checkCc, checkNit, computeTotals, isEmail, lineBase, type TaxCategory } from './fiscal';

export interface DraftClient {
  idType: Exclude<IdType, 'CF'>;
  idRaw: string;
  name: string;
  email: string;
  city: string;
  retIva: boolean;
  retIcaPerMil: number;
}

export interface Draft {
  type: DocType;
  client: DraftClient;
  lines: DocLine[];
  paymentForm: PaymentForm;
  paymentMethod: PaymentMethod;
  creditDays: number;
  refId: string;
  concept: string;
  note: string;
  returnQty: Record<string, number>;
  adjustBase: number;
  adjustTax: TaxCategory;
  posWithBuyer: boolean;
}

export const EMPTY_CLIENT: DraftClient = {
  idType: 'NIT',
  idRaw: '',
  name: '',
  email: '',
  city: '',
  retIva: false,
  retIcaPerMil: 0,
};

export function defaultDraft(): Draft {
  return {
    type: 'factura',
    client: { ...EMPTY_CLIENT },
    lines: DEFAULT_LINES.map((l) => ({ ...l })),
    paymentForm: 'credito',
    paymentMethod: 'transferencia',
    creditDays: 30,
    refId: '',
    concept: '',
    note: '',
    returnQty: {},
    adjustBase: 0,
    adjustTax: 'iva19',
    posWithBuyer: false,
  };
}

/** Borrador limpio para un tipo de documento (líneas y medio de pago acordes). */
export function draftForType(type: DocType): Draft {
  const base = defaultDraft();
  if (type === 'pos') return { ...base, type, lines: POS_DEFAULT_LINES.map((l) => ({ ...l })), paymentForm: 'contado', paymentMethod: 'efectivo' };
  if (type === 'factura') return base;
  return { ...base, type, lines: [] };
}

export function partyFromDraft(c: DraftClient): Party {
  if (c.idType === 'NIT') {
    const chk = checkNit(c.idRaw);
    return {
      idType: 'NIT',
      idNumber: chk.digits,
      dv: chk.dv || chk.expectedDv,
      name: c.name.trim(),
      email: c.email.trim(),
      city: c.city.trim(),
      phone: '',
      retIva: c.retIva,
      retIcaPerMil: c.retIcaPerMil,
    };
  }
  return {
    idType: 'CC',
    idNumber: c.idRaw.replace(/\D/g, ''),
    dv: '',
    name: c.name.trim(),
    email: c.email.trim(),
    city: c.city.trim(),
    phone: '',
    retIva: false,
    retIcaPerMil: 0,
  };
}

export const isNote = (type: DocType) => type === 'notaCredito' || type === 'notaDebito';

/** Cliente que tendrá el documento. */
export function draftParty(d: Draft, ref: BillingDoc | undefined): Party {
  if (isNote(d.type)) return ref ? ref.client : CONSUMIDOR_FINAL;
  if (d.type === 'pos' && !d.posWithBuyer) return CONSUMIDOR_FINAL;
  return partyFromDraft(d.client);
}

/** Líneas del documento según el tipo y el concepto. */
export function draftLines(d: Draft, ref: BillingDoc | undefined, adjustDescription: string): DocLine[] {
  if (d.type === 'factura' || d.type === 'pos') return d.lines;
  if (!ref || !d.concept) return [];
  if (d.type === 'notaCredito' && (d.concept === '1' || d.concept === '2')) {
    return ref.lines
      .map((l, i) => ({
        ...l,
        id: `draft-nc-${i}`,
        qty: d.concept === '2' ? l.qty : d.returnQty[l.id] || 0,
        srcLineId: l.id,
      }))
      .filter((l) => l.qty > 0);
  }
  if (d.adjustBase <= 0) return [];
  return [
    { id: 'draft-adj', description: adjustDescription, qty: 1, unitPrice: d.adjustBase, tax: d.adjustTax, rete: 'none' },
  ];
}

export type DraftIssue =
  | { key: 'idEmpty' }
  | { key: 'idShort' }
  | { key: 'idMissingDv'; dv: string }
  | { key: 'idBadDv'; dv: string }
  | { key: 'ccInvalid' }
  | { key: 'nameEmpty' }
  | { key: 'emailInvalid' }
  | { key: 'noLines' }
  | { key: 'lineInvalid'; n: number }
  | { key: 'noRef' }
  | { key: 'noConcept' }
  | { key: 'noteNoAmount' }
  | { key: 'overBalance'; balance: number }
  | { key: 'overQty'; n: number; max: number }
  | { key: 'voidWithNotes' }
  | { key: 'rangeExhausted' };

export function validateDraft(
  d: Draft,
  docs: BillingDoc[],
  ref: BillingDoc | undefined,
  lines: DocLine[],
  invoicePrefix: string,
): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const needsBuyer = d.type === 'factura' || (d.type === 'pos' && d.posWithBuyer);
  if (needsBuyer) {
    if (d.client.idType === 'NIT') {
      const chk = checkNit(d.client.idRaw);
      if (chk.state === 'empty') issues.push({ key: 'idEmpty' });
      else if (chk.state === 'short') issues.push({ key: 'idShort' });
      else if (chk.state === 'missingDv') issues.push({ key: 'idMissingDv', dv: chk.expectedDv });
      else if (chk.state === 'badDv') issues.push({ key: 'idBadDv', dv: chk.expectedDv });
    } else if (!checkCc(d.client.idRaw)) issues.push({ key: 'ccInvalid' });
    if (!d.client.name.trim()) issues.push({ key: 'nameEmpty' });
    if (d.type === 'factura' && !isEmail(d.client.email)) issues.push({ key: 'emailInvalid' });
    if (d.type === 'pos' && d.client.email.trim() && !isEmail(d.client.email)) issues.push({ key: 'emailInvalid' });
  }
  if (d.type === 'factura' || d.type === 'pos') {
    if (d.lines.length === 0) issues.push({ key: 'noLines' });
    d.lines.forEach((l, i) => {
      if (!l.description.trim() || l.qty <= 0 || l.unitPrice <= 0) issues.push({ key: 'lineInvalid', n: i + 1 });
    });
    if (d.type === 'factura' && nextNumber(docs, 'factura', invoicePrefix) > RESOLUTION.to) issues.push({ key: 'rangeExhausted' });
    return issues;
  }
  if (!ref) {
    issues.push({ key: 'noRef' });
    return issues;
  }
  if (!d.concept) {
    issues.push({ key: 'noConcept' });
    return issues;
  }
  if (lines.length === 0 || lines.every((l) => lineBase(l) <= 0)) issues.push({ key: 'noteNoAmount' });
  if (d.type === 'notaCredito') {
    if (d.concept === '2' && notesFor(ref.id, docs).some((n) => n.type === 'notaCredito')) issues.push({ key: 'voidWithNotes' });
    if (d.concept === '1') {
      const done = returnedQty(ref, docs);
      ref.lines.forEach((l, i) => {
        const max = l.qty - (done[l.id] || 0);
        if ((d.returnQty[l.id] || 0) > max) issues.push({ key: 'overQty', n: i + 1, max });
      });
    }
    const balance = invoiceBalance(ref, docs);
    const total = computeTotals(lines, ref.client).total;
    if (total > balance) issues.push({ key: 'overBalance', balance });
  }
  return issues;
}

/** Facturas que admiten nota crédito o débito: aceptadas o en contingencia. */
export function referenceableInvoices(docs: BillingDoc[]): BillingDoc[] {
  return docs.filter((d) => d.type === 'factura' && d.status !== 'rejected');
}

export function draftTotals(lines: DocLine[], party: Party) {
  return docTotals({ lines, client: party });
}
