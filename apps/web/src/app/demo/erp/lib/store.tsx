'use client';

/**
 * Estado compartido de la demo: un solo reducer para todos los módulos, de modo
 * que lo que haces en Ventas se ve en Inventario, Contabilidad y Finanzas.
 * Se guarda en el navegador (localStorage) y se puede restablecer.
 *
 * La fecha de trabajo depende de hoy (lib/calendar.ts), así que los datos se
 * arman en el navegador después de montar: el servidor y el primer render del
 * navegador muestran el mismo marcador de carga (sin errores de hidratación).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { CUSTOMER_BY_ID, INVOICE_PREFIX, ITEM_BY_SKU, PO_LEVEL2_THRESHOLD, REFERENCE_WORK_DATE } from './catalog';
import { currentWorkDate, historyStartFor } from './calendar';
import { compute, docTotals, periodRange, poAmounts, poOpenAt, saleOpenAt, type Computed, type PeriodRange } from './engine';
import { addDays, fmtMonthLong } from './format';
import { STATE_VERSION, buildSeed, pad } from './seed';
import type {
  BankLine,
  CompanyFilter,
  CompanyId,
  CurrencyCode,
  DocLine,
  ErpState,
  Expense,
  Locale,
  ModuleId,
  PayMethod,
  PeriodId,
  PoOrigin,
  WarehouseId,
} from './types';

const STORAGE_KEY = 'koptup-demo-erp';

const seedCache = new Map<string, ErpState>();
/** Datos de ejemplo para una fecha de trabajo (se arman una sola vez por fecha). */
export function getSeed(workDate: string) {
  let s = seedCache.get(workDate);
  if (!s) {
    s = buildSeed(workDate);
    seedCache.set(workDate, s);
  }
  return s;
}

/**
 * Lee lo guardado en este navegador. La versión 3 (sin fecha de trabajo) era
 * siempre el cierre del 30 sep 2026: se conserva si esa sigue siendo la fecha
 * de trabajo. Si cambió el mes, lo guardado ya no aplica.
 */
export function restoreSaved(raw: string | null, workDate: string): { state: ErpState | null; stale: boolean } {
  if (!raw) return { state: null, stale: false };
  const parsed = JSON.parse(raw) as ErpState;
  if (!parsed || !Array.isArray(parsed.sales)) return { state: null, stale: false };
  if (parsed.v === 3 && !parsed.workDate) {
    parsed.v = STATE_VERSION;
    parsed.workDate = REFERENCE_WORK_DATE;
    parsed.startDate = historyStartFor(REFERENCE_WORK_DATE);
  }
  if (parsed.v !== STATE_VERSION) return { state: null, stale: false };
  if (parsed.workDate !== workDate) return { state: null, stale: true };
  // Lo que quedó "enviando" al cerrar la página se da por respondido
  parsed.sales = parsed.sales.map((s) => (s.dian === 'sending' ? { ...s, dian: 'accepted' } : s));
  parsed.payroll = parsed.payroll.map((p) => (p.eStatus === 'sending' ? { ...p, eStatus: 'accepted' } : p));
  return { state: parsed, stale: false };
}

