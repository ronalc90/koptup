/**
 * Motor de la demo: a partir de los documentos (ventas, compras, recaudos,
 * traslados, producción, nómina…) calcula los movimientos de inventario con
 * costo promedio ponderado y los asientos contables por partida doble. Todos
 * los informes (KPIs, estados financieros, cartera, kardex) salen de aquí, por
 * eso cuadran entre sí y cambian cuando haces una operación.
 */
import {
  COST_ACCOUNT,
  CUSTOMER_BY_ID,
  EXPENSE_ACCOUNT,
  INVENTORY_ACCOUNT,
  ITEMS,
  ITEM_BY_SKU,
  PAYROLL_BENEFITS_FACTOR,
  PAYROLL_EMPLOYER_FACTOR,
  PURCHASE_WITHHOLDING,
  REVENUE_ACCOUNT,
  SUPPLIER_BY_ID,
  explodeBom,
} from './catalog';
import { addDays, diffDays, lastDayOfMonth } from './format';
import type {
  CompanyFilter,
  CompanyId,
  DocLine,
  Entry,
  EntryLine,
  ErpState,
  Movement,
  PeriodId,
  PurchaseOrder,
  SaleDoc,
  WarehouseId,
} from './types';

export const OPENING_DATE = '2025-12-31';

// ---------------- Totales de documentos ----------------

export function lineSubtotal(l: DocLine) {
  return Math.round(l.qty * l.price);
}

export function docTotals(lines: DocLine[]) {
  let subtotal = 0;
  let vat = 0;
  for (const l of lines) {
    const s = lineSubtotal(l);
    subtotal += s;
    vat += Math.round((s * l.vat) / 100);
  }
  return { subtotal, vat, total: subtotal + vat };
}

export function poAmounts(po: Pick<PurchaseOrder, 'lines'>) {
  const t = docTotals(po.lines);
  const withholding = Math.round(t.subtotal * PURCHASE_WITHHOLDING);
  return { ...t, withholding, payable: t.total - withholding };
}

/** Existencias iniciales (saldo al 31 dic 2025): 75 % del máximo de cada bodega. */
export function openingStock() {
  const out: { sku: string; wh: WarehouseId; qty: number; cost: number }[] = [];
  for (const it of ITEMS) {
    for (const [wh, target] of Object.entries(it.target) as [WarehouseId, number][]) {
      out.push({ sku: it.sku, wh, qty: Math.round((target * 0.75) / 10) * 10, cost: it.cost });
    }
  }
  return out;
}

const OPENING_BALANCES: Record<CompanyId, { account: string; amount: number }[]> = {
  com: [
    { account: '1105', amount: 3_500_000 },
    { account: '1110', amount: 420_000_000 },
    { account: '1524', amount: 85_000_000 },
    { account: '1540', amount: 310_000_000 },
    { account: '1592', amount: -96_000_000 },
    { account: '3105', amount: -500_000_000 },
  ],
  log: [
    { account: '1105', amount: 1_200_000 },
    { account: '1110', amount: 180_000_000 },
    { account: '1520', amount: 160_000_000 },
    { account: '1592', amount: -40_000_000 },
    { account: '3105', amount: -200_000_000 },
  ],
};

// ---------------- Cálculo principal ----------------

export interface Computed {
  movements: Movement[];
  entries: Entry[];
  /** Costo unitario con el que salió cada línea de una factura (para devoluciones). */
  saleCost: Record<string, number[]>;
  receiptsBySale: Record<string, { date: string; amount: number }[]>;
  paymentsByPo: Record<string, { date: string; amount: number }[]>;
  /** Asientos que nacieron de cada documento. */
  entriesBySource: Record<string, Entry[]>;
}

type Ev = { date: string; seq: number; run: () => void };

