/**
 * Historia de ejemplo (enero–septiembre de 2026) generada de forma
 * determinista: misma semilla → mismos datos en el servidor y en el navegador.
 * Simula día a día compras, ventas, recaudos, traslados, producción, gastos,
 * nómina e impuestos de un grupo empresarial ficticio.
 */
import {
  CUSTOMERS,
  CUSTOMER_BY_ID,
  EMPLOYEES,
  ITEMS,
  ITEM_BY_SKU,
  PAYROLL_EMPLOYER_FACTOR,
  PO_LEVEL2_THRESHOLD,
  SUPPLIER_BY_ID,
  WORK_DATE,
  explodeBom,
} from './catalog';
import { compute, docTotals, openingStock, poAmounts } from './engine';
import { addDays, lastDayOfMonth, norm, weekday } from './format';
import type {
  BankLine,
  CompanyId,
  DocLine,
  ErpState,
  Expense,
  ExpenseKind,
  Payroll,
  ProductionOrder,
  PurchaseOrder,
  Receipt,
  SaleDoc,
  SupplierPayment,
  TaxPayment,
  Transfer,
  Vacation,
  WarehouseId,
} from './types';

export const STATE_VERSION = 3;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pad = (n: number, w = 4) => String(n).padStart(w, '0');

/** Nombre como aparece en un extracto bancario. */
export function bankName(name: string) {
  return norm(name).toUpperCase().replace(/ S\.A\.S\.$/, '').replace(/\./g, '');
}

const EXPENSE_BANK_DESC: Record<ExpenseKind, string> = {
  rent: 'PAGO ARRIENDO BODEGAS',
  utilities: 'PAGO SERVICIOS PUBLICOS',
  maintenance: 'PAGO MANTENIMIENTO',
  depreciation: '',
  bankFee: 'COMISION SERVICIO PSE',
  gmf: 'GMF 4X1000',
  opCost: 'PAGO OPERACION LOGISTICA',
  unidentified: 'CONSIGNACION SIN REFERENCIA',
};