type Action =
  | { type: 'hydrate'; state: ErpState }
  | { type: 'reset' }
  | { type: 'visit'; module: ModuleId }
  | { type: 'seenOwnEntry' }
  | { type: 'createQuote'; company: CompanyId; customerId: string; warehouse: WarehouseId; lines: DocLine[] }
  | { type: 'toOrder'; id: string }
  | { type: 'invoice'; id: string }
  | { type: 'dianAccepted'; id: string }
  | { type: 'receipt'; saleId: string; amount: number; method: PayMethod; bankLineId?: string }
  | { type: 'creditNote'; id: string }
  | { type: 'createPo'; supplierId: string; warehouse: WarehouseId; lines: DocLine[]; origin: PoOrigin }
  | { type: 'approvePo'; id: string; level: 1 | 2 }
  | { type: 'rejectPo'; id: string; reason: string }
  | { type: 'receivePo'; id: string; invoiceNo: string; source: 'xml' | 'manual' }
  | { type: 'payPo'; id: string }
  | { type: 'transfer'; sku: string; qty: number; from: WarehouseId; to: WarehouseId }
  | { type: 'createOp'; sku: string; qty: number }
  | { type: 'startOp'; id: string }
  | { type: 'finishOp'; id: string }
  | { type: 'vacation'; id: string; status: 'approved' | 'rejected' }
  | { type: 'transmitPayroll'; id: string }
  | { type: 'payrollAccepted'; id: string }
  | { type: 'bankExpense'; lineId: string; kind: 'bankFee' | 'gmf' | 'unidentified' }
  | { type: 'importBank'; company: CompanyId; lines: { date: string; desc: string; amount: number }[] }
  | { type: 'manualEntry'; company: CompanyId; desc: string; lines: { account: string; debit: number; credit: number }[] };

function bump(state: ErpState, key: string) {
  const n = state.counters[key] ?? 1;
  return { n, counters: { ...state.counters, [key]: n + 1 } };
}

