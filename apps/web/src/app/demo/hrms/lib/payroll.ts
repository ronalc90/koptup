/**
 * Motor de nómina colombiana de la demo (simplificado y con parámetros de
 * ejemplo 2026). Calcula devengados, deducciones, aportes del empleador y
 * provisiones por colaborador; con eso arma los totales, el asiento contable,
 * el archivo plano de aportes (estructura simplificada) y el de dispersión.
 * Cada total sale de sumar las filas, por eso cuadra siempre.
 */
import { addDays, lastDayOfMonth, parseISO, toISO, type ISODate } from './dates';
import type { Employee, Novelty, NoveltyKind } from './types';

export const PARAMS = {
  year: 2026,
  smmlv: 1750905,
  transport: 249095,
  uvt: 52374,
};

/** Jornada máxima semanal (Ley 2101 de 2021: baja cada 15 de julio). */
export function weeklyHours(date: ISODate): number {
  if (date >= '2026-07-15') return 42;
  if (date >= '2025-07-15') return 44;
  if (date >= '2024-07-15') return 46;
  return 47;
}

/** Recargo dominical y festivo (Ley 2466 de 2025: sube cada 1.º de julio). */
export function sundayRate(date: ISODate): number {
  if (date >= '2027-07-01') return 1;
  if (date >= '2026-07-01') return 0.9;
  if (date >= '2025-07-01') return 0.8;
  return 0.75;
}

export function noveltyFactor(kind: NoveltyKind, date: ISODate): number {
  switch (kind) {
    case 'hed': return 1.25;
    case 'hen': return 1.75;
    case 'rn': return 0.35;
    case 'rdf': return sundayRate(date);
    default: return 1;
  }
}

export const ARL_RATES: Record<number, number> = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.0435, 5: 0.0696 };

export interface Period {
  id: string;
  kind: 'Q1' | 'Q2' | 'M';
  from: ISODate;
  to: ISODate;
  days: number;
  payDate: ISODate;
  month: string;
}

/** Quincena en curso según la fecha de corte de la demo. */
export function currentPeriod(base: ISODate): Period {
  const month = base.slice(0, 7);
  const day = Number(base.slice(8));
  if (day <= 15) return { id: `${month}-Q1`, kind: 'Q1', from: `${month}-01`, to: `${month}-15`, days: 15, payDate: `${month}-15`, month };
  const to = lastDayOfMonth(base);
  return { id: `${month}-Q2`, kind: 'Q2', from: `${month}-16`, to, days: 15, payDate: to, month };
}

export function previousMonth(base: ISODate): string {
  const d = parseISO(`${base.slice(0, 7)}-01`);
  d.setUTCDate(0);
  return toISO(d).slice(0, 7);
}

export function monthPeriod(month: string): Period {
  const from = `${month}-01`;
  const to = lastDayOfMonth(from);
  return { id: `${month}-M`, kind: 'M', from, to, days: 30, payDate: to, month };
}

/** Plazo de la nómina electrónica: hasta el 10.º día hábil del mes siguiente (aprox.). */
export function filingDeadline(month: string): ISODate {
  return addDays(lastDayOfMonth(`${month}-01`), 14);
}

export interface PayLine {
  employeeId: string;
  days: number;
  apprentice: boolean;
  salary: number;
  transport: number;
  overtime: number;
  commission: number;
  earned: number;
  ibc: number;
  health: number;
  pension: number;
  fsp: number;
  withholding: number;
  deductions: number;
  net: number;
  erHealth: number;
  erPension: number;
  arl: number;
  ccf: number;
  icbf: number;
  sena: number;
  contributions: number;
  prima: number;
  severance: number;
  severanceInterest: number;
  vacation: number;
  provisions: number;
  cost: number;
}

const r0 = (n: number) => Math.round(n);