export function compute(state: ErpState): Computed {
  const movements: Movement[] = [];
  const entries: Entry[] = [];
  const saleCost: Record<string, number[]> = {};
  const prodValue: Record<string, number> = {};
  const qtyBySku: Record<string, number> = {};
  const valBySku: Record<string, number> = {};
  const lastCost: Record<string, number> = {};
  for (const it of ITEMS) {
    qtyBySku[it.sku] = 0;
    valBySku[it.sku] = 0;
    lastCost[it.sku] = it.cost;
  }

  const avg = (sku: string) => (qtyBySku[sku] > 0.0001 ? valBySku[sku] / qtyBySku[sku] : lastCost[sku]);

  const moveIn = (date: string, seq: number, sku: string, wh: WarehouseId, qty: number, unitCost: number, doc: string, kind: Movement['kind']) => {
    const value = Math.round(qty * unitCost);
    qtyBySku[sku] += qty;
    valBySku[sku] += value;
    lastCost[sku] = unitCost;
    movements.push({ date, seq, sku, wh, qty, unitCost, value, doc, kind });
    return value;
  };
  const moveOut = (date: string, seq: number, sku: string, wh: WarehouseId, qty: number, doc: string, kind: Movement['kind']) => {
    const unitCost = avg(sku);
    const value = Math.round(qty * unitCost);
    qtyBySku[sku] -= qty;
    valBySku[sku] -= value;
    if (qtyBySku[sku] <= 0.0001) {
      qtyBySku[sku] = Math.max(0, qtyBySku[sku]);
      valBySku[sku] = 0;
    }
    movements.push({ date, seq, sku, wh, qty: -qty, unitCost, value: -value, doc, kind });
    return { value, unitCost };
  };

  const push = (e: Omit<Entry, 'lines'> & { lines: EntryLine[] }) => {
    const lines = e.lines.filter((l) => Math.round(l.debit) !== 0 || Math.round(l.credit) !== 0);
    entries.push({ ...e, lines: lines.map((l) => ({ ...l, debit: Math.round(l.debit), credit: Math.round(l.credit) })) });
  };

  const sumBy = (map: Record<string, number>, key: string, v: number) => {
    map[key] = (map[key] || 0) + v;
  };

  const evs: Ev[] = [];

  // Saldos iniciales
  evs.push({
    date: OPENING_DATE,
    seq: 0,
    run: () => {
      const invByCompany: Record<string, number> = {};
      for (const o of openingStock()) {
        const value = moveIn(OPENING_DATE, 0, o.sku, o.wh, o.qty, o.cost, 'SI-2025', 'opening');
        sumBy(invByCompany, INVENTORY_ACCOUNT[ITEM_BY_SKU[o.sku].kind], value);
      }
      (['com', 'log'] as CompanyId[]).forEach((company) => {
        const lines: EntryLine[] = OPENING_BALANCES[company].map((b) => ({
          account: b.account,
          debit: b.amount > 0 ? b.amount : 0,
          credit: b.amount < 0 ? -b.amount : 0,
        }));
        if (company === 'com') {
          for (const [acc, v] of Object.entries(invByCompany)) lines.push({ account: acc, debit: v, credit: 0 });
        }
        const d = lines.reduce((s, l) => s + l.debit - l.credit, 0);
        lines.push({ account: '3705', debit: d < 0 ? -d : 0, credit: d > 0 ? d : 0 });
        push({ id: `open-${company}`, no: 'SI-2025', date: OPENING_DATE, seq: 0, company, source: 'opening', sourceId: company, desc: { key: 'opening' }, lines });
      });
    },
  });

  // Ventas: factura y nota crédito
  for (const s of state.sales) {
    if (s.status !== 'invoiced' || !s.invoiceDate || !s.invoiceNo) continue;
    const customer = CUSTOMER_BY_ID[s.customerId]?.name || s.customerId;
    evs.push({
      date: s.invoiceDate,
      seq: s.invoiceSeq || 0,
      run: () => {
        const t = docTotals(s.lines);
        const rev: Record<string, number> = {};
        const cost: Record<string, number> = {};
        const inv: Record<string, number> = {};
        const unitCosts: number[] = [];
        for (const l of s.lines) {
          const it = ITEM_BY_SKU[l.sku];
          sumBy(rev, REVENUE_ACCOUNT[it.kind], lineSubtotal(l));
          if (it.kind === 'service') {
            unitCosts.push(0);
            continue;
          }
          const out = moveOut(s.invoiceDate!, s.invoiceSeq || 0, l.sku, s.warehouse, l.qty, s.invoiceNo!, 'sale');
          unitCosts.push(out.unitCost);
          sumBy(cost, COST_ACCOUNT[it.kind], out.value);
          sumBy(inv, INVENTORY_ACCOUNT[it.kind], out.value);
        }
        saleCost[s.id] = unitCosts;
        const lines: EntryLine[] = [{ account: '1305', debit: t.total, credit: 0, third: customer }];
        for (const [a, v] of Object.entries(rev)) lines.push({ account: a, debit: 0, credit: v });
        if (t.vat) lines.push({ account: '2408', debit: 0, credit: t.vat });
        for (const [a, v] of Object.entries(cost)) lines.push({ account: a, debit: v, credit: 0 });
        for (const [a, v] of Object.entries(inv)) lines.push({ account: a, debit: 0, credit: v });
        push({ id: `sale-${s.id}`, no: s.invoiceNo!, date: s.invoiceDate!, seq: s.invoiceSeq || 0, company: s.company, source: 'sale', sourceId: s.id, desc: { key: 'sale', params: { doc: s.invoiceNo!, third: customer } }, lines, user: s.user });
      },
    });
    if (s.creditNote) {
      const cn = s.creditNote;
      evs.push({
        date: cn.date,
        seq: cn.seq,
        run: () => {
          const t = docTotals(s.lines);
          const cost: Record<string, number> = {};
          const inv: Record<string, number> = {};
          s.lines.forEach((l, i) => {
            const it = ITEM_BY_SKU[l.sku];
            if (it.kind === 'service') return;
            const uc = saleCost[s.id]?.[i] ?? avg(l.sku);
            const v = moveIn(cn.date, cn.seq, l.sku, s.warehouse, l.qty, uc, cn.no, 'return');
            sumBy(cost, COST_ACCOUNT[it.kind], v);
            sumBy(inv, INVENTORY_ACCOUNT[it.kind], v);
          });
          const lines: EntryLine[] = [{ account: '4175', debit: t.subtotal, credit: 0 }];
          if (t.vat) lines.push({ account: '2408', debit: t.vat, credit: 0 });
          lines.push({ account: '1305', debit: 0, credit: t.total, third: customer });
          for (const [a, v] of Object.entries(inv)) lines.push({ account: a, debit: v, credit: 0 });
          for (const [a, v] of Object.entries(cost)) lines.push({ account: a, debit: 0, credit: v });
          push({ id: `cn-${s.id}`, no: cn.no, date: cn.date, seq: cn.seq, company: s.company, source: 'creditNote', sourceId: s.id, desc: { key: 'creditNote', params: { doc: cn.no, ref: s.invoiceNo!, third: customer } }, lines, user: s.user });
        },
      });
    }
  }

  // Recaudos
  const receiptsBySale: Computed['receiptsBySale'] = {};
  for (const r of state.receipts) {
    (receiptsBySale[r.saleId] ||= []).push({ date: r.date, amount: r.amount });
    const customer = CUSTOMER_BY_ID[r.customerId]?.name || r.customerId;
    const sale = state.sales.find((x) => x.id === r.saleId);
    evs.push({
      date: r.date,
      seq: r.seq,
      run: () =>
        push({
          id: `rc-${r.id}`,
          no: r.no,
          date: r.date,
          seq: r.seq,
          company: r.company,
          source: 'receipt',
          sourceId: r.id,
          desc: { key: `receipt_${r.method}`, params: { doc: sale?.invoiceNo || '', third: customer } },
          lines: [
            { account: '1110', debit: r.amount, credit: 0 },
            { account: '1305', debit: 0, credit: r.amount, third: customer },
          ],
          user: r.user,
        }),
    });
  }

  // Compras recibidas (entrada de almacén + causación de la factura del proveedor)
  for (const po of state.pos) {
    if (po.status !== 'received' || !po.receipt) continue;
    const rc = po.receipt;
    const supplier = SUPPLIER_BY_ID[po.supplierId]?.name || po.supplierId;
    evs.push({
      date: rc.date,
      seq: rc.seq,
      run: () => {
        const a = poAmounts(po);
        const inv: Record<string, number> = {};
        for (const l of po.lines) {
          const it = ITEM_BY_SKU[l.sku];
          moveIn(rc.date, rc.seq, l.sku, po.warehouse, l.qty, l.price, po.no, 'purchase');
          sumBy(inv, INVENTORY_ACCOUNT[it.kind], lineSubtotal(l));
        }
        const lines: EntryLine[] = [];
        for (const [acc, v] of Object.entries(inv)) lines.push({ account: acc, debit: v, credit: 0 });
        if (a.vat) lines.push({ account: '2408', debit: a.vat, credit: 0 });
        lines.push({ account: '2365', debit: 0, credit: a.withholding });
        lines.push({ account: '2205', debit: 0, credit: a.payable, third: supplier });
        push({ id: `po-${po.id}`, no: po.no, date: rc.date, seq: rc.seq, company: po.company, source: 'purchase', sourceId: po.id, desc: { key: 'purchase', params: { doc: po.no, ref: rc.invoiceNo, third: supplier } }, lines, user: po.user });
      },
    });
  }

  // Pagos a proveedores
  const paymentsByPo: Computed['paymentsByPo'] = {};
  for (const p of state.payments) {
    (paymentsByPo[p.poId] ||= []).push({ date: p.date, amount: p.amount });
    const supplier = SUPPLIER_BY_ID[p.supplierId]?.name || p.supplierId;
    const po = state.pos.find((x) => x.id === p.poId);
    evs.push({
      date: p.date,
      seq: p.seq,
      run: () =>
        push({
          id: `ce-${p.id}`,
          no: p.no,
          date: p.date,
          seq: p.seq,
          company: p.company,
          source: 'payment',
          sourceId: p.id,
          desc: { key: 'payment', params: { doc: po?.no || '', third: supplier } },
          lines: [
            { account: '2205', debit: p.amount, credit: 0, third: supplier },
            { account: '1110', debit: 0, credit: p.amount },
          ],
          user: p.user,
        }),
    });
  }

  // Traslados entre bodegas (sin efecto contable)
  for (const tr of state.transfers) {
    evs.push({
      date: tr.date,
      seq: tr.seq,
      run: () => {
        const out = moveOut(tr.date, tr.seq, tr.sku, tr.from, tr.qty, tr.no, 'transferOut');
        moveIn(tr.date, tr.seq, tr.sku, tr.to, tr.qty, out.unitCost, tr.no, 'transferIn');
      },
    });
  }

  // Producción
  for (const op of state.production) {
    if (op.start) {
      const st = op.start;
      evs.push({
        date: st.date,
        seq: st.seq,
        run: () => {
          let total = 0;
          for (const c of explodeBom(op.sku)) {
            const q = Math.round(c.qty * op.qty * 100) / 100;
            total += moveOut(st.date, st.seq, c.sku, op.warehouse, q, op.no, 'prodOut').value;
          }
          prodValue[op.id] = total;
          push({ id: `ops-${op.id}`, no: op.no, date: st.date, seq: st.seq, company: 'com', source: 'prodStart', sourceId: op.id, desc: { key: 'prodStart', params: { doc: op.no, item: op.sku } }, lines: [{ account: '1410', debit: total, credit: 0 }, { account: '1405', debit: 0, credit: total }], user: op.user });
        },
      });
    }
    if (op.finish) {
      const fi = op.finish;
      evs.push({
        date: fi.date,
        seq: fi.seq,
        run: () => {
          const total = prodValue[op.id] || 0;
          moveIn(fi.date, fi.seq, op.sku, op.warehouse, op.qty, total / op.qty, op.no, 'prodIn');
          push({ id: `opf-${op.id}`, no: op.no, date: fi.date, seq: fi.seq, company: 'com', source: 'prodFinish', sourceId: op.id, desc: { key: 'prodFinish', params: { doc: op.no, item: op.sku } }, lines: [{ account: '1430', debit: total, credit: 0 }, { account: '1410', debit: 0, credit: total }], user: op.user });
        },
      });
    }
  }

  // Gastos y movimientos bancarios
  for (const ex of state.expenses) {
    evs.push({
      date: ex.date,
      seq: ex.seq,
      run: () => {
        let lines: EntryLine[];
        if (ex.kind === 'unidentified') {
          lines = [
            { account: '1110', debit: ex.amount, credit: 0 },
            { account: '2805', debit: 0, credit: ex.amount },
          ];
        } else if (ex.kind === 'depreciation') {
          lines = [
            { account: '5160', debit: ex.amount, credit: 0 },
            { account: '1592', debit: 0, credit: ex.amount },
          ];
        } else {
          lines = [
            { account: EXPENSE_ACCOUNT[ex.kind], debit: ex.amount, credit: 0 },
            { account: '1110', debit: 0, credit: ex.amount },
          ];
        }
        push({ id: `ex-${ex.id}`, no: ex.no, date: ex.date, seq: ex.seq, company: ex.company, source: 'expense', sourceId: ex.id, desc: { key: `exp_${ex.kind}`, params: { month: ex.date.slice(0, 7) } }, lines, user: ex.user });
      },
    });
  }

  // Nómina (causación y pago en un solo comprobante resumen)
  for (const p of state.payroll) {
    evs.push({
      date: p.date,
      seq: p.seq,
      run: () => {
        const employer = p.gross * PAYROLL_EMPLOYER_FACTOR;
        const benefits = p.gross * PAYROLL_BENEFITS_FACTOR;
        const paid = Math.round(p.gross + employer);
        const prov = Math.round(benefits);
        push({
          id: `nm-${p.id}`,
          no: p.no,
          date: p.date,
          seq: p.seq,
          company: p.company,
          source: 'payroll',
          sourceId: p.id,
          desc: { key: 'payroll', params: { month: p.month } },
          lines: [
            { account: '5105', debit: paid + prov, credit: 0 },
            { account: '2610', debit: 0, credit: prov },
            { account: '1110', debit: 0, credit: paid },
          ],
          user: p.user,
        });
      },
    });
  }

  // Pago de impuestos: se paga el saldo de la cuenta a la fecha de corte
  for (const tx of state.taxes) {
    evs.push({
      date: tx.date,
      seq: tx.seq,
      run: () => {
        let bal = 0;
        for (const e of entries) {
          if (e.company !== tx.company || e.date > tx.cutoff) continue;
          for (const l of e.lines) if (l.account === tx.account) bal += l.credit - l.debit;
        }
        if (bal <= 0) return;
        push({
          id: `tx-${tx.id}`,
          no: tx.no,
          date: tx.date,
          seq: tx.seq,
          company: tx.company,
          source: 'tax',
          sourceId: tx.id,
          desc: { key: tx.account === '2408' ? 'taxVat' : 'taxWithholding', params: { month: tx.cutoff.slice(0, 7) } },
          lines: [
            { account: tx.account, debit: bal, credit: 0 },
            { account: '1110', debit: 0, credit: bal },
          ],
        });
      },
    });
  }

  // Asientos manuales
  for (const m of state.manual) {
    evs.push({
      date: m.date,
      seq: m.seq,
      run: () => push({ id: `aj-${m.id}`, no: m.no, date: m.date, seq: m.seq, company: m.company, source: 'manual', sourceId: m.id, desc: { text: m.desc }, lines: m.lines, user: true }),
    });
  }

  evs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq));
  for (const ev of evs) ev.run();

  const entriesBySource: Record<string, Entry[]> = {};
  for (const e of entries) (entriesBySource[e.sourceId] ||= []).push(e);

  return { movements, entries, saleCost, receiptsBySale, paymentsByPo, entriesBySource };
}

