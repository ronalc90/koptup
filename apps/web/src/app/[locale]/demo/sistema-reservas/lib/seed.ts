/**
 * Reservas de ejemplo generadas a partir del día en que se abre la demo: las
 * tres semanas anteriores (atendidas, ausencias y cancelaciones) y las dos
 * siguientes (confirmadas y pendientes). Para la misma fecha y hora siempre
 * salen los mismos datos.
 */
import { addDays, stampOf, weekday } from './dates';
import { depositOf, serviceOf, shiftsOn } from './engine';
import { BUSINESSES } from './presets';
import { PRESETS, type AppState, type Booking, type Business, type Channel, type ISODate, type MessageLog, type PayMethod, type PresetData, type Status } from './types';

export const STATE_VERSION = 1;
const PAST_DAYS = 21;
const FUTURE_DAYS = 13;

const NAMES = [
  'Juliana Ríos',
  'Santiago Herrera',
  'Valeria Cárdenas',
  'Mateo Londoño',
  'Daniela Pineda',
  'Sebastián Muñoz',
  'Mariana Arango',
  'Nicolás Bermúdez',
  'Camila Salazar',
  'Felipe Quintero',
  'Laura Vélez',
  'Andrés Castaño',
  'Sara Montoya',
  'Juan Pablo Giraldo',
  'Isabella Duarte',
  'Tomás Becerra',
  'Natalia Ocampo',
  'Alejandro Cifuentes',
  'Manuela Jaramillo',
  'David Rincón',
  'Gabriela Torres',
  'Samuel Cardona',
  'Paula Benavides',
  'Esteban Mejía',
  'Luisa Fernanda Ruiz',
  'Diego Chaparro',
  'Carlos Andrés Peña',
  'Melissa Acosta',
  'Julián Patiño',
  'Catalina Espinosa',
  'Miguel Ángel Rozo',
  'Ana María Cortés',
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');

function probability(biz: Business, offset: number, start: number, wd: number): number {
  let p = offset < 0 ? 0.55 : offset === 0 ? 0.58 : Math.max(0.12, 0.55 - offset * 0.035);
  if (biz.staffKind === 'court') {
    const weekend = wd === 0 || wd === 6;
    if (start >= 18 * 60) p += 0.3;
    else if (!weekend) p -= 0.3;
  }
  return Math.min(0.92, Math.max(0.05, p));
}

interface Counter {
  n: number;
}

function seedPreset(biz: Business, today: ISODate, nowMin: number, counter: Counter): PresetData {
  const rnd = prng(hash(`${biz.id}|${today}`));
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
  const bookings: Booking[] = [];

  for (let offset = -PAST_DAYS; offset <= FUTURE_DAYS; offset++) {
    const date = addDays(today, offset);
    for (const staff of biz.staff) {
      for (const sh of shiftsOn(biz, staff, date)) {
        let t = sh.start;
        while (t < sh.end) {
          if (rnd() >= probability(biz, offset, t, weekday(date))) {
            t += biz.step;
            continue;
          }
          const options = staff.services.map((id) => serviceOf(biz, id)!).filter((s) => t + s.duration <= sh.end);
          if (!options.length) break;
          const svc = pick(options);
          const end = t + svc.duration;
          const finished = offset < 0 || (offset === 0 && end <= nowMin);
          const inProgress = offset === 0 && t <= nowMin && nowMin < end;
          const r = rnd();
          let status: Status;
          if (finished) status = r < 0.08 ? 'noshow' : r < 0.17 ? 'cancelled' : 'attended';
          else if (inProgress) status = 'attended';
          else status = r < 0.07 ? 'cancelled' : r < 0.32 ? 'pending' : 'confirmed';

          const rc = rnd();
          const channel: Channel = rc < 0.55 ? 'web' : rc < 0.85 ? 'whatsapp' : rc < 0.97 ? 'phone' : 'walkin';
          const online = channel === 'web' && svc.deposit > 0;
          const method: PayMethod = online ? pick<PayMethod>(['pse', 'nequi', 'card']) : 'onsite';
          const name = pick(NAMES);
          const phone = `+57 3${String(10 + Math.floor(rnd() * 13))} 555 ${String(Math.floor(rnd() * 10000)).padStart(4, '0')}`;
          const back = 1 + Math.floor(rnd() * 9);
          const created = addDays(date, -back) < addDays(today, -1) ? addDays(date, -back) : addDays(today, -1);
          const createdAt = stampOf(created, 8 * 60 + Math.floor(rnd() * 24) * 30);
          counter.n += 1;
          const b: Booking = {
            id: `s${counter.n}`,
            code: `R-${1000 + counter.n}`,
            serviceId: svc.id,
            staffId: staff.id,
            locationId: sh.loc,
            date,
            start: t,
            end,
            client: { name, phone, email: channel === 'web' ? `${slug(name)}@example.com` : '' },
            channel,
            status,
            payment: online
              ? { kind: 'deposit', method, amount: depositOf(svc), ref: `SIM-${String(100000 + Math.floor(rnd() * 900000))}` }
              : { kind: 'none', method: 'onsite', amount: 0, ref: null },
            notes: '',
            remind: { whatsapp: true, email: channel === 'web' },
            createdAt,
            source: 'seed',
            history: [{ at: createdAt, kind: 'created', detail: channel }],
          };
          if (status !== 'pending' && status !== 'confirmed') {
            b.history.push({ at: stampOf(date, status === 'cancelled' ? Math.max(0, t - 120) : end), kind: 'status', detail: status });
          }
          bookings.push(b);
          t = Math.ceil((end + svc.buffer) / biz.step) * biz.step;
        }
      }
    }
  }

  // Recordatorios ya enviados (ayer) para las citas de hoy, con la respuesta del cliente.
  const messages: MessageLog[] = [];
  let m = 0;
  const yesterday = addDays(today, -1);
  for (const b of bookings) {
    if (b.date !== today || b.status === 'cancelled') continue;
    m += 1;
    const at = stampOf(yesterday, b.start);
    const reply = b.status === 'pending' ? null : 'confirmed';
    messages.push({ id: `${biz.id}-m${m}`, bookingId: b.id, kind: 'reminder', channel: 'whatsapp', at, reply });
    b.history.push({ at, kind: 'message', detail: 'reminder' });
    if (reply) b.history.push({ at: stampOf(yesterday, Math.min(b.start + 25, 23 * 60)), kind: 'reply', detail: reply });
  }

  bookings.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));
  return { bookings, messages };
}

export function buildState(today: ISODate, nowMin: number): AppState {
  const counter: Counter = { n: 0 };
  const data = {} as Record<(typeof PRESETS)[number], PresetData>;
  for (const id of PRESETS) data[id] = seedPreset(BUSINESSES[id], today, nowMin, counter);
  return { version: STATE_VERSION, baseDate: today, preset: 'odontologia', data, seq: counter.n, lastBookingId: null };
}

/** Comprueba que ninguna reserva se cruce con otra del mismo profesional (lo usan las pruebas). */
export function overlapsIn(biz: Business, bookings: Booking[]): string[] {
  const bad: string[] = [];
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const others = bookings.filter((o) => o.id !== b.id && o.status !== 'cancelled' && o.staffId === b.staffId && o.date === b.date);
    const bEnd = b.end + (serviceOf(biz, b.serviceId)?.buffer ?? 0);
    for (const o of others) {
      const oEnd = o.end + (serviceOf(biz, o.serviceId)?.buffer ?? 0);
      if (b.start < oEnd && o.start < bEnd) bad.push(`${b.code}/${o.code}`);
    }
  }
  return bad;
}

