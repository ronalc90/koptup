/**
 * Motor de disponibilidad e indicadores de la demo. Todo se calcula con los
 * horarios de cada profesional (o cancha), la duración del servicio más el
 * tiempo de alistamiento, los festivos de Colombia y las reservas existentes.
 */
import { addDays, diffDays, holidayOn, startOfWeek, weekday, type Holiday, type Now } from './dates';
import type { Booking, Business, Channel, ISODate, Service, Shift, Staff, Status } from './types';

export function serviceOf(biz: Business, id: string): Service | undefined {
  return biz.services.find((s) => s.id === id);
}

export function staffOf(biz: Business, id: string): Staff | undefined {
  return biz.staff.find((s) => s.id === id);
}

export function locationOf(biz: Business, id: string) {
  return biz.locations.find((l) => l.id === id);
}

/** Estados que ocupan la agenda. */
export function occupies(status: Status): boolean {
  return status !== 'cancelled';
}

/** Turnos del profesional ese día (en festivo: cerrado o con el horario del domingo). */
export function shiftsOn(biz: Business, staff: Staff, date: ISODate): Shift[] {
  const hol = holidayOn(date);
  if (hol && !biz.holidaysOpen) return [];
  const wd = hol ? 0 : weekday(date);
  return staff.schedule[wd] ?? [];
}

/** Profesionales que hacen el servicio y trabajan alguna vez en la sede. */
export function staffForService(biz: Business, serviceId: string, locationId: string): Staff[] {
  return biz.staff.filter(
    (s) => s.services.includes(serviceId) && Object.values(s.schedule).some((shifts) => (shifts ?? []).some((sh) => sh.loc === locationId)),
  );
}

export function isOffered(biz: Business, serviceId: string, locationId: string): boolean {
  return staffForService(biz, serviceId, locationId).length > 0;
}

/** Profesionales (o canchas) que trabajan en la sede en algún día de la semana. */
export function staffAtLocation(biz: Business, locationId: string): Staff[] {
  return biz.staff.filter((s) => Object.values(s.schedule).some((shifts) => (shifts ?? []).some((sh) => sh.loc === locationId)));
}

/** Intervalos ocupados del profesional ese día (cita + alistamiento). */
function busy(biz: Business, bookings: Booking[], staffId: string, date: ISODate, ignoreId?: string): [number, number][] {
  return bookings
    .filter((b) => b.staffId === staffId && b.date === date && occupies(b.status) && b.id !== ignoreId)
    .map((b) => [b.start, b.end + (serviceOf(biz, b.serviceId)?.buffer ?? 0)]);
}

export interface SlotQuery {
  serviceId: string;
  /** 'any' = el primero disponible. */
  staffId: string;
  locationId: string;
  date: ISODate;
  now: Pick<Now, 'date' | 'minutes'>;
  /** Al reprogramar, la cita misma no cuenta como ocupada. */
  ignoreBookingId?: string;
}

export interface Slot {
  start: number;
  /** Profesionales libres a esa hora (el primero es el que se asigna). */
  staffIds: string[];
}

export function freeSlots(biz: Business, bookings: Booking[], q: SlotQuery): Slot[] {
  const svc = serviceOf(biz, q.serviceId);
  if (!svc) return [];
  if (q.date < q.now.date || diffDays(q.now.date, q.date) > biz.horizonDays) return [];
  const minStart = q.date === q.now.date ? q.now.minutes + biz.leadMinutes : -1;
  const found = new Map<number, string[]>();
  const candidates = staffForService(biz, svc.id, q.locationId).filter((s) => q.staffId === 'any' || s.id === q.staffId);
  for (const s of candidates) {
    const shifts = shiftsOn(biz, s, q.date).filter((sh) => sh.loc === q.locationId);
    if (!shifts.length) continue;
    const taken = busy(biz, bookings, s.id, q.date, q.ignoreBookingId);
    for (const sh of shifts) {
      const first = Math.ceil(sh.start / biz.step) * biz.step;
      for (let t = first; t + svc.duration <= sh.end; t += biz.step) {
        if (t < minStart) continue;
        const end = t + svc.duration + svc.buffer;
        if (taken.some(([bs, be]) => t < be && bs < end)) continue;
        const list = found.get(t) ?? [];
        list.push(s.id);
        found.set(t, list);
      }
    }
  }
  return [...found.entries()].sort((a, b) => a[0] - b[0]).map(([start, staffIds]) => ({ start, staffIds }));
}