// ---------------- Períodos ----------------

export interface Range {
  start: string;
  end: string;
}

export function periodRange(p: PeriodId): Range & { prev?: Range; months: string[] } {
  switch (p) {
    case '2026-09':
      return { start: '2026-09-01', end: '2026-09-30', prev: { start: '2026-08-01', end: '2026-08-31' }, months: ['2026-09'] };
    case '2026-08':
      return { start: '2026-08-01', end: '2026-08-31', prev: { start: '2026-07-01', end: '2026-07-31' }, months: ['2026-08'] };
    case '2026-07':
      return { start: '2026-07-01', end: '2026-07-31', prev: { start: '2026-06-01', end: '2026-06-30' }, months: ['2026-07'] };
    case 'q3':
      return { start: '2026-07-01', end: '2026-09-30', prev: { start: '2026-04-01', end: '2026-06-30' }, months: ['2026-07', '2026-08', '2026-09'] };
    case 'ytd':
    default:
      return { start: '2026-01-01', end: '2026-09-30', months: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'] };
  }
}

export function inCompany(c: CompanyId, f: CompanyFilter) {
  return f === 'all' || c === f;
}

/** Saldo (débito − crédito) de las cuentas que empiezan por los prefijos dados. */
export function balance(entries: Entry[], company: CompanyFilter, prefixes: string[], from: string | null, to: string) {
  let b = 0;
  for (const e of entries) {
    if (!inCompany(e.company, company)) continue;
    if (e.date > to || (from && e.date < from)) continue;
    for (const l of e.lines) if (prefixes.some((p) => l.account.startsWith(p))) b += l.debit - l.credit;
  }
  return b;
}

export interface Pnl {
  revenue: number;
  cogs: number;
  gross: number;
  opex: number;
  depreciation: number;
  operating: number;
  ebitda: number;
  nonOperating: number;
  preTax: number;
  tax: number;
  net: number;
}

export function pnl(entries: Entry[], company: CompanyFilter, r: Range, taxRate: number): Pnl {
  const revenue = -balance(entries, company, ['41'], r.start, r.end);
  const cogs = balance(entries, company, ['61'], r.start, r.end);
  const opex = balance(entries, company, ['51', '52'], r.start, r.end);
  const depreciation = balance(entries, company, ['5160'], r.start, r.end);
  const nonOperating = balance(entries, company, ['53'], r.start, r.end) + balance(entries, company, ['42'], r.start, r.end);
  const gross = revenue - cogs;
  const operating = gross - opex;
  const preTax = operating - nonOperating;
  const tax = preTax > 0 ? Math.round(preTax * taxRate) : 0;
  return { revenue, cogs, gross, opex, depreciation, operating, ebitda: operating + depreciation, nonOperating, preTax, tax, net: preTax - tax };
}

// ---------------- Cartera y cuentas por pagar ----------------

export interface OpenItem {
  id: string;
  doc: string;
  date: string;
  due: string;
  company: CompanyId;
  thirdId: string;
  total: number;
  open: number;
  daysOverdue: number;
}

export const AGING_BUCKETS = ['current', 'd30', 'd60', 'd90', 'd90plus'] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export function bucketOf(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'd30';
  if (daysOverdue <= 60) return 'd60';
  if (daysOverdue <= 90) return 'd90';
  return 'd90plus';
}

export function saleOpenAt(s: SaleDoc, c: Computed, cutoff: string) {
  if (s.status !== 'invoiced' || !s.invoiceDate || s.invoiceDate > cutoff) return 0;
  const total = docTotals(s.lines).total;
  if (s.creditNote && s.creditNote.date <= cutoff) return 0;
  const paid = (c.receiptsBySale[s.id] || []).filter((r) => r.date <= cutoff).reduce((a, r) => a + r.amount, 0);
  return Math.max(0, total - paid);
}

export function receivables(state: ErpState, c: Computed, company: CompanyFilter, cutoff: string): OpenItem[] {
  const out: OpenItem[] = [];
  for (const s of state.sales) {
    if (!inCompany(s.company, company)) continue;
    const open = saleOpenAt(s, c, cutoff);
    if (open <= 0) continue;
    out.push({
      id: s.id,
      doc: s.invoiceNo!,
      date: s.invoiceDate!,
      due: s.dueDate!,
      company: s.company,
      thirdId: s.customerId,
      total: docTotals(s.lines).total,
      open,
      daysOverdue: diffDays(cutoff, s.dueDate!),
    });
  }
  return out;
}

export function poOpenAt(po: PurchaseOrder, c: Computed, cutoff: string) {
  if (po.status !== 'received' || !po.receipt || po.receipt.date > cutoff) return 0;
  const paid = (c.paymentsByPo[po.id] || []).filter((p) => p.date <= cutoff).reduce((a, p) => a + p.amount, 0);
  return Math.max(0, poAmounts(po).payable - paid);
}

export function poDueDate(po: PurchaseOrder) {
  const term = SUPPLIER_BY_ID[po.supplierId]?.termDays ?? 30;
  return po.receipt ? addDays(po.receipt.date, term) : '';
}

export function payables(state: ErpState, c: Computed, company: CompanyFilter, cutoff: string): OpenItem[] {
  const out: OpenItem[] = [];
  for (const po of state.pos) {
    if (!inCompany(po.company, company)) continue;
    const open = poOpenAt(po, c, cutoff);
    if (open <= 0) continue;
    const due = poDueDate(po);
    out.push({ id: po.id, doc: po.no, date: po.receipt!.date, due, company: po.company, thirdId: po.supplierId, total: poAmounts(po).payable, open, daysOverdue: diffDays(cutoff, due) });
  }
  return out;
}

// ---------------- Inventario ----------------

export interface StockRow {
  sku: string;
  wh: WarehouseId;
  qty: number;
}

export interface Valuation {
  /** Existencias por SKU y bodega. */
  stock: Record<string, Partial<Record<WarehouseId, number>>>;
  /** Costo unitario por SKU (promedio ponderado). */
  avgCost: Record<string, number>;
  /** Valor por SKU con promedio ponderado y con PEPS. */
  valueAvg: Record<string, number>;
  valueFifo: Record<string, number>;
}

export function valuationAt(movs: Movement[], cutoff: string): Valuation {
  const stock: Valuation['stock'] = {};
  const qty: Record<string, number> = {};
  const val: Record<string, number> = {};
  const layers: Record<string, { qty: number; cost: number }[]> = {};
  const lastCost: Record<string, number> = {};
  for (const m of movs) {
    if (m.date > cutoff) break;
    const s = (stock[m.sku] ||= {});
    s[m.wh] = Math.round(((s[m.wh] || 0) + m.qty) * 100) / 100;
    if (m.kind === 'transferIn' || m.kind === 'transferOut') continue;
    qty[m.sku] = (qty[m.sku] || 0) + m.qty;
    val[m.sku] = (val[m.sku] || 0) + m.value;
    const L = (layers[m.sku] ||= []);
    if (m.qty > 0) {
      L.push({ qty: m.qty, cost: m.unitCost });
      lastCost[m.sku] = m.unitCost;
    } else {
      let rem = -m.qty;
      while (rem > 0.0001 && L.length) {
        const take = Math.min(rem, L[0].qty);
        L[0].qty -= take;
        rem -= take;
        if (L[0].qty <= 0.0001) L.shift();
      }
    }
  }
  const avgCost: Record<string, number> = {};
  const valueAvg: Record<string, number> = {};
  const valueFifo: Record<string, number> = {};
  for (const it of ITEMS) {
    if (it.kind === 'service') continue;
    const q = qty[it.sku] || 0;
    avgCost[it.sku] = q > 0.0001 ? val[it.sku] / q : lastCost[it.sku] ?? it.cost;
    valueAvg[it.sku] = q > 0.0001 ? Math.round(val[it.sku]) : 0;
    valueFifo[it.sku] = Math.round((layers[it.sku] || []).reduce((a, l) => a + l.qty * l.cost, 0));
  }
  return { stock, avgCost, valueAvg, valueFifo };
}

export function stockOf(v: Valuation, sku: string, wh: WarehouseId) {
  return v.stock[sku]?.[wh] || 0;
}

/** Último día de cada mes de una lista 'AAAA-MM'. */
export function monthEnds(months: string[]) {
  return months.map((m) => lastDayOfMonth(m));
}

/** Entradas y salidas de caja y bancos por mes. */
export function cashFlowByMonth(entries: Entry[], company: CompanyFilter, months: string[]) {
  const out = months.map((m) => ({ month: m, inflow: 0, outflow: 0 }));
  const idx: Record<string, number> = Object.fromEntries(months.map((m, i) => [m, i]));
  for (const e of entries) {
    if (e.source === 'opening' || !inCompany(e.company, company)) continue;
    const i = idx[e.date.slice(0, 7)];
    if (i === undefined) continue;
    for (const l of e.lines) {
      if (!l.account.startsWith('11')) continue;
      out[i].inflow += l.debit;
      out[i].outflow += l.credit;
    }
  }
  return out;
}

export interface TrialRow {
  account: string;
  opening: number;
  debit: number;
  credit: number;
  closing: number;
}

export function trialBalance(entries: Entry[], company: CompanyFilter, r: Range): TrialRow[] {
  const rows: Record<string, TrialRow> = {};
  for (const e of entries) {
    if (!inCompany(e.company, company) || e.date > r.end) continue;
    for (const l of e.lines) {
      const row = (rows[l.account] ||= { account: l.account, opening: 0, debit: 0, credit: 0, closing: 0 });
      if (e.date < r.start) row.opening += l.debit - l.credit;
      else {
        row.debit += l.debit;
        row.credit += l.credit;
      }
    }
  }
  return Object.values(rows)
    .map((r2) => ({ ...r2, closing: r2.opening + r2.debit - r2.credit }))
    .sort((a, b) => a.account.localeCompare(b.account));
}