function reducer(state: ErpState, a: Action): ErpState {
  // Las operaciones nuevas quedan con la fecha de trabajo (cierre del mes abierto)
  const WORK_DATE = state.workDate;
  switch (a.type) {
    case 'hydrate':
      return a.state;
    case 'reset':
      return getSeed(state.workDate);
    case 'visit':
      return state.visited[a.module] ? state : { ...state, visited: { ...state.visited, [a.module]: true } };
    case 'seenOwnEntry':
      return state.seenOwnEntry ? state : { ...state, seenOwnEntry: true };

    case 'createQuote': {
      const { n, counters } = bump(state, 'COT');
      const id = `u-s${state.seq}`;
      return {
        ...state,
        seq: state.seq + 1,
        counters,
        sales: [...state.sales, { id, company: a.company, customerId: a.customerId, warehouse: a.warehouse, lines: a.lines, status: 'quote', quoteNo: `COT-${pad(n)}`, quoteDate: WORK_DATE, user: true }],
      };
    }
    case 'toOrder': {
      const { n, counters } = bump(state, 'PED');
      return { ...state, counters, sales: state.sales.map((s) => (s.id === a.id && s.status === 'quote' ? { ...s, status: 'order', orderNo: `PED-${pad(n)}`, orderDate: WORK_DATE, user: true } : s)) };
    }
    case 'invoice': {
      const sale = state.sales.find((s) => s.id === a.id);
      if (!sale || sale.status === 'invoiced') return state;
      const prefix = INVOICE_PREFIX[sale.company];
      const { n, counters } = bump(state, prefix);
      const term = CUSTOMER_BY_ID[sale.customerId]?.termDays ?? 30;
      let c2 = counters;
      let orderNo = sale.orderNo;
      if (!orderNo) {
        const o = bump({ ...state, counters }, 'PED');
        c2 = o.counters;
        orderNo = `PED-${pad(o.n)}`;
      }
      return {
        ...state,
        seq: state.seq + 1,
        counters: c2,
        sales: state.sales.map((s) =>
          s.id === a.id
            ? { ...s, status: 'invoiced', orderNo, orderDate: s.orderDate || WORK_DATE, invoiceNo: `${prefix}-${n}`, invoiceDate: WORK_DATE, invoiceSeq: state.seq, dueDate: addDays(WORK_DATE, term), dian: 'sending', user: true }
            : s,
        ),
      };
    }
    case 'dianAccepted':
      return { ...state, sales: state.sales.map((s) => (s.id === a.id ? { ...s, dian: 'accepted' } : s)) };
    case 'receipt': {
      const sale = state.sales.find((s) => s.id === a.saleId);
      if (!sale) return state;
      const { n, counters } = bump(state, 'RC');
      const line = a.bankLineId ? state.bank.find((b) => b.id === a.bankLineId) : undefined;
      const id = `u-rc${state.seq}`;
      return {
        ...state,
        seq: state.seq + 1,
        counters,
        receipts: [...state.receipts, { id, no: `RC-${pad(n)}`, seq: state.seq, company: sale.company, date: line?.date || WORK_DATE, customerId: sale.customerId, saleId: sale.id, amount: Math.round(a.amount), method: a.method, user: true }],
        bank: line ? state.bank.map((b) => (b.id === line.id ? { ...b, match: { kind: 'receipt', docId: id, by: 'user' } } : b)) : state.bank,
      };
    }
    case 'creditNote': {
      const { n, counters } = bump(state, 'NC');
      return { ...state, seq: state.seq + 1, counters, sales: state.sales.map((s) => (s.id === a.id ? { ...s, creditNote: { no: `NC-${pad(n)}`, date: WORK_DATE, seq: state.seq }, user: true } : s)) };
    }

    case 'createPo': {
      const { n, counters } = bump(state, 'OC');
      const total = docTotals(a.lines).total;
      return {
        ...state,
        counters,
        pos: [...state.pos, { id: `u-po${state.seq}`, no: `OC-${pad(n)}`, company: 'com', supplierId: a.supplierId, warehouse: a.warehouse, lines: a.lines, date: WORK_DATE, origin: a.origin, levels: total >= PO_LEVEL2_THRESHOLD ? 2 : 1, approvals: [], status: 'pending', user: true }],
        seq: state.seq + 1,
      };
    }
    case 'approvePo':
      return {
        ...state,
        pos: state.pos.map((p) => {
          if (p.id !== a.id || p.status !== 'pending' || p.approvals.some((x) => x.level === a.level)) return p;
          const approvals = [...p.approvals, { level: a.level, date: WORK_DATE }];
          return { ...p, approvals, status: approvals.length >= p.levels ? 'approved' : 'pending', user: true };
        }),
      };
    case 'rejectPo':
      return { ...state, pos: state.pos.map((p) => (p.id === a.id ? { ...p, status: 'rejected', rejectReason: a.reason, user: true } : p)) };
    case 'receivePo':
      return {
        ...state,
        seq: state.seq + 1,
        pos: state.pos.map((p) => (p.id === a.id && p.status === 'approved' ? { ...p, status: 'received', receipt: { date: WORK_DATE, seq: state.seq, invoiceNo: a.invoiceNo, source: a.source }, user: true } : p)),
      };
    case 'payPo': {
      const po = state.pos.find((p) => p.id === a.id);
      if (!po) return state;
      const { n, counters } = bump(state, 'CE');
      const paid = state.payments.filter((p) => p.poId === po.id).reduce((s, p) => s + p.amount, 0);
      const amount = poAmounts(po).payable - paid;
      if (amount <= 0) return state;
      return { ...state, seq: state.seq + 1, counters, payments: [...state.payments, { id: `u-ce${state.seq}`, no: `CE-${pad(n)}`, seq: state.seq, company: po.company, date: WORK_DATE, poId: po.id, supplierId: po.supplierId, amount, user: true }] };
    }

    case 'transfer': {
      const { n, counters } = bump(state, 'TR');
      return { ...state, seq: state.seq + 1, counters, transfers: [...state.transfers, { id: `u-tr${state.seq}`, no: `TR-${pad(n)}`, seq: state.seq, date: WORK_DATE, sku: a.sku, qty: a.qty, from: a.from, to: a.to, user: true }] };
    }
    case 'createOp': {
      const { n, counters } = bump(state, 'OP');
      return { ...state, counters, production: [...state.production, { id: `u-op${state.seq}`, no: `OP-${pad(n)}`, sku: a.sku, qty: a.qty, warehouse: 'bog', status: 'planned', date: WORK_DATE, user: true }], seq: state.seq + 1 };
    }
    case 'startOp':
      return { ...state, seq: state.seq + 1, production: state.production.map((o) => (o.id === a.id && o.status === 'planned' ? { ...o, status: 'inProgress', start: { date: WORK_DATE, seq: state.seq }, user: true } : o)) };
    case 'finishOp':
      return { ...state, seq: state.seq + 1, production: state.production.map((o) => (o.id === a.id && o.status === 'inProgress' ? { ...o, status: 'done', finish: { date: WORK_DATE, seq: state.seq }, user: true } : o)) };

    case 'vacation':
      return { ...state, vacations: state.vacations.map((v) => (v.id === a.id ? { ...v, status: a.status, user: true } : v)) };
    case 'transmitPayroll':
      return { ...state, payroll: state.payroll.map((p) => (p.id === a.id ? { ...p, eStatus: 'sending', user: true } : p)) };
    case 'payrollAccepted':
      return { ...state, payroll: state.payroll.map((p) => (p.id === a.id ? { ...p, eStatus: 'accepted' } : p)) };

    case 'bankExpense': {
      const line = state.bank.find((b) => b.id === a.lineId);
      if (!line || line.match) return state;
      const { n, counters } = bump(state, 'CC');
      const ex: Expense = { id: `u-ex${state.seq}`, no: `CC-${pad(n)}`, seq: state.seq, company: line.company, date: line.date, kind: a.kind, amount: Math.abs(line.amount), user: true };
      return { ...state, seq: state.seq + 1, counters, expenses: [...state.expenses, ex], bank: state.bank.map((b) => (b.id === line.id ? { ...b, match: { kind: 'expense', docId: ex.id, by: 'user' } } : b)) };
    }
    case 'importBank': {
      const added: BankLine[] = a.lines.map((l, i) => ({ id: `u-bk${state.seq}-${i}`, company: a.company, date: l.date, desc: l.desc, amount: Math.round(l.amount), imported: true }));
      return { ...state, seq: state.seq + 1, bank: [...state.bank, ...added] };
    }
    case 'manualEntry': {
      const { n, counters } = bump(state, 'AJ');
      return { ...state, seq: state.seq + 1, counters, manual: [...state.manual, { id: `u-aj${state.seq}`, no: `AJ-${pad(n)}`, seq: state.seq, company: a.company, date: WORK_DATE, desc: a.desc, lines: a.lines }] };
    }
    default:
      return state;
  }
}

