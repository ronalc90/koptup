/**
 * Cambios de estado de la demo. Cada acción que toca una reserva deja su
 * rastro en el historial; los mensajes son simulados (solo se registran).
 */
import { hhmm } from './dates';
import { serviceOf } from './engine';
import { BUSINESSES } from './presets';
import type { AppState, Booking, ISODate, MessageChannel, MessageKind, MessageLog, NewBookingInput, PresetData, PresetId, Stamp, Status } from './types';

export type Action =
  | { type: 'load'; state: AppState }
  | { type: 'preset'; preset: PresetId }
  | { type: 'create'; input: NewBookingInput; at: Stamp }
  | { type: 'status'; id: string; status: Status; at: Stamp }
  | { type: 'reschedule'; id: string; date: ISODate; start: number; staffId: string; at: Stamp }
  | { type: 'note'; id: string; notes: string; at: Stamp }
  | { type: 'delete'; id: string }
  | { type: 'send'; bookingIds: string[]; kind: MessageKind; channels: MessageChannel[]; at: Stamp }
  | { type: 'reply'; messageId: string; reply: 'confirmed' | 'reschedule'; at: Stamp };

function withData(s: AppState, fn: (d: PresetData) => PresetData): AppState {
  return { ...s, data: { ...s.data, [s.preset]: fn(s.data[s.preset]) } };
}

function patchBooking(s: AppState, id: string, fn: (b: Booking) => Booking): AppState {
  return withData(s, (d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? fn(b) : b)) }));
}

/** Agrega mensajes simulados (el correo solo si la reserva tiene correo). */
function addMessages(s: AppState, ids: string[], kind: MessageKind, channels: MessageChannel[], at: Stamp): AppState {
  let seq = s.seq;
  const d = s.data[s.preset];
  const logs: MessageLog[] = [];
  const touched = new Set<string>();
  for (const id of ids) {
    const b = d.bookings.find((x) => x.id === id);
    if (!b) continue;
    for (const ch of channels) {
      if (ch === 'email' && !b.client.email) continue;
      if (ch === 'whatsapp' && !b.client.phone) continue;
      // Los recordatorios respetan el canal que eligió el cliente.
      if (kind === 'reminder' && !b.remind[ch]) continue;
      seq += 1;
      logs.push({ id: `m${seq}`, bookingId: id, kind, channel: ch, at, reply: null });
      touched.add(id);
    }
  }
  if (!logs.length) return s;
  const next = { ...s, seq };
  return withData(next, (pd) => ({
    messages: [...pd.messages, ...logs],
    bookings: pd.bookings.map((b) => (touched.has(b.id) ? { ...b, history: [...b.history, { at, kind: 'message' as const, detail: kind }] } : b)),
  }));
}

function sortBookings(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));
}

export function reducer(state: AppState | null, action: Action): AppState | null {
  if (action.type === 'load') return action.state;
  if (!state) return state;
  const biz = BUSINESSES[state.preset];

  switch (action.type) {
    case 'preset':
      return { ...state, preset: action.preset, lastBookingId: null };

    case 'create': {
      const { input, at } = action;
      const svc = serviceOf(biz, input.serviceId);
      if (!svc) return state;
      const seq = state.seq + 1;
      const booking: Booking = {
        id: `n${seq}`,
        code: `R-${1000 + seq}`,
        serviceId: input.serviceId,
        staffId: input.staffId,
        locationId: input.locationId,
        date: input.date,
        start: input.start,
        end: input.start + svc.duration,
        client: input.client,
        channel: input.channel,
        status: input.status,
        payment: input.payment,
        notes: input.notes,
        remind: input.remind,
        createdAt: at,
        source: 'session',
        history: [{ at, kind: 'created', detail: input.channel }],
      };
      const next = withData({ ...state, seq, lastBookingId: booking.id }, (d) => ({ ...d, bookings: sortBookings([...d.bookings, booking]) }));
      const channels: MessageChannel[] = [];
      if (input.remind.whatsapp) channels.push('whatsapp');
      if (input.remind.email) channels.push('email');
      return addMessages(next, [booking.id], 'confirmation', channels, at);
    }

    case 'status': {
      const current = state.data[state.preset].bookings.find((b) => b.id === action.id);
      if (!current || current.status === action.status) return state;
      const next = patchBooking(state, action.id, (b) => ({
        ...b,
        status: action.status,
        history: [...b.history, { at: action.at, kind: 'status', detail: action.status }],
      }));
      return action.status === 'cancelled' ? addMessages(next, [action.id], 'cancellation', ['whatsapp'], action.at) : next;
    }

    case 'reschedule': {
      const svc = (b: Booking) => serviceOf(biz, b.serviceId);
      const next = patchBooking(state, action.id, (b) => ({
        ...b,
        date: action.date,
        start: action.start,
        end: action.start + (svc(b)?.duration ?? b.end - b.start),
        staffId: action.staffId,
        status: b.status === 'cancelled' || b.status === 'noshow' ? 'confirmed' : b.status,
        history: [...b.history, { at: action.at, kind: 'rescheduled', detail: `${b.date} ${hhmm(b.start)}` }],
      }));
      const sorted = withData({ ...next, lastBookingId: action.id }, (d) => ({ ...d, bookings: sortBookings(d.bookings) }));
      return addMessages(sorted, [action.id], 'reschedule', ['whatsapp'], action.at);
    }

    case 'note':
      return patchBooking(state, action.id, (b) => ({
        ...b,
        notes: action.notes,
        history: [...b.history, { at: action.at, kind: 'note', detail: '' }],
      }));

    case 'delete':
      return withData({ ...state, lastBookingId: state.lastBookingId === action.id ? null : state.lastBookingId }, (d) => ({
        bookings: d.bookings.filter((b) => b.id !== action.id),
        messages: d.messages.filter((m) => m.bookingId !== action.id),
      }));

    case 'send':
      return addMessages(state, action.bookingIds, action.kind, action.channels, action.at);

    case 'reply': {
      const msg = state.data[state.preset].messages.find((m) => m.id === action.messageId);
      if (!msg || msg.reply) return state;
      const next = withData(state, (d) => ({ ...d, messages: d.messages.map((m) => (m.id === msg.id ? { ...m, reply: action.reply } : m)) }));
      return patchBooking(next, msg.bookingId, (b) => ({
        ...b,
        status: action.reply === 'confirmed' && b.status === 'pending' ? 'confirmed' : b.status,
        history: [...b.history, { at: action.at, kind: 'reply', detail: action.reply }],
      }));
    }

    default:
      return state;
  }
}