function fspRate(monthlyIbc: number): number {
  const m = monthlyIbc / PARAMS.smmlv;
  if (m < 4) return 0;
  if (m < 16) return 0.01;
  if (m < 17) return 0.012;
  if (m < 18) return 0.014;
  if (m < 19) return 0.016;
  if (m < 20) return 0.018;
  return 0.02;
}

/** Retención en la fuente mensual, procedimiento 1 simplificado (art. 383 E.T.). */
export function monthlyWithholding(income: number, mandatory: number): number {
  const net = Math.max(0, income - mandatory);
  const exempt = Math.min(net * 0.25, (790 / 12) * PARAMS.uvt);
  const base = (net - exempt) / PARAMS.uvt;
  let uvt = 0;
  if (base > 2300) uvt = (base - 2300) * 0.39 + 770;
  else if (base > 945) uvt = (base - 945) * 0.37 + 268;
  else if (base > 640) uvt = (base - 640) * 0.35 + 162;
  else if (base > 360) uvt = (base - 360) * 0.33 + 69;
  else if (base > 150) uvt = (base - 150) * 0.28 + 10;
  else if (base > 95) uvt = (base - 95) * 0.19;
  return Math.round((uvt * PARAMS.uvt) / 1000) * 1000;
}

export function liquidate(e: Employee, novelties: Novelty[], p: Period): PayLine {
  const startDay = e.joined > p.from ? Number(e.joined.slice(8)) - Number(p.from.slice(8)) : 0;
  const days = Math.max(0, p.days - startDay);
  const f = days / 30;
  const apprentice = e.contract === 'apprentice';
  const salary = r0(e.salary * f);
  const transport = !apprentice && e.salary <= 2 * PARAMS.smmlv ? r0(PARAMS.transport * f) : 0;
  const hourValue = e.salary / (weeklyHours(p.to) * 5);
  let overtime = 0;
  let commission = 0;
  for (const n of novelties) {
    if (n.employeeId !== e.id) continue;
    if (n.kind === 'commission') commission += n.qty;
    else overtime += n.qty * hourValue * noveltyFactor(n.kind, p.to);
  }
  overtime = r0(overtime);
  const earned = salary + transport + overtime + commission;
  const zero = { health: 0, pension: 0, fsp: 0, withholding: 0, erPension: 0, ccf: 0, icbf: 0, sena: 0, prima: 0, severance: 0, severanceInterest: 0, vacation: 0 };
  if (apprentice) {
    const erHealth = r0(salary * 0.125);
    const arl = r0(salary * ARL_RATES[1]);
    return { employeeId: e.id, days, apprentice, salary, transport, overtime, commission, earned, ibc: salary, ...zero, deductions: 0, net: earned, erHealth, arl, contributions: erHealth + arl, provisions: 0, cost: earned + erHealth + arl };
  }
  const ibc = Math.max(salary + overtime + commission, r0(PARAMS.smmlv * f));
  const monthlyIbc = f > 0 ? ibc / f : 0;
  const health = r0(ibc * 0.04);
  const pension = r0(ibc * 0.04);
  const fsp = r0(ibc * fspRate(monthlyIbc));
  const withholding = f > 0 ? Math.round((monthlyWithholding(monthlyIbc, (health + pension + fsp) / f) * f) / 100) * 100 : 0;
  const deductions = health + pension + fsp + withholding;
  const high = e.salary >= 10 * PARAMS.smmlv;
  const erHealth = high ? r0(ibc * 0.085) : 0;
  const erPension = r0(ibc * 0.12);
  const arl = r0(ibc * ARL_RATES[e.arlClass]);
  const ccf = r0(ibc * 0.04);
  const icbf = high ? r0(ibc * 0.03) : 0;
  const sena = high ? r0(ibc * 0.02) : 0;
  const contributions = erHealth + erPension + arl + ccf + icbf + sena;
  const benefitBase = salary + overtime + commission + transport;
  const prima = r0(benefitBase * 0.0833);
  const severance = r0(benefitBase * 0.0833);
  const severanceInterest = r0(severance * 0.12);
  const vacation = r0(salary * 0.0417);
  const provisions = prima + severance + severanceInterest + vacation;
  return {
    employeeId: e.id, days, apprentice, salary, transport, overtime, commission, earned, ibc,
    health, pension, fsp, withholding, deductions, net: earned - deductions,
    erHealth, erPension, arl, ccf, icbf, sena, contributions,
    prima, severance, severanceInterest, vacation, provisions,
    cost: earned + contributions + provisions,
  };
}

