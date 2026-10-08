/** Criterios de búsqueda compartidos por los módulos y por el buscador global. */
import { CUSTOMER_BY_ID, EMPLOYEES, ITEMS, ITEM_BY_SKU, SUPPLIER_BY_ID } from './catalog';
import type { Computed } from './engine';
import { inCompany } from './engine';
import { matches } from './format';
import type { BankLine, CompanyFilter, Entry, ErpState, ModuleId, ProductionOrder, PurchaseOrder, SaleDoc } from './types';

export const saleMatches = (s: SaleDoc, q: string) => {
  const c = CUSTOMER_BY_ID[s.customerId];
  return matches(q, s.quoteNo, s.orderNo, s.invoiceNo, s.creditNote?.no, c?.name, c?.nit, c?.city, ...s.lines.map((l) => l.sku));
};

export const itemMatches = (sku: string, q: string) => {
  const it = ITEM_BY_SKU[sku];
  return matches(q, it.sku, it.name, it.nameEn);
};

export const poMatches = (p: PurchaseOrder, q: string) => {
  const s = SUPPLIER_BY_ID[p.supplierId];
  return matches(q, p.no, s?.name, s?.nit, p.receipt?.invoiceNo, ...p.lines.map((l) => l.sku));
};

export const entryMatches = (e: Entry, q: string, descText: string) => matches(q, e.no, descText, ...e.lines.map((l) => l.account), ...e.lines.map((l) => l.third));

export const bankMatches = (b: BankLine, q: string) => matches(q, b.desc);

export const opMatches = (o: ProductionOrder, q: string) => {
  const it = ITEM_BY_SKU[o.sku];
  return matches(q, o.no, it.sku, it.name, it.nameEn);
};

const inRange = (d: string | undefined, r: { start: string; end: string }) => !!d && d >= r.start && d <= r.end;

/** Fecha con la que cada documento de venta aparece en la lista (según su estado). */
export const saleListDate = (s: SaleDoc) => (s.status === 'invoiced' ? s.invoiceDate! : s.status === 'order' ? s.orderDate! : s.quoteDate);

/** Conteos por módulo con los mismos filtros (empresa y período) que aplican las listas. */
export function searchCounts(state: ErpState, computed: Computed, q: string, company: CompanyFilter, r: { start: string; end: string }, descOf: (e: Entry) => string): Partial<Record<ModuleId, number>> {
  if (!q.trim()) return {};
  const out: Partial<Record<ModuleId, number>> = {};
  out.sales = state.sales.filter((s) => inCompany(s.company, company) && (inRange(saleListDate(s), r) || inRange(s.creditNote?.date, r)) && saleMatches(s, q)).length;
  out.inventory = company === 'log' ? 0 : ITEMS.filter((i) => i.kind !== 'service' && itemMatches(i.sku, q)).length;
  out.purchases = company === 'log' ? 0 : state.pos.filter((p) => (inRange(p.date, r) || inRange(p.receipt?.date, r)) && poMatches(p, q)).length;
  out.accounting = computed.entries.filter((e) => inCompany(e.company, company) && inRange(e.date, r) && entryMatches(e, q, descOf(e))).length;
  out.finance = state.bank.filter((b) => inCompany(b.company, company) && inRange(b.date, r) && bankMatches(b, q)).length;
  out.hr = EMPLOYEES.filter((e) => inCompany(e.company, company) && matches(q, e.name, e.position, e.positionEn, e.city)).length;
  out.manufacturing = company === 'log' ? 0 : state.production.filter((o) => (o.status !== 'done' || inRange(o.date, r) || inRange(o.finish?.date, r)) && opMatches(o, q)).length;
  return out;
}
