/** Cálculos derivados del estado: saldos, alertas e indicadores. */
import { addDays, businessDaysBetween, diffDays, lastDayOfMonth, type ISODate } from './dates';
import { POSITIONS } from './catalog';
import { monthPeriod, payroll, totals } from './payroll';
import type { Employee, HrState, Leave, Survey } from './types';

export const EXAM_VALIDITY_DAYS = 365;

export function active(state: HrState): Employee[] {
  return state.employees.filter((e) => e.status !== 'retired');
}

export function byId(state: HrState): Map<string, Employee> {
  return new Map(state.employees.map((e) => [e.id, e]));
}

export interface Balance {
  accrued: number;
  taken: number;
  balance: number;
  pending: number;
}

/** Saldo de vacaciones en días hábiles: 15 por año de servicio; saldo = causados − tomados. */
export function vacationBalance(state: HrState, e: Employee): Balance {
  if (e.contract === 'apprentice') return { accrued: 0, taken: 0, balance: 0, pending: 0 };
  const accrued = Math.max(0, (diffDays(e.joined, state.baseDate) / 360) * 15);
  let approved = 0;
  let pending = 0;
  for (const l of state.leaves) {
    if (l.employeeId !== e.id || l.type !== 'vacation') continue;
    if (l.status === 'approved') approved += l.days;
    if (l.status === 'pending') pending += l.days;
  }
  const taken = e.vacTaken + approved;
  return { accrued, taken, balance: accrued - taken, pending };
}

export function probationEnd(e: Employee): ISODate | null {
  if (e.contract === 'apprentice') return null;
  const days = e.contract === 'fixed' && e.termMonths && e.termMonths < 12 ? Math.floor((e.termMonths * 30) / 5) : 60;
  return addDays(e.joined, days);
}

export function examDue(e: Employee): ISODate {
  return addDays(e.lastExam, EXAM_VALIDITY_DAYS);
}

export interface Alerts {
  contracts: Employee[];
  probation: Employee[];
  accumulated: { e: Employee; balance: number }[];
  exams: Employee[];
}

export function alerts(state: HrState): Alerts {
  const base = state.baseDate;
  const list = active(state);
  const within = (d: ISODate | null, max: number) => d !== null && d >= base && diffDays(base, d) <= max;
  return {
    contracts: list
      .filter((e) => (e.contract === 'fixed' || e.contract === 'apprentice') && within(e.contractEnd, 30) && e.status === 'active')
      .sort((a, b) => (a.contractEnd! < b.contractEnd! ? -1 : 1)),
    probation: list.filter((e) => within(probationEnd(e), 15)).sort((a, b) => (probationEnd(a)! < probationEnd(b)! ? -1 : 1)),
    accumulated: list
      .map((e) => ({ e, balance: vacationBalance(state, e).balance }))
      .filter((x) => x.balance >= 30)
      .sort((a, b) => b.balance - a.balance),
    exams: list
      .filter((e) => diffDays(base, examDue(e)) <= 30)
      .sort((a, b) => (examDue(a) < examDue(b) ? -1 : 1)),
  };
}

export interface Obligation {
  key: 'pila' | 'einvoice' | 'prima' | 'severance' | 'interest' | 'uniform';
  date: ISODate;
}

/** Próximas fechas legales de pago y reporte, calculadas desde la fecha de corte. */
export function obligations(base: ISODate): Obligation[] {
  const y = Number(base.slice(0, 4));
  const next = (dates: ISODate[]) => dates.filter((d) => d >= base).sort()[0];
  const years = [y, y + 1];
  const nextMonth = addDays(lastDayOfMonth(base), 1);
  const list: Obligation[] = [
    { key: 'pila', date: addDays(nextMonth, 9) },
    { key: 'einvoice', date: addDays(nextMonth, 13) },
    { key: 'prima', date: next(years.flatMap((yy) => [`${yy}-06-30`, `${yy}-12-20`])) },
    { key: 'interest', date: next(years.map((yy) => `${yy}-01-31`)) },
    { key: 'severance', date: next(years.map((yy) => `${yy}-02-14`)) },
    { key: 'uniform', date: next(years.flatMap((yy) => [`${yy}-04-30`, `${yy}-08-31`, `${yy}-12-20`])) },
  ];
  return list.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function enps(s: Pick<Survey, 'promoters' | 'passives' | 'detractors'>): number {
  const n = s.promoters + s.passives + s.detractors;
  return n ? Math.round(((s.promoters - s.detractors) / n) * 100) : 0;
}

export function lastClosedSurvey(state: HrState): Survey | undefined {
  return [...state.surveys].filter((s) => s.closed && s.question === 'enps').sort((a, b) => (a.sentOn < b.sentOn ? 1 : -1))[0];
}

/** Días de ausencia (incapacidades, licencias y permisos) que caen en el mes de la fecha de corte. */
export function absenceDays(leaves: Leave[], from: ISODate, to: ISODate): number {
  let days = 0;
  for (const l of leaves) {
    if (l.status !== 'approved' || l.type === 'vacation') continue;
    const a = l.from > from ? l.from : from;
    const b = l.to < to ? l.to : to;
    if (a <= b) days += businessDaysBetween(a, b);
  }
  return days;
}

export interface Kpis {
  headcount: number;
  bySite: Record<string, number>;
  turnover: number;
  exits12: number;
  absenteeism: number;
  absenceDays: number;
  monthlyCost: number;
  openRoles: number;
  enps: number | null;
  responses: number;
}

export function kpis(state: HrState): Kpis {
  const list = active(state);
  const base = state.baseDate;
  const exits12 = state.exits.filter((x) => diffDays(x.date, base) <= 365 && x.date <= base).length;
  // Ausentismo móvil de los últimos 30 días (días hábiles perdidos / días hábiles posibles).
  const from = addDays(base, -29);
  const workdays = businessDaysBetween(from, base);
  const absDays = absenceDays(state.leaves, from, base);
  const cost = totals(payroll(list, [], monthPeriod(base.slice(0, 7)))).cost;
  const survey = lastClosedSurvey(state);
  const bySite: Record<string, number> = {};
  list.forEach((e) => {
    bySite[e.site] = (bySite[e.site] ?? 0) + 1;
  });
  return {
    headcount: list.length,
    bySite,
    exits12,
    turnover: list.length ? (exits12 / list.length) * 100 : 0,
    absenteeism: list.length && workdays ? (absDays / (list.length * workdays)) * 100 : 0,
    absenceDays: absDays,
    monthlyCost: cost,
    openRoles: state.vacancies.reduce((a, v) => a + Math.max(0, v.openings - v.hired), 0),
    enps: survey ? enps(survey) : null,
    responses: survey ? survey.promoters + survey.passives + survey.detractors : 0,
  };
}

export function upcomingBirthdays(state: HrState, days = 14): { e: Employee; date: ISODate }[] {
  const base = state.baseDate;
  const out: { e: Employee; date: ISODate }[] = [];
  for (let i = 0; i <= days; i++) {
    const d = addDays(base, i);
    const md = d.slice(5);
    for (const e of active(state)) if (e.birthday === md) out.push({ e, date: d });
  }
  return out;
}

export function evaluated(e: Employee) {
  return POSITIONS[e.positionId].evaluated;
}

export function onLeave(state: HrState, date: ISODate): Leave[] {
  return state.leaves.filter((l) => l.status === 'approved' && l.from <= date && l.to >= date);
}
