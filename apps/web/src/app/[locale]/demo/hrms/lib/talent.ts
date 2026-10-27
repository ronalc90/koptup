/** Puntaje de ajuste por reglas y liquidación de prestaciones al retiro. */
import { diffDays, type ISODate } from './dates';
import { EDUCATION_RANK } from './catalog';
import { PARAMS } from './payroll';
import type { Candidate, Employee, ExitReason, Vacancy } from './types';

export interface FitScore {
  experience: number;
  education: number;
  shifts: number;
  distance: number;
  total: number;
}

/**
 * Puntaje de 0 a 100 calculado con reglas transparentes contra los requisitos
 * de la vacante (no es IA): experiencia 40, formación 25, turnos 20, distancia 15.
 */
export function fitScore(c: Candidate, v: Vacancy): FitScore {
  const experience = v.minYears === 0 ? 40 : Math.round(40 * Math.min(1, c.years / v.minYears));
  const gap = EDUCATION_RANK[v.education] - EDUCATION_RANK[c.education];
  const education = gap <= 0 ? 25 : gap === 1 ? 12 : 0;
  const shifts = !v.shifts || c.shifts ? 20 : 0;
  const distance = c.distanceKm <= 10 ? 15 : c.distanceKm <= 20 ? 10 : c.distanceKm <= 35 ? 5 : 0;
  return { experience, education, shifts, distance, total: experience + education + shifts + distance };
}

export function fitBand(total: number): 'high' | 'mid' | 'low' {
  return total >= 80 ? 'high' : total >= 60 ? 'mid' : 'low';
}

export interface Settlement {
  pendingSalary: number;
  pendingDays: number;
  severance: number;
  severanceDays: number;
  interest: number;
  prima: number;
  primaDays: number;
  vacation: number;
  vacationDays: number;
  indemnity: number;
  /** Días de salario que paga la indemnización (0 si no aplica). */
  indemnityDays: number;
  total: number;
}

/**
 * Días de salario de la indemnización por despido sin justa causa (art. 64
 * C.S.T.): en contrato indefinido, 30 días por el primer año y 20 por cada año
 * adicional (20 y 15 si el salario es de 10 salarios mínimos o más), en
 * proporción a la fracción de año; a término fijo, los días que faltan para
 * terminar el plazo; por obra o labor, el tiempo que falta y como mínimo 15
 * días (en la demo no se conoce la fecha de fin de la obra: se usa el mínimo).
 * El contrato de aprendizaje no tiene indemnización.
 */
export function indemnityDays(e: Employee, lastDay: ISODate): number {
  if (e.contract === 'apprentice') return 0;
  if (e.contract === 'fixed') return e.contractEnd ? Math.max(0, diffDays(lastDay, e.contractEnd)) : 0;
  if (e.contract === 'work') return 15;
  const years = Math.max(0, diffDays(e.joined, lastDay)) / 365;
  const high = e.salary >= 10 * PARAMS.smmlv;
  const [first, extra] = high ? [20, 15] : [30, 20];
  return years <= 1 ? first : first + extra * (years - 1);
}

/**
 * Liquidación de prestaciones simplificada (días de 30 por mes, base con
 * auxilio de transporte para cesantías y prima) e indemnización por despido
 * sin justa causa según el tipo de contrato (ver `indemnityDays`).
 */
export function settlement(e: Employee, lastDay: ISODate, reason: ExitReason, vacationBalanceDays: number): Settlement {
  const year = lastDay.slice(0, 4);
  const transport = e.contract !== 'apprentice' && e.salary <= 2 * PARAMS.smmlv ? PARAMS.transport : 0;
  const base = e.salary + transport;
  const days360 = (from: ISODate) => Math.max(0, diffDays(from, lastDay) + 1);
  const yearStart = e.joined > `${year}-01-01` ? e.joined : `${year}-01-01`;
  const semStart0 = lastDay >= `${year}-07-01` ? `${year}-07-01` : `${year}-01-01`;
  const semStart = e.joined > semStart0 ? e.joined : semStart0;
  const dayOfMonth = Number(lastDay.slice(8));
  const pendingDays = Math.min(15, dayOfMonth > 15 ? dayOfMonth - 15 : dayOfMonth);
  const pendingSalary = Math.round(((e.salary + transport) * pendingDays) / 30);
  const apprentice = e.contract === 'apprentice';
  const severanceDays = apprentice ? 0 : Math.min(360, days360(yearStart));
  const severance = Math.round((base * severanceDays) / 360);
  const interest = Math.round((severance * severanceDays * 0.12) / 360);
  const primaDays = apprentice ? 0 : Math.min(180, days360(semStart));
  const prima = Math.round((base * primaDays) / 360);
  const vacationDays = apprentice ? 0 : Math.max(0, Math.floor(vacationBalanceDays * 10) / 10);
  const vacation = Math.round((e.salary / 30) * vacationDays);
  // Días con un decimal: la pantalla muestra los mismos días con los que se calcula el valor.
  const indemnityPaidDays = reason === 'dismissal' ? Math.round(indemnityDays(e, lastDay) * 10) / 10 : 0;
  const indemnity = Math.round((e.salary / 30) * indemnityPaidDays);
  const total = pendingSalary + severance + interest + prima + vacation + indemnity;
  return {
    pendingSalary, pendingDays, severance, severanceDays, interest, prima, primaDays, vacation, vacationDays, indemnity,
    indemnityDays: indemnityPaidDays, total,
  };
}
