// Lógica de documentos: numeración, saldos, CUFE/CUDE de ejemplo, XML de muestra, CSV y descargas.

import {
  ENVIRONMENT_TEST,
  FIRST_NUMBER,
  RESOLUTION,
  SOFTWARE_PIN_SAMPLE,
  TECH_KEY_SAMPLE,
  type BillingDoc,
  type DocType,
  type IncomingInvoice,
  type Issuer,
  type RadianCode,
} from './data';
import { DEMO_TODAY } from './data';
import { addBusinessDays, amount2, businessDaysUntil, computeTotals, TAX_RATE, type Totals } from './fiscal';

export const docTotals = (doc: Pick<BillingDoc, 'lines' | 'client'>): Totals => computeTotals(doc.lines, doc.client);

/** Signo contable del documento en los libros: las notas crédito restan. */
export const docSign = (doc: BillingDoc) => (doc.type === 'notaCredito' ? -1 : 1);

/** Documentos que cuentan como emitidos (aceptados o en cola de contingencia). */
export const isIssued = (doc: BillingDoc) => doc.status !== 'rejected';

export function nextNumber(docs: BillingDoc[], type: DocType, prefix: string): number {
  const used = docs.filter((d) => d.type === type && d.prefix === prefix).map((d) => d.number);
  return used.length ? Math.max(...used) + 1 : FIRST_NUMBER[type];
}

export function notesFor(invoiceId: string, docs: BillingDoc[]): BillingDoc[] {
  return docs.filter((d) => d.refId === invoiceId && isIssued(d));
}

/** Saldo de una factura: total − notas crédito + notas débito. */
export function invoiceBalance(invoice: BillingDoc, docs: BillingDoc[]): number {
  return notesFor(invoice.id, docs).reduce(
    (acc, n) => acc + (n.type === 'notaCredito' ? -1 : 1) * docTotals(n).total,
    docTotals(invoice).total,
  );
}

/** Unidades de cada línea de la factura ya devueltas con notas crédito. */
export function returnedQty(invoice: BillingDoc, docs: BillingDoc[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of notesFor(invoice.id, docs)) {
    if (n.type !== 'notaCredito') continue;
    for (const l of n.lines) if (l.srcLineId) out[l.srcLineId] = (out[l.srcLineId] || 0) + l.qty;
  }
  return out;
}

/**
 * Cadena de la fórmula del CUFE (factura) o CUDE (notas y POS) del anexo técnico:
 * NumFac + FecFac + HorFac + ValFac + 01 + ValIVA + 04 + ValINC + 03 + ValICA + ValTot + NitOFE + NumAdq + clave + ambiente.
 * La clave técnica y el PIN son de ejemplo y el ambiente es "pruebas".
 */
export function cufeInput(doc: BillingDoc, issuer: Issuer): string {
  const t = docTotals(doc);
  const key = doc.type === 'factura' ? TECH_KEY_SAMPLE : SOFTWARE_PIN_SAMPLE;
  return [
    doc.id,
    doc.issueDate,
    doc.issueTime,
    amount2(t.subtotal),
    '01',
    amount2(t.iva),
    '04',
    amount2(0),
    '03',
    amount2(0),
    amount2(t.total),
    issuer.nit,
    doc.client.idNumber,
    key,
    ENVIRONMENT_TEST,
  ].join('');
}

/** Cadena equivalente para facturas de proveedores (solo para mostrar un CUFE de ejemplo). */
export function incomingCufeInput(inv: IncomingInvoice, issuerNit: string): string {
  const iva = Math.round(inv.base * TAX_RATE[inv.tax]);
  return [
    inv.number,
    inv.issueDate,
    '08:00:00-05:00',
    amount2(inv.base),
    '01',
    amount2(iva),
    '04',
    amount2(0),
    '03',
    amount2(0),
    amount2(inv.base + iva),
    inv.supplier.nit,
    inv.buyerNit === 'self' ? issuerNit : inv.buyerNit,
    TECH_KEY_SAMPLE,
    ENVIRONMENT_TEST,
  ].join('');
}

