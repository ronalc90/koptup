/**
 * Cambios de un sobre (funciones puras). Cada paso deja un evento encadenado
 * en la evidencia: lo usan el reducer de la demo y los datos de ejemplo.
 */
import { addDays, addMinutes } from './dates';
import { SENDER_IP } from './data';
import { acts, appendEvent, pendingSigners } from './logic';
import { SYSTEM, YOU, type AuthMethod, type Channel, type Envelope, type EvEvent, type EventType, type SignatureMark, type Stamp } from './types';

export interface Where {
  ip: string;
  device: string;
  geo: string;
}

export const NOWHERE: Where = { ip: '', device: '', geo: '' };

export function senderWhere(device: string, geo = 'Bogotá'): Where {
  return { ip: SENDER_IP, device, geo };
}

export function withEvent(env: Envelope, type: EventType, at: Stamp, actor: string, where: Where, detail: Record<string, string> = {}): Envelope {
  const e: Omit<EvEvent, 'hash' | 'prev'> = { id: `${env.id}-e${env.events.length + 1}`, type, at, actor, ip: where.ip, device: where.device, geo: where.geo, detail };
  return { ...env, events: appendEvent(env.doc.hash, env.events, e), updatedAt: at };
}

function channelOf(env: Envelope, signerId: string): Channel {
  return env.signers.find((s) => s.id === signerId)?.channel ?? 'email';
}

/** Envía el sobre: queda "Enviado" y se notifica a quien firma primero (o a todos en paralelo). */
export function sendEnvelope(env: Envelope, at: Stamp, sender: Where): Envelope {
  let next: Envelope = { ...env, status: 'sent', sentAt: at, expiresAt: addDays(at, env.expiryDays) };
  if (!next.events.some((e) => e.type === 'created')) next = withEvent(next, 'created', env.createdAt, YOU, sender, { signers: String(env.signers.length) });
  if (env.redlines && env.comments.length) {
    next = withEvent(next, 'commentsResolved', at, YOU, sender, {
      accepted: String(env.comments.filter((c) => c.status === 'accepted').length),
      rejected: String(env.comments.filter((c) => c.status === 'rejected').length),
    });
  }
  const first = env.mode === 'parallel' ? env.signers.filter(acts) : env.signers.filter(acts).slice(0, 1);
  for (const s of first) next = withEvent(next, 'sent', at, SYSTEM, NOWHERE, { to: s.name, channel: s.channel });
  return next;
}

export function markViewed(env: Envelope, signerId: string, at: Stamp, where: Where): Envelope {
  const s = env.signers.find((x) => x.id === signerId);
  if (!s || s.state !== 'pending') return env;
  const next = { ...env, signers: env.signers.map((x) => (x.id === signerId ? { ...x, state: 'viewed' as const } : x)) };
  return withEvent(next, 'viewed', at, s.name, where);
}

export function codeSent(env: Envelope, signerId: string, at: Stamp): Envelope {
  const s = env.signers.find((x) => x.id === signerId);
  if (!s) return env;
  const channel: Channel = env.auth === 'smsOtp' ? 'sms' : env.auth === 'whatsappOtp' ? 'whatsapp' : 'email';
  return withEvent(env, 'codeSent', at, SYSTEM, NOWHERE, { to: s.name, channel });
}

export function authenticate(env: Envelope, signerId: string, at: Stamp, where: Where, method: AuthMethod): Envelope {
  const s = env.signers.find((x) => x.id === signerId);
  if (!s) return env;
  return withEvent(env, 'authenticated', at, s.name, where, { method });
}

/** Firma (o aprueba). Si era el último, el sobre se completa; si es secuencial, se notifica al siguiente. */
export function signEnvelope(env: Envelope, signerId: string, at: Stamp, where: Where, mark: SignatureMark, values: Record<string, string> = {}): Envelope {
  const s = env.signers.find((x) => x.id === signerId);
  if (!s || s.state === 'signed') return env;
  let next: Envelope = {
    ...env,
    signers: env.signers.map((x) => (x.id === signerId ? { ...x, state: 'signed' as const, signedAt: at, signature: mark, values } : x)),
  };
  next = withEvent(next, s.role === 'approver' ? 'approved' : 'signed', at, s.name, where, s.role === 'approver' ? {} : { kind: mark.kind, sigType: env.sigType });
  const pending = pendingSigners(next);
  if (pending.length === 0) {
    next = { ...next, status: 'completed', completedAt: at };
    next = withEvent(next, 'completed', at, SYSTEM, NOWHERE);
    if (next.timestamp) next = withEvent(next, 'sealed', addMinutes(at, 0), SYSTEM, NOWHERE);
    for (const cc of next.signers.filter((x) => x.role === 'cc')) next = withEvent(next, 'copySent', at, SYSTEM, NOWHERE, { to: cc.name, channel: cc.channel });
    return next;
  }
  next = { ...next, status: 'partial' };
  if (next.mode === 'sequential') next = withEvent(next, 'sent', at, SYSTEM, NOWHERE, { to: pending[0].name, channel: channelOf(next, pending[0].id) });
  return next;
}

/** Recordatorio manual a quien le toca (secuencial) o a todos los que faltan (paralelo). */
export function remind(env: Envelope, at: Stamp, sender: Where): Envelope {
  if (env.status !== 'sent' && env.status !== 'partial') return env;
  const targets = env.mode === 'parallel' ? pendingSigners(env) : pendingSigners(env).slice(0, 1);
  let next = env;
  for (const s of targets) next = withEvent(next, 'reminder', at, YOU, sender, { to: s.name, channel: s.channel });
  return next;
}

export function voidEnvelope(env: Envelope, at: Stamp, sender: Where): Envelope {
  if (env.status !== 'sent' && env.status !== 'partial') return env;
  return withEvent({ ...env, status: 'voided' }, 'voided', at, YOU, sender);
}

/** Vence los sobres pendientes cuya fecha límite ya pasó. */
export function expireIfDue(env: Envelope, now: Stamp): Envelope {
  if ((env.status !== 'sent' && env.status !== 'partial') || !env.expiresAt || env.expiresAt > now) return env;
  return withEvent({ ...env, status: 'expired' }, 'expired', env.expiresAt, SYSTEM, NOWHERE);
}
