/**
 * Factura del proveedor en XML (estructura UBL 2.1 simplificada, como la de la
 * factura electrónica colombiana). Se genera un ejemplo para cada OC y se lee
 * en el navegador con DOMParser: el archivo no se envía a ningún servidor.
 */
import { COMPANIES, ITEM_BY_SKU, SUPPLIER_BY_ID } from './catalog';
import { docTotals, lineSubtotal } from './engine';
import { nitDv } from './format';
import type { PurchaseOrder } from './types';

export interface ParsedInvoice {
  invoiceNo: string;
  issueDate: string;
  supplierNit: string;
  supplierName: string;
  orderRef: string;
  subtotal: number;
  vat: number;
  total: number;
  lines: number;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function suggestedSupplierInvoice(po: PurchaseOrder) {
  const n = Number(po.no.replace(/\D/g, '')) || 1;
  return `FE-${48000 + n * 7}`;
}

export function buildSampleXml(po: PurchaseOrder, invoiceNo: string, issueDate: string) {
  const s = SUPPLIER_BY_ID[po.supplierId];
  const t = docTotals(po.lines);
  const lines = po.lines
    .map(
      (l, i) => `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${ITEM_BY_SKU[l.sku].unit === 'kg' ? 'KGM' : '94'}">${l.qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${lineSubtotal(l)}</cbc:LineExtensionAmount>
    <cac:TaxTotal><cbc:TaxAmount currencyID="COP">${Math.round((lineSubtotal(l) * l.vat) / 100)}</cbc:TaxAmount></cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${esc(ITEM_BY_SKU[l.sku].name)}</cbc:Description>
      <cac:SellersItemIdentification><cbc:ID>${l.sku}</cbc:ID></cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="COP">${l.price}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Documento de EJEMPLO generado por la demo ERP de KopTup. No es una factura real ni tiene validez ante la DIAN. -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:ID>${esc(invoiceNo)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${po.lines.length}</cbc:LineCountNumeric>
  <cac:OrderReference><cbc:ID>${po.no}</cbc:ID></cac:OrderReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${esc(s.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeID="${nitDv(s.nit)}" schemeName="31">${s.nit}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${esc(COMPANIES.com.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeID="${nitDv(COMPANIES.com.nit)}" schemeName="31">${COMPANIES.com.nit}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${t.vat}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${t.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${t.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${t.total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${t.total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>
`;
}

function child(el: Element, name: string) {
  return Array.from(el.children).find((c) => c.localName === name) || null;
}

function path(el: Element | null, ...names: string[]) {
  let cur: Element | null = el;
  for (const n of names) {
    if (!cur) return null;
    cur = child(cur, n);
  }
  return cur;
}

const num = (el: Element | null) => (el ? Number((el.textContent || '').trim()) : NaN);

/** Lee la factura; devuelve null y una clave de error si no es una factura UBL. */
export function parseInvoiceXml(text: string): { ok: true; data: ParsedInvoice } | { ok: false; error: 'notXml' | 'notInvoice' | 'missing' } {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(text, 'application/xml');
  } catch {
    return { ok: false, error: 'notXml' };
  }
  if (doc.getElementsByTagName('parsererror').length) return { ok: false, error: 'notXml' };
  const root = doc.documentElement;
  if (!root || root.localName !== 'Invoice') return { ok: false, error: 'notInvoice' };
  const supplier = path(root, 'AccountingSupplierParty', 'Party', 'PartyTaxScheme');
  const totals = child(root, 'LegalMonetaryTotal');
  const data: ParsedInvoice = {
    invoiceNo: (child(root, 'ID')?.textContent || '').trim(),
    issueDate: (child(root, 'IssueDate')?.textContent || '').trim(),
    supplierNit: (supplier && child(supplier, 'CompanyID')?.textContent?.trim()) || '',
    supplierName: (supplier && child(supplier, 'RegistrationName')?.textContent?.trim()) || '',
    orderRef: (path(root, 'OrderReference', 'ID')?.textContent || '').trim(),
    subtotal: num(totals && child(totals, 'LineExtensionAmount')),
    vat: num(path(root, 'TaxTotal', 'TaxAmount')),
    total: num(totals && (child(totals, 'PayableAmount') || child(totals, 'TaxInclusiveAmount'))),
    lines: Array.from(root.children).filter((c) => c.localName === 'InvoiceLine').length,
  };
  if (!data.invoiceNo || !Number.isFinite(data.total)) return { ok: false, error: 'missing' };
  if (!Number.isFinite(data.vat)) data.vat = 0;
  if (!Number.isFinite(data.subtotal)) data.subtotal = data.total - data.vat;
  return { ok: true, data };
}
