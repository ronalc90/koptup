/**
 * Sobres de ejemplo con fechas relativas a hoy (hora de Colombia). Se arman con
 * las mismas funciones que usa la demo, así la evidencia de cada uno es una
 * cadena de hashes válida y distinta.
 */
import { addDays, addMinutes, dayOf, type Loc } from './dates';
import {
  AUTH_BY_TEMPLATE,
  DATE_VARS,
  STATE_VERSION,
  TEMPLATE_SUBJECT_VAR,
  TEMPLATE_VARS,
  defaultSigners,
  suggestedFields,
  type BuiltinTemplateId,
} from './data';
import { authenticate, codeSent, expireIfDue, markViewed, remind, sendEnvelope, senderWhere, signEnvelope, type Where } from './actions';
import { renderTemplate, sampleDate } from './logic';
import { sha256Hex } from './sha256';
import type { DemoState, Draft, Envelope, SignMode, Stamp } from './types';

export interface TemplateText {
  body: (id: BuiltinTemplateId) => string;
  sample: (id: BuiltinTemplateId) => Record<string, string>;
}

/** Valores de ejemplo de una plantilla: textos traducidos y fechas calculadas con hoy. */
export function templateSample(id: BuiltinTemplateId, now: Stamp, loc: Loc, text: TemplateText): Record<string, string> {
  const sample = text.sample(id);
  const out: Record<string, string> = {};
  for (const v of TEMPLATE_VARS[id]) out[v] = DATE_VARS[v] ? sampleDate(DATE_VARS[v], now, loc) : (sample[v] ?? '');
  return out;
}

export function emptyDraft(): Draft {
  return {
    editingId: null,
    step: 0,
    title: '',
    subject: '',
    doc: null,
    signers: [],
    fields: [],
    mode: 'sequential',
    auth: 'emailOtp',
    sigType: 'electronic',
    expiryDays: 15,
    reminderDays: 3,
    timestamp: true,
    redlines: false,
    comments: [],
  };
}