export interface Filters {
  company: CompanyFilter;
  currency: CurrencyCode;
  period: PeriodId;
  search: string;
}

interface Ctx {
  state: ErpState;
  computed: Computed;
  dispatch: (a: Action) => void;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  /** Fecha de trabajo: las operaciones nuevas quedan con esta fecha. */
  workDate: string;
  /** Fechas del período elegido en el filtro. */
  range: PeriodRange;
  module: ModuleId;
  goTo: (m: ModuleId, search?: string, scroll?: boolean) => void;
  locale: Locale;
  /** Acciones con efectos simulados (respuesta de la DIAN). */
  invoice: (id: string) => void;
  transmitPayroll: (id: string) => void;
  reset: () => void;
  /** Muestra el mes abierto (y lo avisa) si estabas viendo un mes anterior. */
  ensureOpenPeriod: () => boolean;
  /** Nombre del mes abierto ('septiembre de 2026'), para los avisos. */
  openMonthLabel: string;
}

const ErpContext = createContext<Ctx | null>(null);

interface Boot {
  state: ErpState;
  /** Había cambios guardados de un mes anterior y se descartaron. */
  stale: boolean;
}

/**
 * Arma los datos después de montar (dependen de la fecha de hoy) y, mientras
 * tanto, muestra `fallback`. Así el HTML del servidor y el primer render del
 * navegador son iguales.
 */