/** Texto del código QR del documento (campos de la representación gráfica, sin enlaces). */
export function qrText(doc: BillingDoc, issuer: Issuer): string {
  const t = docTotals(doc);
  return [
    `NumFac: ${doc.id}`,
    `FecFac: ${doc.issueDate}`,
    `HorFac: ${doc.issueTime}`,
    `NitFac: ${issuer.nit}`,
    `DocAdq: ${doc.client.idNumber}`,
    `ValFac: ${amount2(t.subtotal)}`,
    `ValIva: ${amount2(t.iva)}`,
    `ValOtroIm: 0.00`,
    `ValTolFac: ${amount2(t.total)}`,
    `${doc.type === 'factura' ? 'CUFE' : 'CUDE'}: ${doc.cufe}`,
    'Documento de ejemplo del simulador de KopTup: no se transmitio a la DIAN y no tiene validez fiscal.',
  ].join('\n');
}

// ---------- RADIAN ----------

export type IncomingStage = 'new' | 'acknowledged' | 'received' | 'accepted' | 'tacit' | 'claimed';

export function incomingStage(inv: IncomingInvoice): IncomingStage {
  const has = (c: RadianCode) => inv.events.some((e) => e.code === c);
  if (has('031')) return 'claimed';
  if (has('033')) return 'accepted';
  if (has('034')) return 'tacit';
  if (has('032')) return 'received';
  if (has('030')) return 'acknowledged';
  return 'new';
}

/** Plazo para aceptar o reclamar: 3 días hábiles después del evento 032. */
export function claimDeadline(inv: IncomingInvoice): { deadline: string; daysLeft: number } | null {
  const recibo = inv.events.find((e) => e.code === '032');
  if (!recibo) return null;
  const deadline = addBusinessDays(recibo.date, 3);
  return { deadline, daysLeft: businessDaysUntil(DEMO_TODAY, deadline) };
}

export const incomingIva = (inv: IncomingInvoice) => Math.round(inv.base * TAX_RATE[inv.tax]);
export const incomingTotal = (inv: IncomingInvoice) => inv.base + incomingIva(inv);

// ---------- XML de muestra (estructura UBL 2.1 simplificada) ----------

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ROOT: Record<DocType, { root: string; ns: string; lineTag: string; qtyTag: string; typeTag?: string; typeCode?: string }> = {
  factura: {
    root: 'Invoice',
    ns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    lineTag: 'InvoiceLine',
    qtyTag: 'InvoicedQuantity',
    typeTag: 'InvoiceTypeCode',
    typeCode: '01',
  },
  pos: {
    root: 'Invoice',
    ns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    lineTag: 'InvoiceLine',
    qtyTag: 'InvoicedQuantity',
    typeTag: 'InvoiceTypeCode',
    typeCode: '20',
  },
  notaCredito: {
    root: 'CreditNote',
    ns: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
    lineTag: 'CreditNoteLine',
    qtyTag: 'CreditedQuantity',
    typeTag: 'CreditNoteTypeCode',
    typeCode: '91',
  },
  notaDebito: {
    root: 'DebitNote',
    ns: 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2',
    lineTag: 'DebitNoteLine',
    qtyTag: 'DebitedQuantity',
  },
};

const PAYMENT_CODE = { efectivo: '10', transferencia: '47', tarjeta: '48' } as const;
const ID_SCHEME = { NIT: '31', CC: '13', CF: '13' } as const;

