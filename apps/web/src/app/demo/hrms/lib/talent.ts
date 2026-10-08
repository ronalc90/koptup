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
  total: number;
}

/**
 * Liquidación de prestaciones simplificada (días de 30 por mes, base con
 * auxilio de transporte para cesantías y prima). Indemnización solo para el
 * despido sin justa causa en contrato indefinido (art. 64 C.S.T., < 10 SMMLV).
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
  let indemnity = 0;
  if (reason === 'dismissal' && e.contract === 'indefinite') {
    const years = diffDays(e.joined, lastDay) / 365;
    const daysPay = years <= 1 ? 30 : 30 + 20 * (years - 1);
    indemnity = Math.round((e.salary / 30) * daysPay);
  }
  const total = pendingSalary + severance + interest + prima + vacation + indemnity;
  return { pendingSalary, pendingDays, severance, severanceDays, interest, prima, primaDays, vacation, vacationDays, indemnity, total };
}