export function ErpProvider({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [boot, setBoot] = useState<Boot | null>(null);
  useEffect(() => {
    const workDate = currentWorkDate(Date.now());
    const seed = getSeed(workDate);
    let next: Boot = { state: seed, stale: false };
    try {
      // Lo guardado de otro mes no se borra aquí: lo reemplaza el guardado automático
      // (así, si el efecto corre dos veces en desarrollo, el aviso no se pierde)
      const saved = restoreSaved(window.localStorage.getItem(STORAGE_KEY), workDate);
      if (saved.state) next = { state: saved.state, stale: false };
      else if (saved.stale) next = { state: seed, stale: true };
    } catch {
      /* sin almacenamiento o datos dañados: se usan los datos de ejemplo */
    }
    setBoot(next);
  }, []);
  if (!boot) return <>{fallback}</>;
  return (
    <ErpStore initial={boot.state} stale={boot.stale}>
      {children}
    </ErpStore>
  );
}

function ErpStore({ initial, stale, children }: { initial: ErpState; stale: boolean; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [filters, setFiltersState] = useState<Filters>({ company: 'all', currency: 'COP', period: 'm0', search: '' });
  const [module, setModule] = useState<ModuleId>('sales');
  const rawLocale = useLocale();
  const locale: Locale = rawLocale === 'en' ? 'en' : 'es';
  const t = useTranslations('demoErp.topbar');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const workDate = state.workDate;
  const openMonthLabel = fmtMonthLong(workDate.slice(0, 7), locale);

  // Si lo guardado era de un mes anterior, se avisa una vez que los datos se renovaron
  const staleShown = useRef(false);
  useEffect(() => {
    if (!stale || staleShown.current) return;
    staleShown.current = true;
    toast(t('newMonth', { month: openMonthLabel }), { duration: 7000 });
  }, [stale, t, openMonthLabel]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (state === getSeed(state.workDate)) window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* almacenamiento lleno o bloqueado */
      }
    }, 250);
    return () => clearTimeout(id);
  }, [state]);

  const computed = useMemo(() => compute(state), [state]);
  const range = useMemo(() => periodRange(filters.period, workDate), [filters.period, workDate]);

  const setFilters = useCallback((f: Partial<Filters>) => setFiltersState((prev) => ({ ...prev, ...f })), []);

  const goTo = useCallback((m: ModuleId, search?: string, scroll: boolean = search !== undefined) => {
    setModule(m);
    dispatch({ type: 'visit', module: m });
    if (search !== undefined) setFiltersState((prev) => ({ ...prev, search }));
    if (scroll) {
      // Lleva la vista al módulo (útil desde los indicadores, el recorrido o un enlace entre módulos)
      requestAnimationFrame(() => document.getElementById('erp-modules')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, []);

  const invoice = useCallback((id: string) => {
    dispatch({ type: 'invoice', id });
    timers.current.push(setTimeout(() => dispatch({ type: 'dianAccepted', id }), 1600));
  }, []);

  const transmitPayroll = useCallback((id: string) => {
    dispatch({ type: 'transmitPayroll', id });
    timers.current.push(setTimeout(() => dispatch({ type: 'payrollAccepted', id }), 1600));
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada */
    }
  }, []);

  const ensureOpenPeriod = useCallback(() => {
    if (filters.period === 'm0' || filters.period === 'q' || filters.period === 'ytd') return false;
    setFiltersState((prev) => ({ ...prev, period: 'm0' }));
    toast(t('periodSwitched', { month: openMonthLabel }));
    return true;
  }, [filters.period, t, openMonthLabel]);

  const value = useMemo<Ctx>(
    () => ({ state, computed, dispatch, filters, setFilters, workDate, range, module, goTo, locale, invoice, transmitPayroll, reset, ensureOpenPeriod, openMonthLabel }),
    [state, computed, filters, setFilters, workDate, range, module, goTo, locale, invoice, transmitPayroll, reset, ensureOpenPeriod, openMonthLabel],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp debe usarse dentro de ErpProvider');
  return ctx;
}

/** Utilidades compartidas por los módulos. */
export { ITEM_BY_SKU, saleOpenAt, poOpenAt };