export function buildXml(doc: BillingDoc, issuer: Issuer, ref: BillingDoc | undefined): string {
  const r = ROOT[doc.type];
  const t = docTotals(doc);
  const money = (n: number) => `currencyID="COP">${amount2(n)}`;
  const party = (name: string, id: string, dv: string, scheme: string, city: string, email: string) =>
    [
      '    <cac:Party>',
      '      <cac:PartyTaxScheme>',
      `        <cbc:RegistrationName>${esc(name)}</cbc:RegistrationName>`,
      `        <cbc:CompanyID schemeAgencyID="195"${dv ? ` schemeID="${dv}"` : ''} schemeName="${scheme}">${esc(id)}</cbc:CompanyID>`,
      '        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>',
      '      </cac:PartyTaxScheme>',
      `      <cac:PhysicalLocation><cac:Address><cbc:CityName>${esc(city)}</cbc:CityName><cac:Country><cbc:IdentificationCode>CO</cbc:IdentificationCode></cac:Country></cac:Address></cac:PhysicalLocation>`,
      email ? `      <cac:Contact><cbc:ElectronicMail>${esc(email)}</cbc:ElectronicMail></cac:Contact>` : '',
      '    </cac:Party>',
    ]
      .filter(Boolean)
      .join('\n');
  const taxSubtotals = (Object.keys(t.byTax) as (keyof Totals['byTax'])[])
    .filter((k) => k !== 'excluido' && t.byTax[k].base > 0)
    .map((k) =>
      [
        '    <cac:TaxSubtotal>',
        `      <cbc:TaxableAmount ${money(t.byTax[k].base)}</cbc:TaxableAmount>`,
        `      <cbc:TaxAmount ${money(t.byTax[k].tax)}</cbc:TaxAmount>`,
        `      <cac:TaxCategory><cbc:Percent>${(TAX_RATE[k] * 100).toFixed(2)}</cbc:Percent><cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme></cac:TaxCategory>`,
        '    </cac:TaxSubtotal>',
      ].join('\n'),
    );
  const lines = doc.lines.map((l, i) => {
    const base = Math.round(l.qty * l.unitPrice);
    const tax = Math.round(base * TAX_RATE[l.tax]);
    return [
      `  <cac:${r.lineTag}>`,
      `    <cbc:ID>${i + 1}</cbc:ID>`,
      `    <cbc:${r.qtyTag} unitCode="94">${l.qty}</cbc:${r.qtyTag}>`,
      `    <cbc:LineExtensionAmount ${money(base)}</cbc:LineExtensionAmount>`,
      l.tax !== 'excluido'
        ? `    <cac:TaxTotal><cbc:TaxAmount ${money(tax)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount ${money(base)}</cbc:TaxableAmount><cbc:TaxAmount ${money(tax)}</cbc:TaxAmount><cac:TaxCategory><cbc:Percent>${(TAX_RATE[l.tax] * 100).toFixed(2)}</cbc:Percent><cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>`
        : '',
      `    <cac:Item><cbc:Description>${esc(l.description)}</cbc:Description></cac:Item>`,
      `    <cac:Price><cbc:PriceAmount ${money(l.unitPrice)}</cbc:PriceAmount><cbc:BaseQuantity unitCode="94">1</cbc:BaseQuantity></cac:Price>`,
      `  </cac:${r.lineTag}>`,
    ]
      .filter(Boolean)
      .join('\n');
  });
  const isNote = doc.type === 'notaCredito' || doc.type === 'notaDebito';
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- XML de muestra generado en el navegador por el simulador de KopTup.',
    '     Estructura UBL 2.1 simplificada; sin firma digital, sin extensiones DIAN y sin validez fiscal.',
    '     En tu proyecto el XML completo lo genera y firma el sistema y lo transmite el proveedor tecnológico. -->',
    `<${r.root} xmlns="${r.ns}" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`,
    '  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>',
    `  <cbc:CustomizationID>${doc.type === 'notaCredito' ? '20' : doc.type === 'notaDebito' ? '30' : '10'}</cbc:CustomizationID>`,
    `  <cbc:ProfileExecutionID>${ENVIRONMENT_TEST}</cbc:ProfileExecutionID>`,
    `  <cbc:ID>${esc(doc.id)}</cbc:ID>`,
    `  <cbc:UUID schemeID="${ENVIRONMENT_TEST}" schemeName="${doc.type === 'factura' ? 'CUFE-SHA384' : 'CUDE-SHA384'}">${doc.cufe}</cbc:UUID>`,
    `  <cbc:IssueDate>${doc.issueDate}</cbc:IssueDate>`,
    `  <cbc:IssueTime>${doc.issueTime}</cbc:IssueTime>`,
    doc.dueDate ? `  <cbc:DueDate>${doc.dueDate}</cbc:DueDate>` : '',
    r.typeTag ? `  <cbc:${r.typeTag}>${r.typeCode}</cbc:${r.typeTag}>` : '',
    doc.note ? `  <cbc:Note>${esc(doc.note)}</cbc:Note>` : '',
    '  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>',
    `  <cbc:LineCountNumeric>${doc.lines.length}</cbc:LineCountNumeric>`,
    doc.type === 'factura'
      ? `  <!-- Resolución de numeración de ejemplo ${RESOLUTION.number} del ${RESOLUTION.date}, rango ${doc.prefix}${RESOLUTION.from} a ${doc.prefix}${RESOLUTION.to} -->`
      : '',
    isNote && ref
      ? [
          '  <cac:DiscrepancyResponse>',
          `    <cbc:ReferenceID>${esc(ref.id)}</cbc:ReferenceID>`,
          `    <cbc:ResponseCode>${doc.concept || ''}</cbc:ResponseCode>`,
          doc.note ? `    <cbc:Description>${esc(doc.note)}</cbc:Description>` : '',
          '  </cac:DiscrepancyResponse>',
          '  <cac:BillingReference>',
          '    <cac:InvoiceDocumentReference>',
          `      <cbc:ID>${esc(ref.id)}</cbc:ID>`,
          `      <cbc:UUID schemeName="CUFE-SHA384">${ref.cufe}</cbc:UUID>`,
          `      <cbc:IssueDate>${ref.issueDate}</cbc:IssueDate>`,
          '    </cac:InvoiceDocumentReference>',
          '  </cac:BillingReference>',
        ]
          .filter(Boolean)
          .join('\n')
      : '',
    '  <cac:AccountingSupplierParty>',
    '    <cbc:AdditionalAccountID>1</cbc:AdditionalAccountID>',
    party(issuer.name, issuer.nit, issuer.dv, '31', issuer.city, issuer.email),
    '  </cac:AccountingSupplierParty>',
    '  <cac:AccountingCustomerParty>',
    `    <cbc:AdditionalAccountID>${doc.client.idType === 'NIT' ? '1' : '2'}</cbc:AdditionalAccountID>`,
    party(doc.client.name, doc.client.idNumber, doc.client.dv, ID_SCHEME[doc.client.idType], doc.client.city, doc.client.email),
    '  </cac:AccountingCustomerParty>',
    '  <cac:PaymentMeans>',
    `    <cbc:ID>${doc.paymentForm === 'contado' ? '1' : '2'}</cbc:ID>`,
    `    <cbc:PaymentMeansCode>${PAYMENT_CODE[doc.paymentMethod]}</cbc:PaymentMeansCode>`,
    doc.dueDate ? `    <cbc:PaymentDueDate>${doc.dueDate}</cbc:PaymentDueDate>` : '',
    '  </cac:PaymentMeans>',
    taxSubtotals.length
      ? ['  <cac:TaxTotal>', `    <cbc:TaxAmount ${money(t.iva)}</cbc:TaxAmount>`, ...taxSubtotals, '  </cac:TaxTotal>'].join('\n')
      : '',
    `  <cac:${doc.type === 'notaDebito' ? 'RequestedMonetaryTotal' : 'LegalMonetaryTotal'}>`,
    `    <cbc:LineExtensionAmount ${money(t.subtotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount ${money(t.subtotal - t.byTax.excluido.base)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount ${money(t.total)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount ${money(t.total)}</cbc:PayableAmount>`,
    `  </cac:${doc.type === 'notaDebito' ? 'RequestedMonetaryTotal' : 'LegalMonetaryTotal'}>`,
    ...lines,
    `</${r.root}>`,
    '',
  ]
    .filter((s) => s !== '')
    .join('\n');
}

// ---------- CSV y descargas ----------

/** CSV separado por ";" (lo abre Excel en configuración regional de Colombia) con BOM UTF-8. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, mime: string) {
  downloadBlob(filename, new Blob([text], { type: `${mime};charset=utf-8` }));
}

/** "2026-10-08" → "8 oct 2026" con los meses del idioma activo. */
export function formatDate(iso: string, monthsShort: string[]): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${monthsShort[m - 1]} ${y}`;
}

/** Hora actual de Colombia (UTC−5) en formato HH:MM:SS, solo para acciones del usuario. */
export function colombiaNow(): { time: string } {
  const now = new Date(Date.now() - 5 * 3600000);
  return { time: now.toISOString().slice(11, 19) };
}