export function buildSeed(): ErpState {
  const rand = mulberry32(20260930);
  const r = (a: number, b: number) => a + rand() * (b - a);
  const ri = (a: number, b: number) => Math.floor(r(a, b + 1));
  const round10 = (n: number) => Math.round(n / 10) * 10;

  let seq = 1;
  const nextSeq = () => seq++;
  const counters: Record<string, number> = { SMV: 4001, MLG: 1201, COT: 2101, PED: 1801, NC: 101, RC: 1, OC: 1, CE: 1, TR: 1, OP: 1, CC: 1, NM: 1, IM: 1, AJ: 1, EX: 1 };
  const num = (k: string, w = 4) => `${k}-${pad(counters[k]++, w)}`;

  const stock: Record<string, Partial<Record<WarehouseId, number>>> = {};
  for (const o of openingStock()) (stock[o.sku] ||= {})[o.wh] = o.qty;
  const st = (sku: string, wh: WarehouseId) => stock[sku]?.[wh] || 0;
  const add = (sku: string, wh: WarehouseId, q: number) => {
    (stock[sku] ||= {})[wh] = Math.round((st(sku, wh) + q) * 100) / 100;
  };

  const sales: SaleDoc[] = [];
  const receipts: Receipt[] = [];
  const pos: PurchaseOrder[] = [];
  const payments: SupplierPayment[] = [];
  const transfers: Transfer[] = [];
  const production: ProductionOrder[] = [];
  const expenses: Expense[] = [];
  const payroll: Payroll[] = [];
  const taxes: TaxPayment[] = [];
  const bank: BankLine[] = [];

  const arrivals: Record<string, PurchaseOrder[]> = {};
  const finishes: Record<string, ProductionOrder[]> = {};
  const custPays: Record<string, { sale: SaleDoc; amount: number }[]> = {};
  const supPays: Record<string, PurchaseOrder[]> = {};
  const outflows: Record<string, number> = { com: 0, log: 0 };
  const logRevenue: Record<string, number> = {};
  const unmatchedReceipts: { sale: SaleDoc; amount: number; date: string }[] = [];

  const bankOut = (company: CompanyId, date: string, desc: string, amount: number, kind: NonNullable<BankLine['match']>['kind'], docId: string) => {
    bank.push({ id: `bk-${bank.length + 1}`, company, date, desc, amount: -amount, match: { kind, docId, by: 'seed' } });
    outflows[company] += amount;
  };

  const addExpense = (company: CompanyId, date: string, kind: ExpenseKind, amount: number) => {
    const ex: Expense = { id: `ex${expenses.length + 1}`, no: num('CC'), seq: nextSeq(), company, date, kind, amount: Math.round(amount) };
    expenses.push(ex);
    if (kind !== 'depreciation') bankOut(company, date, EXPENSE_BANK_DESC[kind], ex.amount, 'expense', ex.id);
  };

  const monthIdx = (d: string) => Number(d.slice(5, 7)) - 1;
  const priceIndex = (d: string) => 0.976 + 0.003 * monthIdx(d);
  const costIndex = (d: string) => 0.976 + 0.003 * monthIdx(d);

  const createPo = (date: string, supplierId: string, wh: WarehouseId, lines: DocLine[], opts: { receiveIn?: number; approve?: boolean } = {}) => {
    const po: PurchaseOrder = { id: `po${pos.length + 1}`, no: num('OC'), company: 'com', supplierId, warehouse: wh, lines, date, origin: 'seed', levels: 1, approvals: [], status: 'pending' };
    po.levels = poAmounts(po).total >= PO_LEVEL2_THRESHOLD ? 2 : 1;
    pos.push(po);
    if (opts.approve !== false) {
      po.approvals.push({ level: 1, date });
      if (po.levels === 2) po.approvals.push({ level: 2, date: addDays(date, weekday(date) === 5 ? 3 : 1) });
      po.status = 'approved';
      if (opts.receiveIn) (arrivals[addDays(date, opts.receiveIn)] ||= []).push(po);
    }
    return po;
  };

  const replenish = (date: string) => {
    const groups: Record<string, DocLine[]> = {};
    for (const it of ITEMS) {
      if (!it.supplierId) continue;
      for (const wh of Object.keys(it.target) as WarehouseId[]) {
        const target = it.target[wh]!;
        const inTransit = pos
          .filter((p) => p.status === 'approved' && p.warehouse === wh)
          .reduce((a, p) => a + p.lines.filter((l) => l.sku === it.sku).reduce((b, l) => b + l.qty, 0), 0);
        const have = st(it.sku, wh) + inTransit;
        if (have >= target * 0.6) continue;
        const qty = round10(target - have);
        if (qty <= 0) continue;
        const cost = Math.round(it.cost * costIndex(date) * r(0.992, 1.008));
        (groups[`${it.supplierId}|${wh}`] ||= []).push({ sku: it.sku, qty, price: cost, vat: it.vat });
      }
    }
    for (const [k, lines] of Object.entries(groups)) {
      const [sup, wh] = k.split('|');
      createPo(date, sup, wh as WarehouseId, lines, { receiveIn: ri(3, 6) });
    }
  };

  const sellable = ITEMS.filter((i) => i.kind === 'merch' || i.kind === 'finished');
  const comCustomers = CUSTOMERS.filter((c) => c.companies.includes('com'));
  const logCustomers = CUSTOMERS.filter((c) => c.companies.includes('log'));
  const custWeight: Record<string, number> = { C01: 5, C02: 4, C03: 2, C04: 3, C05: 4, C06: 2, C07: 3, C08: 3, C09: 1 };
  const pickCustomer = () => {
    const total = comCustomers.reduce((a, c) => a + (custWeight[c.id] || 1), 0);
    let x = rand() * total;
    for (const c of comCustomers) {
      x -= custWeight[c.id] || 1;
      if (x <= 0) return c;
    }
    return comCustomers[0];
  };

  const schedulePayment = (sale: SaleDoc) => {
    const c = CUSTOMER_BY_ID[sale.customerId];
    const delay = c.payer === 'punctual' ? ri(-8, 4) : c.payer === 'late' ? ri(5, 30) : ri(40, 120);
    const payDate = addDays(sale.dueDate!, delay);
    const amount = docTotals(sale.lines).total;
    if (payDate <= WORK_DATE) (custPays[payDate] ||= []).push({ sale, amount });
  };

  const invoice = (company: CompanyId, customerId: string, wh: WarehouseId, date: string, lines: DocLine[]) => {
    const c = CUSTOMER_BY_ID[customerId];
    const s: SaleDoc = {
      id: `s${sales.length + 1}`,
      company,
      customerId,
      warehouse: wh,
      lines,
      status: 'invoiced',
      quoteNo: num('COT'),
      quoteDate: addDays(date, -ri(1, 4)),
      orderNo: num('PED'),
      orderDate: addDays(date, -ri(0, 1)),
      invoiceNo: `${company === 'com' ? 'SMV' : 'MLG'}-${counters[company === 'com' ? 'SMV' : 'MLG']++}`,
      invoiceDate: date,
      invoiceSeq: nextSeq(),
      dueDate: addDays(date, c.termDays),
      dian: 'accepted',
    };
    for (const l of lines) if (ITEM_BY_SKU[l.sku].kind !== 'service') add(l.sku, wh, -l.qty);
    sales.push(s);
    schedulePayment(s);
    return s;
  };

  const lastBusinessDay = (ym: string) => {
    let d = lastDayOfMonth(ym);
    while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, -1);
    return d;
  };

  const replenishedOn: Record<string, boolean> = {};

  for (let d = '2026-01-01'; d <= WORK_DATE; d = addDays(d, 1)) {
    const wd = weekday(d);
    const business = wd >= 1 && wd <= 5;
    const ym = d.slice(0, 7);
    const day = Number(d.slice(8, 10));

    // Llegada de mercancía: se recibe y se causa la factura del proveedor
    for (const po of arrivals[d] || []) {
      po.status = 'received';
      po.receipt = { date: d, seq: nextSeq(), invoiceNo: `FE-${ri(10000, 98000)}`, source: 'xml' };
      for (const l of po.lines) add(l.sku, po.warehouse, l.qty);
      const term = SUPPLIER_BY_ID[po.supplierId].termDays;
      const payDate = addDays(d, term + ri(-2, 3));
      (supPays[payDate] ||= []).push(po);
    }

    // Producción terminada
    for (const op of finishes[d] || []) {
      op.status = 'done';
      op.finish = { date: d, seq: nextSeq() };
      add(op.sku, op.warehouse, op.qty);
    }

    // Recaudos de clientes
    for (const p of custPays[d] || []) {
      // Los últimos pagos de septiembre llegan al banco pero aún no se registran (para conciliar)
      if (d >= '2026-09-24' && unmatchedReceipts.length < 3) {
        unmatchedReceipts.push({ sale: p.sale, amount: p.amount, date: d });
        continue;
      }
      const method = rand() < 0.6 ? 'pse' : 'transfer';
      const rc: Receipt = { id: `rc${receipts.length + 1}`, no: num('RC'), seq: nextSeq(), company: p.sale.company, date: d, customerId: p.sale.customerId, saleId: p.sale.id, amount: p.amount, method };
      receipts.push(rc);
      const cname = bankName(CUSTOMER_BY_ID[rc.customerId].name);
      bank.push({ id: `bk-${bank.length + 1}`, company: rc.company, date: d, desc: method === 'pse' ? `PSE ${cname} REF ${p.sale.invoiceNo}` : `TRANSF ${cname} ${p.sale.invoiceNo}`, amount: p.amount, match: { kind: 'receipt', docId: rc.id, by: 'seed' } });
    }

    // Pagos a proveedores
    for (const po of supPays[d] || []) {
      const amount = poAmounts(po).payable;
      const p: SupplierPayment = { id: `ce${payments.length + 1}`, no: num('CE'), seq: nextSeq(), company: 'com', date: d, poId: po.id, supplierId: po.supplierId, amount };
      payments.push(p);
      bankOut('com', d, `PAGO PROV ${bankName(SUPPLIER_BY_ID[po.supplierId].name)} ${po.no}`, amount, 'payment', p.id);
    }

    if (business) {
      // Reposición: primer día hábil desde el 1 y desde el 15 de cada mes
      const slot = day >= 15 ? `${ym}-b` : `${ym}-a`;
      if (!replenishedOn[slot]) {
        replenishedOn[slot] = true;
        replenish(d);
      }

      // Traslados de producto terminado los lunes (Bogotá → Medellín / Barranquilla)
      if (wd === 1) {
        for (const it of ITEMS.filter((i) => i.kind === 'finished')) {
          for (const wh of ['med', 'baq'] as WarehouseId[]) {
            const need = it.target[wh]! - st(it.sku, wh);
            if (st(it.sku, wh) >= it.target[wh]! * 0.6) continue;
            const avail = st(it.sku, 'bog') - it.reorder.bog! * 0.5;
            const qty = round10(Math.min(need, avail));
            if (qty < 100) continue;
            transfers.push({ id: `tr${transfers.length + 1}`, no: num('TR'), seq: nextSeq(), date: d, sku: it.sku, qty, from: 'bog', to: wh });
            add(it.sku, 'bog', -qty);
            add(it.sku, wh, qty);
          }
        }
      }

      // Producción los miércoles (tostión de café y empaque de panela en Bogotá)
      if (wd === 3 && d < '2026-09-28') {
        for (const it of ITEMS.filter((i) => i.kind === 'finished')) {
          if (st(it.sku, 'bog') >= it.target.bog! * 0.7) continue;
          let qty = Math.round((it.target.bog! * 1.2) / 50) * 50;
          for (const c of explodeBom(it.sku)) qty = Math.min(qty, Math.floor(st(c.sku, 'bog') / c.qty / 50) * 50);
          if (qty < 100) continue;
          const op: ProductionOrder = { id: `op${production.length + 1}`, no: num('OP'), sku: it.sku, qty, warehouse: 'bog', status: 'inProgress', date: d, start: { date: d, seq: nextSeq() } };
          for (const c of explodeBom(it.sku)) add(c.sku, 'bog', -Math.round(c.qty * qty * 100) / 100);
          production.push(op);
          (finishes[addDays(d, 2)] ||= []).push(op);
        }
      }

      // Facturación de Surtidora Montevera (1 o 2 facturas por día hábil)
      const n = rand() < 0.15 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const c = pickCustomer();
        const wh = c.warehouse;
        const count = ri(3, 5);
        const chosen: typeof sellable = [];
        while (chosen.length < count) {
          const it = sellable[Math.floor(rand() * sellable.length)];
          if (!chosen.includes(it)) chosen.push(it);
        }
        const lines: DocLine[] = [];
        for (const it of chosen) {
          const want = round10(it.target[wh]! * r(0.1, 0.24));
          const cap = Math.floor((st(it.sku, wh) * 0.7) / 10) * 10;
          const qty = Math.min(want, cap);
          if (qty < 10) continue;
          lines.push({ sku: it.sku, qty, price: round10(it.price * priceIndex(d)), vat: it.vat });
        }
        if (lines.length) invoice('com', c.id, wh, d, lines);
      }

      // Montevera Logística factura sus servicios los lunes
      if (wd === 1) {
        const c = logCustomers[Math.floor(rand() * logCustomers.length)];
        const lines: DocLine[] = [
          { sku: 'SRV-ALM', qty: ri(30, 60) * 10, price: round10(ITEM_BY_SKU['SRV-ALM'].price * priceIndex(d)), vat: 19 },
          { sku: 'SRV-ALI', qty: ri(150, 300) * 10, price: round10(ITEM_BY_SKU['SRV-ALI'].price * priceIndex(d)), vat: 19 },
        ];
        const s = invoice('log', c.id, 'bog', d, lines);
        logRevenue[ym] = (logRevenue[ym] || 0) + docTotals(s.lines).subtotal;
      }

      // Impuestos: IVA bimestral y retención mensual (día hábil desde el 12)
      if (day >= 12 && day <= 16 && !replenishedOn[`${ym}-tax`]) {
        replenishedOn[`${ym}-tax`] = true;
        const m = monthIdx(d) + 1;
        const prevEnd = lastDayOfMonth(m === 1 ? '2025-12' : `2026-${String(m - 1).padStart(2, '0')}`);
        for (const company of ['com', 'log'] as CompanyId[]) {
          if (m > 1) taxes.push({ id: `tx${taxes.length + 1}`, no: num('IM'), seq: nextSeq(), company, date: d, account: '2365', cutoff: prevEnd });
          if ([3, 5, 7, 9].includes(m)) taxes.push({ id: `tx${taxes.length + 1}`, no: num('IM'), seq: nextSeq(), company, date: d, account: '2408', cutoff: prevEnd });
        }
      }

      // Gastos del mes
      if (day >= 5 && !replenishedOn[`${ym}-rent`]) {
        replenishedOn[`${ym}-rent`] = true;
        addExpense('com', d, 'rent', 42_000_000);
        addExpense('log', d, 'rent', 24_000_000);
      }
      if (day >= 20 && !replenishedOn[`${ym}-util`]) {
        replenishedOn[`${ym}-util`] = true;
        addExpense('com', d, 'utilities', 7_800_000 * r(0.9, 1.1));
        addExpense('log', d, 'utilities', 3_100_000 * r(0.9, 1.1));
      }
      if (day >= 25 && !replenishedOn[`${ym}-mant`]) {
        replenishedOn[`${ym}-mant`] = true;
        addExpense('com', d, 'maintenance', 3_200_000 * r(0.7, 1.3));
      }
    }

    // Cierre de mes
    if (d === lastBusinessDay(ym)) {
      addExpense('log', d, 'opCost', (logRevenue[ym] || 0) * r(0.4, 0.45));
      // Nómina: la de septiembre ya está pagada, pero falta transmitir la nómina electrónica
      for (const company of ['com', 'log'] as CompanyId[]) {
        const staff = EMPLOYEES.filter((e) => e.company === company);
        const gross = staff.reduce((a, e) => a + e.salary, 0);
        const p: Payroll = { id: `nm${payroll.length + 1}`, no: num('NM'), seq: nextSeq(), company, month: ym, date: d, gross, headcount: staff.length, eStatus: ym < '2026-09' ? 'accepted' : 'pending' };
        payroll.push(p);
        bankOut(company, d, 'PAGO NOMINA Y PILA', Math.round(gross * (1 + PAYROLL_EMPLOYER_FACTOR)), 'payroll', p.id);
      }
    }
    if (d === lastDayOfMonth(ym)) {
      addExpense('com', d, 'depreciation', 4_000_000);
      addExpense('log', d, 'depreciation', 1_333_000);
      if (ym < '2026-09') {
        addExpense('com', d, 'bankFee', 420_000 * r(0.9, 1.1));
        addExpense('log', d, 'bankFee', 150_000 * r(0.9, 1.1));
        addExpense('com', d, 'gmf', outflows.com * 0.004);
        addExpense('log', d, 'gmf', outflows.log * 0.004);
      } else {
        // Septiembre: la comisión y el 4x1000 llegan en el extracto y se registran al conciliar
        bank.push({ id: `bk-${bank.length + 1}`, company: 'com', date: d, desc: 'COMISION SERVICIO PSE SEPTIEMBRE', amount: -Math.round(420_000 * r(0.9, 1.1)) });
        bank.push({ id: `bk-${bank.length + 1}`, company: 'com', date: d, desc: 'GMF 4X1000 SEPTIEMBRE', amount: -Math.round(outflows.com * 0.004) });
        bank.push({ id: `bk-${bank.length + 1}`, company: 'log', date: d, desc: 'GMF 4X1000 SEPTIEMBRE', amount: -Math.round(outflows.log * 0.004) });
      }
      outflows.com = 0;
      outflows.log = 0;
    }
  }

  // Pagos de clientes que llegaron al banco en septiembre y aún no están registrados
  unmatchedReceipts.forEach((u, i) => {
    const cname = bankName(CUSTOMER_BY_ID[u.sale.customerId].name);
    const desc = i === 1 ? `TRANSF ${cname}` : `PSE ${cname} REF ${u.sale.invoiceNo}`;
    bank.push({ id: `bk-${bank.length + 1}`, company: u.sale.company, date: u.date, desc, amount: u.amount });
  });
  bank.push({ id: `bk-${bank.length + 1}`, company: 'com', date: '2026-09-29', desc: 'CONSIGNACION SIN REFERENCIA', amount: 2_350_000 });

  // Documentos abiertos al 30 de septiembre (para que pruebes el flujo)
  const quoteLines = (wh: WarehouseId, wanted: [string, number][]) =>
    wanted
      .map(([sku, q]) => {
        const it = ITEM_BY_SKU[sku];
        const qty = Math.min(q, Math.floor((st(sku, wh) * 0.4) / 10) * 10);
        return { sku, qty, price: it.price, vat: it.vat };
      })
      .filter((l) => l.qty >= 10);
  sales.push({ id: `s${sales.length + 1}`, company: 'com', customerId: 'C01', warehouse: 'bog', lines: quoteLines('bog', [['ARR-5K', 400], ['ACE-3L', 240], ['CAF-500', 300], ['DET-3K', 120]]), status: 'quote', quoteNo: num('COT'), quoteDate: '2026-09-28' });
  sales.push({ id: `s${sales.length + 1}`, company: 'com', customerId: 'C05', warehouse: 'med', lines: quoteLines('med', [['LEN-500', 600], ['HAR-1K', 800], ['JAB-3', 300]]), status: 'quote', quoteNo: num('COT'), quoteDate: '2026-09-29' });
  sales.push({ id: `s${sales.length + 1}`, company: 'com', customerId: 'C08', warehouse: 'baq', lines: quoteLines('baq', [['AZU-25', 300], ['BOL-30', 500], ['ESP-6', 400]]), status: 'order', quoteNo: num('COT'), quoteDate: '2026-09-25', orderNo: num('PED'), orderDate: '2026-09-29' });
  sales.push({ id: `s${sales.length + 1}`, company: 'log', customerId: 'C10', warehouse: 'bog', lines: [{ sku: 'SRV-ALM', qty: 420, price: 42000, vat: 19 }, { sku: 'SRV-ALI', qty: 2100, price: 3200, vat: 19 }], status: 'quote', quoteNo: num('COT'), quoteDate: '2026-09-29' });

  const supplierLines = (wanted: [string, number][]) =>
    wanted.map(([sku, qty]) => ({ sku, qty, price: ITEM_BY_SKU[sku].cost, vat: ITEM_BY_SKU[sku].vat }));
  createPo('2026-09-29', 'S4', 'med', supplierLines([['LEN-500', 2000]]), { approve: false });
  const po2 = createPo('2026-09-28', 'S3', 'bog', supplierLines([['ACE-3L', 1500]]), { approve: false });
  po2.approvals.push({ level: 1, date: '2026-09-28' });
  const po3 = createPo('2026-09-25', 'S5', 'baq', supplierLines([['DET-3K', 500], ['LIM-1L', 1200]]), { approve: false });
  po3.approvals.push({ level: 1, date: '2026-09-25' });
  if (po3.levels === 2) po3.approvals.push({ level: 2, date: '2026-09-26' });
  po3.status = 'approved';

  production.push({ id: `op${production.length + 1}`, no: num('OP'), sku: 'CAF-500', qty: 1500, warehouse: 'bog', status: 'planned', date: '2026-09-29' });

  const vacations: Vacation[] = [
    { id: 'v1', employeeId: 'E06', from: '2026-09-21', to: '2026-10-02', days: 10, status: 'approved' },
    { id: 'v2', employeeId: 'E07', from: '2026-10-13', to: '2026-10-23', days: 9, status: 'pending' },
    { id: 'v3', employeeId: 'E12', from: '2026-10-19', to: '2026-10-30', days: 10, status: 'pending' },
    { id: 'v4', employeeId: 'E19', from: '2026-11-03', to: '2026-11-13', days: 9, status: 'pending' },
    { id: 'v5', employeeId: 'E13', from: '2026-08-10', to: '2026-08-21', days: 10, status: 'approved' },
  ];

  const state: ErpState = {
    v: STATE_VERSION,
    seq,
    counters,
    sales,
    receipts,
    pos,
    payments,
    transfers,
    production,
    expenses,
    payroll,
    taxes,
    vacations,
    bank,
    manual: [],
    visited: {},
  };

  // Los pagos de impuestos se calculan con el saldo contable: se agregan al extracto ya conciliados
  const c = compute(state);
  for (const e of c.entries) {
    if (e.source !== 'tax') continue;
    const amount = e.lines.find((l) => l.account === '1110')?.credit || 0;
    const tx = taxes.find((t) => t.id === e.sourceId)!;
    bank.push({ id: `bk-${bank.length + 1}`, company: e.company, date: e.date, desc: tx.account === '2408' ? 'PAGO DIAN IVA' : 'PAGO DIAN RETENCION', amount: -amount, match: { kind: 'tax', docId: tx.id, by: 'seed' } });
  }
  bank.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return state;
}