export type DayKind = 'past' | 'beyond' | 'holiday' | 'closed' | 'full' | 'open';

export interface DayInfo {
  kind: DayKind;
  slots: number;
  holiday: Holiday | null;
}

export function dayInfo(biz: Business, bookings: Booking[], q: Omit<SlotQuery, 'date'>, date: ISODate): DayInfo {
  const holiday = holidayOn(date);
  if (date < q.now.date) return { kind: 'past', slots: 0, holiday };
  if (diffDays(q.now.date, date) > biz.horizonDays) return { kind: 'beyond', slots: 0, holiday };
  if (holiday && !biz.holidaysOpen) return { kind: 'holiday', slots: 0, holiday };
  const works = staffForService(biz, q.serviceId, q.locationId)
    .filter((s) => q.staffId === 'any' || s.id === q.staffId)
    .some((s) => shiftsOn(biz, s, date).some((sh) => sh.loc === q.locationId));
  if (!works) return { kind: 'closed', slots: 0, holiday };
  const slots = freeSlots(biz, bookings, { ...q, date }).length;
  return { kind: slots ? 'open' : 'full', slots, holiday };
}

/** Primer día con cupo desde hoy (para abrir el calendario en un día útil). */
export function firstOpenDay(biz: Business, bookings: Booking[], q: Omit<SlotQuery, 'date'>): ISODate | null {
  for (let i = 0; i <= biz.horizonDays; i++) {
    const d = addDays(q.now.date, i);
    if (dayInfo(biz, bookings, q, d).kind === 'open') return d;
  }
  return null;
}

/** Día con turnos en la sede (para la agenda del negocio). */
export function isWorkingDay(biz: Business, date: ISODate, locationId: string): boolean {
  return biz.staff.some((s) => shiftsOn(biz, s, date).some((sh) => sh.loc === locationId));
}

export function depositOf(svc: Service): number {
  return Math.round((svc.price * svc.deposit) / 100);
}

export function balanceOf(biz: Business, b: Booking): number {
  const svc = serviceOf(biz, b.serviceId);
  return Math.max(0, (svc?.price ?? 0) - b.payment.amount);
}

/** ¿Se puede cancelar sin perder el abono? (más de N horas antes). */
export function freeCancellation(biz: Business, b: Booking, now: Pick<Now, 'date' | 'minutes'>): boolean {
  const minutesLeft = diffDays(now.date, b.date) * 1440 + b.start - now.minutes;
  return minutesLeft >= biz.cancelHours * 60;
}

/* ------------------------------------------------------------------ */
/* Indicadores                                                        */
/* ------------------------------------------------------------------ */

export interface Kpis {
  weekStart: ISODate;
  weekEnd: ISODate;
  occupancy: number;
  bookedMinutes: number;
  availableMinutes: number;
  noShows: number;
  attended: number;
  noShowRate: number;
  revenueMonth: number;
  prepaidMonth: number;
  upcoming7: number;
  pendingUpcoming: number;
  byService: { id: string; count: number }[];
  byChannel: Record<Channel, number>;
  byStaff: { id: string; booked: number; available: number }[];
}

