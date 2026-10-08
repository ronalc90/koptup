export type Locale = 'es' | 'en';
export type CompanyId = 'com' | 'log';
export type CompanyFilter = 'all' | CompanyId;
export type WarehouseId = 'bog' | 'med' | 'baq';
export type ItemKind = 'merch' | 'finished' | 'raw' | 'service';
export type CurrencyCode = 'COP' | 'USD';
export type PeriodId = '2026-09' | '2026-08' | '2026-07' | 'q3' | 'ytd';
export type ModuleId = 'sales' | 'inventory' | 'purchases' | 'accounting' | 'finance' | 'hr' | 'manufacturing';

// ---------------- Datos maestros ----------------

export interface Item {
  sku: string;
  name: string;
  nameEn: string;
  unit: 'und' | 'kg';
  kind: ItemKind;
  /** IVA en %: 0 = excluido. */
  vat: 0 | 5 | 19;
  /** Precio de venta antes de IVA (COP). */
  price: number;
  /** Costo de compra de referencia (COP). */
  cost: number;
  supplierId?: string;
  /** Punto de reorden por bodega. */
  reorder: Partial<Record<WarehouseId, number>>;
  /** Existencia objetivo (máximo) por bodega. */
  target: Partial<Record<WarehouseId, number>>;
}

export interface BomComponent {
  sku: string;
  qty: number;
  /** Subensamble fantasma: se produce dentro de la misma orden. */
  phantom?: { name: string; nameEn: string; unit: 'kg' | 'und'; qty: number; components: BomComponent[] };
}

export interface Bom {
  sku: string;
  components: BomComponent[];
}

export interface Customer {
  id: string;
  name: string;
  nit: string;
  city: string;
  warehouse: WarehouseId;
  termDays: number;
  phone: string;
  /** Comportamiento de pago para generar la historia. */
  payer: 'punctual' | 'late' | 'slow';
  companies: CompanyId[];
}

export interface Supplier {
  id: string;
  name: string;
  nit: string;
  city: string;
  termDays: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  positionEn: string;
  dept: 'management' | 'finance' | 'purchasing' | 'sales' | 'warehouse' | 'production' | 'people' | 'operations';
  company: CompanyId;
  salary: number;
  city: string;
}

// ---------------- Documentos (estado editable) ----------------

export interface DocLine {
  sku: string;
  qty: number;
  /** Precio (venta) o costo (compra) unitario antes de IVA. */
  price: number;
  vat: number;
}

export type SaleStatus = 'quote' | 'order' | 'invoiced';

export interface SaleDoc {
  id: string;
  company: CompanyId;
  customerId: string;
  warehouse: WarehouseId;
  lines: DocLine[];
  status: SaleStatus;
  quoteNo: string;
  quoteDate: string;
  orderNo?: string;
  orderDate?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceSeq?: number;
  dueDate?: string;
  dian?: 'sending' | 'accepted';
  creditNote?: { no: string; date: string; seq: number };
  user?: boolean;
}

export type PayMethod = 'pse' | 'transfer' | 'deposit';

export interface Receipt {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  date: string;
  customerId: string;
  saleId: string;
  amount: number;
  method: PayMethod;
  user?: boolean;
}

export type PoStatus = 'pending' | 'approved' | 'rejected' | 'received';
export type PoOrigin = 'seed' | 'manual' | 'reorder' | 'mrp';

export interface PurchaseOrder {
  id: string;
  no: string;
  company: CompanyId;
  supplierId: string;
  warehouse: WarehouseId;
  lines: DocLine[];
  date: string;
  origin: PoOrigin;
  levels: 1 | 2;
  approvals: { level: 1 | 2; date: string }[];
  status: PoStatus;
  rejectReason?: string;
  receipt?: { date: string; seq: number; invoiceNo: string; source: 'xml' | 'manual' };
  user?: boolean;
}

export interface SupplierPayment {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  date: string;
  poId: string;
  supplierId: string;
  amount: number;
  user?: boolean;
}

export interface Transfer {
  id: string;
  no: string;
  seq: number;
  date: string;
  sku: string;
  qty: number;
  from: WarehouseId;
  to: WarehouseId;
  user?: boolean;
}

export interface ProductionOrder {
  id: string;
  no: string;
  sku: string;
  qty: number;
  warehouse: WarehouseId;
  status: 'planned' | 'inProgress' | 'done';
  date: string;
  start?: { date: string; seq: number };
  finish?: { date: string; seq: number };
  user?: boolean;
}

export type ExpenseKind =
  | 'rent'
  | 'utilities'
  | 'maintenance'
  | 'depreciation'
  | 'bankFee'
  | 'gmf'
  | 'opCost'
  | 'unidentified';

export interface Expense {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  date: string;
  kind: ExpenseKind;
  amount: number;
  user?: boolean;
}

export interface Payroll {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  month: string;
  date: string;
  gross: number;
  headcount: number;
  eStatus: 'pending' | 'sending' | 'accepted';
  user?: boolean;
}

export interface TaxPayment {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  date: string;
  account: '2408' | '2365';
  /** Se paga el saldo de la cuenta a esta fecha de corte. */
  cutoff: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  from: string;
  to: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  user?: boolean;
}

export type BankMatchKind = 'receipt' | 'payment' | 'expense' | 'payroll' | 'tax';

export interface BankLine {
  id: string;
  company: CompanyId;
  date: string;
  desc: string;
  amount: number;
  match?: { kind: BankMatchKind; docId: string; by: 'seed' | 'user' };
  imported?: boolean;
}

export interface ManualEntry {
  id: string;
  no: string;
  seq: number;
  company: CompanyId;
  date: string;
  desc: string;
  lines: { account: string; debit: number; credit: number }[];
}

export interface ErpState {
  v: number;
  seq: number;
  counters: Record<string, number>;
  sales: SaleDoc[];
  receipts: Receipt[];
  pos: PurchaseOrder[];
  payments: SupplierPayment[];
  transfers: Transfer[];
  production: ProductionOrder[];
  expenses: Expense[];
  payroll: Payroll[];
  taxes: TaxPayment[];
  vacations: Vacation[];
  bank: BankLine[];
  manual: ManualEntry[];
  visited: Partial<Record<ModuleId, boolean>>;
}

// ---------------- Resultados calculados ----------------

export type MovementKind =
  | 'opening'
  | 'purchase'
  | 'sale'
  | 'return'
  | 'transferIn'
  | 'transferOut'
  | 'prodOut'
  | 'prodIn';

export interface Movement {
  date: string;
  seq: number;
  sku: string;
  wh: WarehouseId;
  qty: number;
  unitCost: number;
  value: number;
  doc: string;
  kind: MovementKind;
}

export interface EntryLine {
  account: string;
  debit: number;
  credit: number;
  third?: string;
}

export type EntrySource =
  | 'opening'
  | 'sale'
  | 'creditNote'
  | 'receipt'
  | 'purchase'
  | 'payment'
  | 'expense'
  | 'payroll'
  | 'tax'
  | 'prodStart'
  | 'prodFinish'
  | 'manual';

export interface Entry {
  id: string;
  no: string;
  date: string;
  seq: number;
  company: CompanyId;
  source: EntrySource;
  sourceId: string;
  /** Clave de descripción (demoErp.entryDesc.*) y parámetros. */
  desc: { key: string; params?: Record<string, string> } | { text: string };
  lines: EntryLine[];
  user?: boolean;
}