function at(now: Stamp, daysAgo: number, hh: number, mm: number): Stamp {
  return `${dayOf(addDays(now, -daysAgo))}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
}

const SENDER: Where = senderWhere('Chrome · Windows');

function base(
  id: string,
  tpl: BuiltinTemplateId,
  createdAt: Stamp,
  now: Stamp,
  loc: Loc,
  text: TemplateText,
  opts: { mode?: SignMode; expiryDays?: number; reminderDays?: number; timestamp?: boolean } = {},
): Envelope {
  const vars = templateSample(tpl, now, loc, text);
  const subject = vars[TEMPLATE_SUBJECT_VAR[tpl]];
  const signers = defaultSigners(tpl, subject, `${id}-s`);
  return {
    id,
    title: '',
    subject,
    doc: { kind: 'template', templateId: tpl, vars, hash: sha256Hex(renderTemplate(text.body(tpl), vars)) },
    signers,
    fields: suggestedFields(signers, `${id}-f`),
    mode: opts.mode ?? 'sequential',
    auth: AUTH_BY_TEMPLATE[tpl],
    sigType: 'electronic',
    expiryDays: opts.expiryDays ?? 15,
    reminderDays: opts.reminderDays ?? 3,
    timestamp: opts.timestamp ?? true,
    redlines: false,
    comments: [],
    status: 'draft',
    createdAt,
    updatedAt: createdAt,
    events: [],
    origin: 'seed',
  };
}

/** Recorrido completo de un firmante: abre, recibe el código, se verifica y firma. */
function signFlow(env: Envelope, idx: number, start: Stamp, where: Where): Envelope {
  const s = env.signers[idx];
  let next = markViewed(env, s.id, start, where);
  next = codeSent(next, s.id, addMinutes(start, 1));
  next = authenticate(next, s.id, addMinutes(start, 2), where, env.auth);
  return signEnvelope(next, s.id, addMinutes(start, 3), where, s.role === 'approver' ? { kind: 'approve' } : { kind: 'type', text: s.name });
}

const W = {
  bogMobile: { ip: '198.51.100.23', device: 'Chrome · Android', geo: 'Bogotá' },
  soacha: { ip: '198.51.100.41', device: 'Chrome · Android', geo: 'Soacha' },
  hr: { ip: '198.51.100.12', device: 'Edge · Windows', geo: 'Bogotá' },
  legal: { ip: '198.51.100.15', device: 'Safari · iOS', geo: 'Bogotá' },
  medellin: { ip: '198.51.100.67', device: 'Safari · iOS', geo: 'Medellín' },
  chia: { ip: '198.51.100.88', device: 'Chrome · macOS', geo: 'Chía' },
  warehouse: { ip: '198.51.100.30', device: 'Chrome · Android', geo: 'Funza' },
};

export function buildSeed(nowExact: Stamp, loc: Loc, text: TemplateText): DemoState {
  // Los datos de ejemplo usan minutos redondos.
  const now = `${nowExact.slice(0, 16)}:00`;
  const envs: Envelope[] = [];

  // 1. Contrato de trabajo: firmado hace 3 días (trabajador, RRHH aprueba, representante legal).
  let e = base('SOB-0001', 'employment', at(now, 3, 8, 10), now, loc, text);
  e = sendEnvelope(e, at(now, 3, 8, 12), SENDER);
  e = signFlow(e, 0, at(now, 3, 9, 40), W.bogMobile);
  e = signFlow(e, 1, at(now, 3, 11, 2), W.hr);
  e = signFlow(e, 2, at(now, 3, 15, 26), W.legal);
  envs.push(e);

  // 2. Otrosí: la trabajadora ya firmó; falta el representante legal.
  e = base('SOB-0002', 'salaryAddendum', at(now, 1, 10, 0), now, loc, text, { expiryDays: 10 });
  e = sendEnvelope(e, at(now, 1, 10, 3), SENDER);
  e = signFlow(e, 0, at(now, 1, 16, 17), W.medellin);
  envs.push(e);

  // 3. Acta de dotación: enviada hoy y abierta por el trabajador.
  const sent3 = addMinutes(now, -95);
  e = base('SOB-0003', 'uniform', addMinutes(sent3, -4), now, loc, text, { expiryDays: 7 });
  e = sendEnvelope(e, sent3, SENDER);
  e = markViewed(e, e.signers[0].id, addMinutes(now, -32), W.warehouse);
  envs.push(e);

  // 4. Consentimiento del examen de ingreso: firmado hace 6 días, copia al archivo.
  e = base('SOB-0004', 'medicalConsent', at(now, 6, 7, 45), now, loc, text, { expiryDays: 5, reminderDays: 1 });
  e = sendEnvelope(e, at(now, 6, 7, 46), SENDER);
  e = signFlow(e, 0, at(now, 6, 8, 20), W.chia);
  envs.push(e);

  // 5. Arrendamiento de la bodega: firmado hace 3 semanas, en paralelo.
  e = base('SOB-0005', 'lease', at(now, 24, 14, 0), now, loc, text, { mode: 'parallel', expiryDays: 20 });
  e = sendEnvelope(e, at(now, 24, 14, 5), SENDER);
  e = signFlow(e, 1, at(now, 23, 9, 12), W.legal);
  e = signFlow(e, 0, at(now, 22, 17, 48), { ip: '198.51.100.140', device: 'Edge · Windows', geo: 'Bogotá' });
  envs.push(e);

  // 6. Autorización de datos: nadie la firmó y venció.
  e = base('SOB-0006', 'dataPolicy', at(now, 20, 9, 30), now, loc, text, { expiryDays: 15, reminderDays: 5 });
  e = sendEnvelope(e, at(now, 20, 9, 31), SENDER);
  e = remind(e, at(now, 15, 9, 31), SENDER);
  e = remind(e, at(now, 10, 9, 31), SENDER);
  e = expireIfDue(e, now);
  envs.push(e);

  // 7. Orden de compra: borrador sin enviar.
  e = base('SOB-0007', 'purchaseOrder', at(now, 1, 15, 20), now, loc, text);
  envs.push(e);

  // 8. Paz y salvo: enviado hace 2 días, con un recordatorio.
  e = base('SOB-0008', 'clearance', at(now, 2, 11, 0), now, loc, text);
  e = sendEnvelope(e, at(now, 2, 11, 2), SENDER);
  e = remind(e, at(now, 1, 11, 2), SENDER);
  envs.push(e);

  return {
    version: STATE_VERSION,
    baseDate: dayOf(now),
    seq: 8,
    envelopes: envs.reverse(),
    templates: [],
    draft: emptyDraft(),
  };
}