export type Totals = Omit<PayLine, 'employeeId' | 'days' | 'apprentice'> & { count: number; apprenticeSalary: number };

export function totals(lines: PayLine[]): Totals {
  const keys: (keyof Omit<Totals, 'count' | 'apprenticeSalary'>)[] = [
    'salary', 'transport', 'overtime', 'commission', 'earned', 'ibc', 'health', 'pension', 'fsp', 'withholding', 'deductions', 'net',
    'erHealth', 'erPension', 'arl', 'ccf', 'icbf', 'sena', 'contributions', 'prima', 'severance', 'severanceInterest', 'vacation', 'provisions', 'cost',
  ];
  const t = Object.fromEntries(keys.map((k) => [k, 0])) as Totals;
  t.count = lines.length;
  t.apprenticeSalary = 0;
  for (const l of lines) {
    for (const k of keys) (t[k] as number) += l[k] as number;
    if (l.apprentice) t.apprenticeSalary += l.salary;
  }
  return t;
}

export function payroll(employees: Employee[], novelties: Novelty[], p: Period): PayLine[] {
  return employees
    .filter((e) => e.status !== 'retired' && e.joined <= p.to)
    .map((e) => liquidate(e, novelties, p))
    .filter((l) => l.days > 0);
}

export interface EntryLine {
  account: string;
  key: string;
  debit: number;
  credit: number;
}

/** Asiento contable de la nómina con cuentas del PUC (Decreto 2650 de 1993). */
export function journal(t: Totals): EntryLine[] {
  const d = (account: string, key: string, v: number): EntryLine => ({ account, key, debit: v, credit: 0 });
  const c = (account: string, key: string, v: number): EntryLine => ({ account, key, debit: 0, credit: v });
  return [
    d('510506', 'salaries', t.salary - t.apprenticeSalary),
    d('510515', 'overtime', t.overtime),
    d('510518', 'commissions', t.commission),
    d('510527', 'transport', t.transport),
    d('510595', 'apprentices', t.apprenticeSalary),
    d('510530', 'severance', t.severance),
    d('510533', 'severanceInterest', t.severanceInterest),
    d('510536', 'prima', t.prima),
    d('510539', 'vacation', t.vacation),
    d('510568', 'arl', t.arl),
    d('510569', 'erHealth', t.erHealth),
    d('510570', 'erPension', t.erPension),
    d('510572', 'ccf', t.ccf),
    d('510575', 'icbf', t.icbf),
    d('510578', 'sena', t.sena),
    c('237005', 'healthPayable', t.health + t.erHealth),
    c('238030', 'pensionPayable', t.pension + t.fsp + t.erPension),
    c('237006', 'arlPayable', t.arl),
    c('237010', 'parafiscalPayable', t.ccf + t.icbf + t.sena),
    c('236505', 'withholdingPayable', t.withholding),
    c('250505', 'netPayable', t.net),
    c('261005', 'severanceProvision', t.severance),
    c('261010', 'interestProvision', t.severanceInterest),
    c('261015', 'vacationProvision', t.vacation),
    c('261020', 'primaProvision', t.prima),
  ].filter((l) => l.debit !== 0 || l.credit !== 0);
}

/** SHA-384 en hexadecimal (CUNE de ejemplo, calculado en el navegador). */
export async function sha384(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-384', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function csv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(';')).join('\r\n');
}

export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