export function kpis(biz: Business, bookings: Booking[], today: ISODate, locationId: string): Kpis {
  const inLoc = (b: Booking) => locationId === 'all' || b.locationId === locationId;
  const list = bookings.filter(inLoc);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byStaff = biz.staff.map((s) => {
    let available = 0;
    for (const d of week) for (const sh of shiftsOn(biz, s, d)) if (locationId === 'all' || sh.loc === locationId) available += sh.end - sh.start;
    const booked = list
      .filter((b) => b.staffId === s.id && occupies(b.status) && b.date >= weekStart && b.date <= weekEnd)
      .reduce((acc, b) => acc + (b.end - b.start), 0);
    return { id: s.id, booked, available };
  });
  const availableMinutes = byStaff.reduce((a, s) => a + s.available, 0);
  const bookedMinutes = byStaff.reduce((a, s) => a + s.booked, 0);

  const from30 = addDays(today, -29);
  const closed = list.filter((b) => b.date >= from30 && b.date <= today && (b.status === 'attended' || b.status === 'noshow'));
  const noShows = closed.filter((b) => b.status === 'noshow').length;
  const attended = closed.length - noShows;

  const month = today.slice(0, 7);
  const price = (b: Booking) => serviceOf(biz, b.serviceId)?.price ?? 0;
  const revenueMonth = list.filter((b) => b.date.startsWith(month) && b.date <= today && b.status === 'attended').reduce((a, b) => a + price(b), 0);
  const prepaidMonth = list.filter((b) => b.date.startsWith(month) && b.status !== 'cancelled' && b.payment.kind !== 'none').reduce((a, b) => a + b.payment.amount, 0);

  const in7 = addDays(today, 7);
  const upcoming = list.filter((b) => b.date >= today && b.date <= in7 && (b.status === 'pending' || b.status === 'confirmed'));

  const windowEnd = addDays(today, 14);
  const windowed = list.filter((b) => b.date >= from30 && b.date <= windowEnd && occupies(b.status));
  const byService = biz.services
    .map((s) => ({ id: s.id, count: windowed.filter((b) => b.serviceId === s.id).length }))
    .sort((a, b) => b.count - a.count);
  const byChannel: Record<Channel, number> = { web: 0, whatsapp: 0, phone: 0, walkin: 0 };
  for (const b of windowed) byChannel[b.channel] += 1;

  return {
    weekStart,
    weekEnd,
    occupancy: availableMinutes ? bookedMinutes / availableMinutes : 0,
    bookedMinutes,
    availableMinutes,
    noShows,
    attended,
    noShowRate: closed.length ? noShows / closed.length : 0,
    revenueMonth,
    prepaidMonth,
    upcoming7: upcoming.length,
    pendingUpcoming: upcoming.filter((b) => b.status === 'pending').length,
    byService,
    byChannel,
    byStaff,
  };
}

/* ------------------------------------------------------------------ */
/* Filtros de la lista de reservas                                    */
/* ------------------------------------------------------------------ */

export type RangeFilter = 'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past';

export interface TableFilters {
  q: string;
  range: RangeFilter;
  serviceId: string;
  staffId: string;
  status: string;
  locationId: string;
  sort: 'asc' | 'desc';
}

export const EMPTY_FILTERS: TableFilters = { q: '', range: 'week', serviceId: 'all', staffId: 'all', status: 'all', locationId: 'all', sort: 'asc' };

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function filterBookings(bookings: Booking[], f: TableFilters, today: ISODate): Booking[] {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const q = fold(f.q.trim());
  const digits = f.q.replace(/\D/g, '');
  const out = bookings.filter((b) => {
    if (f.serviceId !== 'all' && b.serviceId !== f.serviceId) return false;
    if (f.staffId !== 'all' && b.staffId !== f.staffId) return false;
    if (f.status !== 'all' && b.status !== f.status) return false;
    if (f.locationId !== 'all' && b.locationId !== f.locationId) return false;
    if (f.range === 'today' && b.date !== today) return false;
    if (f.range === 'week' && (b.date < weekStart || b.date > weekEnd)) return false;
    if (f.range === 'month' && !b.date.startsWith(today.slice(0, 7))) return false;
    if (f.range === 'upcoming' && b.date < today) return false;
    if (f.range === 'past' && b.date >= today) return false;
    if (q) {
      const hay = fold(`${b.client.name} ${b.code} ${b.client.email}`);
      const phoneHit = digits.length >= 3 && b.client.phone.replace(/\D/g, '').includes(digits);
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  });
  const dir = f.sort === 'asc' ? 1 : -1;
  return out.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1) * dir);
}

/** Próximo día (desde mañana) con citas activas: a ese día van los recordatorios. */
export function nextDayWithBookings(bookings: Booking[], today: ISODate): ISODate | null {
  const future = bookings
    .filter((b) => b.date > today && (b.status === 'pending' || b.status === 'confirmed'))
    .map((b) => b.date)
    .sort();
  return future[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Formatos y validaciones                                            */
/* ------------------------------------------------------------------ */

export function formatCOP(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDuration(minutes: number, locale: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return locale === 'en' ? `${h} h` : `${h} h`;
  return `${h} h ${m} min`;
}

/** Celular colombiano: 10 dígitos que empiezan por 3 (con o sin +57). */
export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  if (d.length !== 10 || !d.startsWith('3')) return null;
  return `+57 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function isEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
