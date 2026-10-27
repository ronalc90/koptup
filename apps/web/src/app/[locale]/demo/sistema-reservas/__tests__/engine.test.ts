/**
 * Lógica de la demo de reservas: fechas sin zona, festivos de Colombia,
 * disponibilidad calculada (sin cruces), filtros, archivos generados y el
 * reducer que conecta la reserva del cliente con la agenda del negocio.
 */
import { addDays, bogotaNow, easter, formatDate, formatTime, holidayOn, holidays, startOfWeek, utcCompact, weekday } from '../lib/dates';
import { dayInfo, filterBookings, freeSlots, kpis, normalizeMobile, isEmail, EMPTY_FILTERS, depositOf, serviceOf, freeCancellation } from '../lib/engine';
import { buildIcs, googleCalendarUrl, toCsv } from '../lib/files';
import { BUSINESSES, nitDv } from '../lib/presets';
import { reducer } from '../lib/reducer';
import { buildState, overlapsIn } from '../lib/seed';
import { PRESETS, type AppState, type NewBookingInput } from '../lib/types';

// Sábado 10 de octubre de 2026, 9:40 a. m. en Bogotá.
const TODAY = '2026-10-10';
const NOW_MIN = 9 * 60 + 40;
const NOW = { date: TODAY, minutes: NOW_MIN };
const AT = `${TODAY}T09:40`;

const fresh = (): AppState => buildState(TODAY, NOW_MIN);

describe('fechas', () => {
  it('calcula el día de la semana y el lunes de la semana sin depender de la zona', () => {
    expect(weekday('2026-10-10')).toBe(6);
    expect(startOfWeek('2026-10-10')).toBe('2026-10-05');
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('toma la hora de Bogotá (UTC−5) a partir de un instante UTC', () => {
    // 2026-10-10 14:40 UTC = 9:40 a. m. en Bogotá.
    const n = bogotaNow(Date.UTC(2026, 9, 10, 14, 40));
    expect(n).toEqual({ date: '2026-10-10', minutes: 580, stamp: '2026-10-10T09:40' });
    // 03:00 UTC del 11 = 10:00 p. m. del 10 en Bogotá.
    expect(bogotaNow(Date.UTC(2026, 9, 11, 3, 0)).date).toBe('2026-10-10');
    expect(utcCompact('2026-10-15', 10 * 60)).toBe('20261015T150000Z');
  });

  it('formatea con idioma fijo y sin correr el día', () => {
    expect(formatDate('2026-10-15', 'es', 'long')).toBe('jueves, 15 de octubre de 2026');
    expect(formatDate('2026-10-15', 'en', 'long')).toBe('Thursday, October 15, 2026');
    expect(formatTime(14 * 60 + 30, 'es')).toBe('2:30 p. m.');
    expect(formatTime(9 * 60, 'en')).toBe('9:00 AM');
  });

  it('calcula los festivos de Colombia con la Ley Emiliani', () => {
    expect(easter(2026)).toBe('2026-04-05');
    const list = holidays(2026).map((h) => h.date);
    expect(list).toHaveLength(18);
    // Días que caen en lunes por la Ley Emiliani (2026).
    expect(list).toEqual(expect.arrayContaining(['2026-01-12', '2026-03-23', '2026-10-12', '2026-11-02', '2026-11-16', '2026-08-17']));
    expect(holidayOn('2026-04-02')?.name.es).toBe('Jueves Santo');
    expect(holidayOn('2026-12-08')?.name.es).toBe('Inmaculada Concepción');
    expect(holidayOn('2026-10-13')).toBeNull();
  });
});

describe('negocios de ejemplo', () => {
  it('usan NIT con dígito de verificación válido', () => {
    // Ejemplo publicado por la DIAN: 800.197.268 → DV 4.
    expect(nitDv('800197268')).toBe(4);
    for (const id of PRESETS) {
      const [base, dv] = BUSINESSES[id].nit.split('-');
      expect(nitDv(base)).toBe(Number(dv));
    }
  });

  it('valida celulares colombianos y correos', () => {
    expect(normalizeMobile('300 555 0123')).toBe('+57 300 555 0123');
    expect(normalizeMobile('+57 (315) 555-0199')).toBe('+57 315 555 0199');
    expect(normalizeMobile('601 555 0142')).toBeNull();
    expect(normalizeMobile('30055501')).toBeNull();
    expect(isEmail('ana@example.com')).toBe(true);
    expect(isEmail('ana@example')).toBe(false);
  });
});

describe('datos de ejemplo', () => {
  it('genera reservas alrededor de hoy, sin cruces y siempre iguales para la misma fecha', () => {
    const s = fresh();
    for (const id of PRESETS) {
      const list = s.data[id].bookings;
      expect(list.length).toBeGreaterThan(40);
      expect(overlapsIn(BUSINESSES[id], list)).toEqual([]);
      expect(list.some((b) => b.date < TODAY)).toBe(true);
      expect(list.some((b) => b.date > TODAY)).toBe(true);
      // Nada antes de tres semanas ni después de dos.
      expect(list.every((b) => b.date >= addDays(TODAY, -21) && b.date <= addDays(TODAY, 13))).toBe(true);
      // Las citas futuras no pueden estar «Llegó» ni «No asistió».
      expect(list.filter((b) => b.date > TODAY).every((b) => b.status !== 'attended' && b.status !== 'noshow')).toBe(true);
    }
    expect(JSON.stringify(buildState(TODAY, NOW_MIN))).toBe(JSON.stringify(s));
  });

  it('no agenda nada en festivos para negocios que cierran', () => {
    const s = buildState('2026-10-14', 8 * 60);
    expect(s.data.odontologia.bookings.some((b) => b.date === '2026-10-12')).toBe(false);
    expect(s.data.estetica.bookings.some((b) => b.date === '2026-10-12')).toBe(false);
  });
});

describe('disponibilidad', () => {
  const biz = BUSINESSES.odontologia;

  it('respeta duración, alistamiento y reservas existentes', () => {
    const s = fresh();
    const bookings = s.data.odontologia.bookings;
    const date = '2026-10-13'; // martes
    const slots = freeSlots(biz, bookings, { serviceId: 'limpieza', staffId: 'paola', locationId: 'cedritos', date, now: NOW });
    expect(slots.length).toBeGreaterThan(0);
    const svc = serviceOf(biz, 'limpieza')!;
    const taken = bookings.filter((b) => b.staffId === 'paola' && b.date === date && b.status !== 'cancelled');
    for (const sl of slots) {
      const end = sl.start + svc.duration + svc.buffer;
      for (const b of taken) {
        const bEnd = b.end + (serviceOf(biz, b.serviceId)?.buffer ?? 0);
        expect(sl.start < bEnd && b.start < end).toBe(false);
      }
      // Dentro del turno de Paola (7–13 y 14–19).
      expect((sl.start >= 7 * 60 && sl.start + svc.duration <= 13 * 60) || (sl.start >= 14 * 60 && sl.start + svc.duration <= 19 * 60)).toBe(true);
    }
  });

  it('marca días pasados, festivos, cerrados y fuera de rango', () => {
    const q = { serviceId: 'limpieza', staffId: 'any', locationId: 'cedritos', now: NOW };
    const bookings = fresh().data.odontologia.bookings;
    expect(dayInfo(biz, bookings, q, '2026-10-09').kind).toBe('past');
    expect(dayInfo(biz, bookings, q, '2026-10-12').kind).toBe('holiday');
    expect(dayInfo(biz, bookings, q, '2026-10-11').kind).toBe('closed'); // domingo
    expect(dayInfo(biz, bookings, q, addDays(TODAY, biz.horizonDays + 1)).kind).toBe('beyond');
    expect(dayInfo(biz, bookings, q, '2026-10-20').kind).toBe('open');
  });

  it('no ofrece horas que ya pasaron hoy (con la anticipación mínima)', () => {
    const slots = freeSlots(biz, [], { serviceId: 'limpieza', staffId: 'any', locationId: 'cedritos', date: TODAY, now: NOW });
    expect(slots.every((sl) => sl.start >= NOW_MIN + biz.leadMinutes)).toBe(true);
  });

  it('las canchas atienden festivos con el horario del domingo', () => {
    const canchas = BUSINESSES.canchas;
    const q = { serviceId: 'f5-60', staffId: 'any', locationId: 'sur', now: NOW };
    expect(dayInfo(canchas, [], q, '2026-10-12').kind).toBe('open');
    const slots = freeSlots(canchas, [], { ...q, date: '2026-10-12' });
    expect(slots[0].start).toBe(7 * 60);
    expect(slots[slots.length - 1].start).toBe(20 * 60);
  });

  it('calcula el abono y la política de cancelación', () => {
    expect(depositOf(serviceOf(biz, 'limpieza')!)).toBe(42000);
    const b = { ...fresh().data.odontologia.bookings[0], date: '2026-10-11', start: 9 * 60 };
    expect(freeCancellation(biz, b, NOW)).toBe(false); // faltan menos de 24 h
    expect(freeCancellation(biz, { ...b, date: '2026-10-13' }, NOW)).toBe(true);
  });
});

describe('filtros e indicadores', () => {
  it('los filtros de fecha usan la fecha real y no vacían la tabla', () => {
    const list = fresh().data.odontologia.bookings;
    const week = filterBookings(list, { ...EMPTY_FILTERS, range: 'week' }, TODAY);
    expect(week.length).toBeGreaterThan(0);
    expect(week.every((b) => b.date >= '2026-10-05' && b.date <= '2026-10-11')).toBe(true);
    expect(filterBookings(list, { ...EMPTY_FILTERS, range: 'month' }, TODAY).every((b) => b.date.startsWith('2026-10'))).toBe(true);
    expect(filterBookings(list, { ...EMPTY_FILTERS, range: 'all' }, TODAY)).toHaveLength(list.length);
    const one = list[3];
    const byCode = filterBookings(list, { ...EMPTY_FILTERS, range: 'all', q: one.code.toLowerCase() }, TODAY);
    expect(byCode.map((b) => b.id)).toContain(one.id);
    const desc = filterBookings(list, { ...EMPTY_FILTERS, range: 'all', sort: 'desc' }, TODAY);
    expect(desc[0].date >= desc[desc.length - 1].date).toBe(true);
  });

  it('los indicadores se calculan con las reservas', () => {
    const biz = BUSINESSES.odontologia;
    const list = fresh().data.odontologia.bookings;
    const k = kpis(biz, list, TODAY, 'all');
    expect(k.occupancy).toBeGreaterThan(0);
    expect(k.occupancy).toBeLessThanOrEqual(1);
    expect(k.noShows + k.attended).toBeGreaterThan(0);
    const total = Object.values(k.byChannel).reduce((a, n) => a + n, 0);
    expect(total).toBe(k.byService.reduce((a, s) => a + s.count, 0));
  });
});

describe('reducer', () => {
  const input = (over: Partial<NewBookingInput> = {}): NewBookingInput => ({
    serviceId: 'limpieza',
    staffId: 'paola',
    locationId: 'cedritos',
    date: '2026-10-15',
    start: 10 * 60,
    client: { name: 'Juliana Ríos', phone: '+57 300 555 0123', email: 'juliana@example.com' },
    channel: 'web',
    status: 'confirmed',
    payment: { kind: 'deposit', method: 'pse', amount: 42000, ref: 'SIM-123456' },
    notes: '',
    remind: { whatsapp: true, email: true },
    ...over,
  });

  it('la reserva del cliente llega a la agenda con sus mensajes de confirmación', () => {
    const s0 = fresh();
    const s1 = reducer(s0, { type: 'create', input: input(), at: AT })!;
    const id = `n${s0.seq + 1}`;
    const b = s1.data.odontologia.bookings.find((x) => x.id === id)!;
    expect(b).toBeDefined();
    expect(s1.lastBookingId).toBe(id);
    expect(b.end).toBe(10 * 60 + 45);
    expect(b.source).toBe('session');
    const msgs = s1.data.odontologia.messages.filter((m) => m.bookingId === id);
    expect(msgs.map((m) => `${m.kind}/${m.channel}`).sort()).toEqual(['confirmation/email', 'confirmation/whatsapp']);
    expect(overlapsIn(BUSINESSES.odontologia, s1.data.odontologia.bookings)).toEqual([]);
  });

  it('guarda notas, cambia estados, reprograma, responde y elimina', () => {
    let s = reducer(fresh(), { type: 'create', input: input({ remind: { whatsapp: true, email: false } }), at: AT })!;
    const id = s.lastBookingId!;
    s = reducer(s, { type: 'note', id, notes: 'Primera vez', at: AT })!;
    expect(s.data.odontologia.bookings.find((b) => b.id === id)!.notes).toBe('Primera vez');

    s = reducer(s, { type: 'reschedule', id, date: '2026-10-16', start: 15 * 60, staffId: 'paola', at: AT })!;
    let b = s.data.odontologia.bookings.find((x) => x.id === id)!;
    expect([b.date, b.start, b.end]).toEqual(['2026-10-16', 900, 945]);
    expect(s.data.odontologia.messages.some((m) => m.bookingId === id && m.kind === 'reschedule')).toBe(true);

    s = reducer(s, { type: 'status', id, status: 'pending', at: AT })!;
    s = reducer(s, { type: 'send', bookingIds: [id], kind: 'reminder', channels: ['whatsapp', 'email'], at: AT })!;
    const reminders = s.data.odontologia.messages.filter((m) => m.bookingId === id && m.kind === 'reminder');
    // Solo por el canal que eligió el cliente.
    expect(reminders.map((m) => m.channel)).toEqual(['whatsapp']);
    s = reducer(s, { type: 'reply', messageId: reminders[0].id, reply: 'confirmed', at: AT })!;
    b = s.data.odontologia.bookings.find((x) => x.id === id)!;
    expect(b.status).toBe('confirmed');

    s = reducer(s, { type: 'status', id, status: 'cancelled', at: AT })!;
    expect(s.data.odontologia.messages.some((m) => m.bookingId === id && m.kind === 'cancellation')).toBe(true);

    s = reducer(s, { type: 'delete', id })!;
    expect(s.data.odontologia.bookings.some((x) => x.id === id)).toBe(false);
    expect(s.data.odontologia.messages.some((m) => m.bookingId === id)).toBe(false);
    expect(s.lastBookingId).toBeNull();
  });

  it('cada negocio de ejemplo guarda sus propias reservas', () => {
    let s = reducer(fresh(), { type: 'preset', preset: 'canchas' })!;
    const before = s.data.odontologia.bookings.length;
    s = reducer(s, {
      type: 'create',
      input: input({ serviceId: 'f5-60', staffId: 'c1', locationId: 'sur', date: '2026-10-20', start: 20 * 60, payment: { kind: 'deposit', method: 'nequi', amount: 60000, ref: 'SIM-1' } }),
      at: AT,
    })!;
    expect(s.data.odontologia.bookings).toHaveLength(before);
    expect(s.data.canchas.bookings.some((b) => b.id === s.lastBookingId)).toBe(true);
  });
});

describe('archivos', () => {
  const biz = BUSINESSES.odontologia;
  const b = fresh().data.odontologia.bookings.find((x) => x.date > TODAY)!;
  const text = { title: 'Limpieza dental · Clínica', description: 'Código R-1001; llama al +57, por favor', location: 'Calle 140 # 13-25' };

  it('genera un .ics válido con la hora en UTC y un aviso 24 h antes', () => {
    const ics = buildIcs([{ booking: b, text }], AT, 'Tu cita es en 24 horas');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain(`DTSTART:${utcCompact(b.date, b.start)}`);
    expect(ics).toContain('TRIGGER:-PT24H');
    expect(ics).toContain('Código R-1001\\; llama al +57\\, por favor');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('arma el enlace de Google Calendar con el evento prellenado', () => {
    const url = new URL(googleCalendarUrl(b, text));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe(`${utcCompact(b.date, b.start)}/${utcCompact(b.date, b.end)}`);
    expect(biz.name).toBeTruthy();
  });

  it('escapa el CSV y agrega BOM para Excel', () => {
    const csv = toCsv(
      [
        ['Código', 'Notas'],
        ['R-1', 'dice "hola"; adiós'],
      ],
      ';',
    );
    expect(csv.startsWith('﻿Código;Notas\r\n')).toBe(true);
    expect(csv).toContain('R-1;"dice ""hola""; adiós"');
  });
});
