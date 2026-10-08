'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  AGENTS,
  SEED_AUTO_LOG,
  SEED_MACROS,
  SEED_PQRS_SEQ,
  SEED_SETTINGS,
  SEED_SURVEYS,
  SEED_TICKETS,
  START_CLOCK,
  type AgentId,
  type AutoLogEntry,
  type BrandId,
  type Category,
  type Channel,
  type EscalationTarget,
  type Lang,
  type Macro,
  type MacroAction,
  type MacroCondition,
  type Note,
  type PqrsType,
  type Priority,
  type Settings,
  type Survey,
  type Ticket,
  type Txt,
} from './data';
import {
  applyActions,
  autoReplyDecision,
  bumpPriority,
  classify,
  dateOfDay,
  dayOf,
  macroMatches,
  nextTicketNumber,
  normalize,
  route,
  slaRemaining,
  type Classification,
  type RouteResult,
} from './engine';

const STORAGE_KEY = 'koptup.helpdesk.v1';
const STORAGE_VERSION = 1;

export interface HelpdeskState {
  version: number;
  tickets: Ticket[];
  macros: Macro[];
  autoLog: AutoLogEntry[];
  surveys: Survey[];
  settings: Settings;
  /** Reloj de la demo en minutos desde las 00:00 del día de referencia. */
  clock: number;
  /** Contador para ids de notas, mensajes, macros y registros. */
  seq: number;
  pqrsSeq: number;
}

export function initialState(): HelpdeskState {
  return {
    version: STORAGE_VERSION,
    tickets: SEED_TICKETS,
    macros: SEED_MACROS,
    autoLog: SEED_AUTO_LOG,
    surveys: SEED_SURVEYS,
    settings: SEED_SETTINGS,
    clock: START_CLOCK,
    // Por encima de los ids de los datos de ejemplo (l1…l9, s1…s9).
    seq: 100,
    pqrsSeq: SEED_PQRS_SEQ,
  };
}

export interface IncomingInput {
  channel: Channel;
  brand: BrandId;
  customer: string;
  contact: string;
  city: string;
  text: string;
}

/** Resultado del flujo de un ticket entrante (lo muestra el aviso de enrutamiento). */
export interface IncomingResult {
  ticketId: string;
  classification: Classification;
  macros: Txt[];
  decision: AutoLogEntry['result'];
  route: RouteResult | null;
  assignee: AgentId | null;
  priority: Priority;
}

type Action =
  | { type: 'hydrate'; state: HelpdeskState }
  | { type: 'reset' }
  | { type: 'tick'; minutes: number }
  | { type: 'slaSweep' }
  | { type: 'reply'; id: string; text: string }
  | { type: 'customerReply'; id: string }
  | { type: 'note'; id: string; text: string }
  | { type: 'resolve'; id: string }
  | { type: 'reopen'; id: string }
  | { type: 'assign'; id: string; agent: AgentId | null; auto?: RouteResult }
  | { type: 'priority'; id: string; priority: Priority }
  | { type: 'category'; id: string; category: Category }
  | { type: 'escalate'; id: string; target: EscalationTarget; reason: string; raise: boolean }
  | { type: 'pqrs'; id: string; pqrsType: PqrsType | null }
  | { type: 'applyMacro'; id: string; macroId: string }
  | { type: 'incoming'; ticket: Ticket; log: AutoLogEntry; macroIds: string[]; seq: number }
  | { type: 'addMacro'; name: string; conditions: MacroCondition[]; actions: MacroAction[]; auto: boolean }
  | { type: 'toggleMacro'; macroId: string }
  | { type: 'deleteMacro'; macroId: string }
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'survey'; ticketId: string; score: number; nps: number; comment: string };

function mapTicket(state: HelpdeskState, id: string, fn: (t: Ticket) => Ticket): Ticket[] {
  return state.tickets.map((t) => (t.id === id ? fn(t) : t));
}

function note(seq: number, author: Note['author'], text: Txt, at: number): Note {
  return { id: `n${seq}`, author, text, at };
}

/** Nota de sistema que explica una asignación automática. */
function routeNote(r: RouteResult): Txt {
  const english = r.required.includes('english');
  const skill = r.required.find((x) => x !== 'english');
  return {
    k: english ? (skill ? 'notes.routedEnglish' : 'notes.routedEnglishOnly') : 'notes.routed',
    p: {
      agent: AGENTS.find((a) => a.id === r.agent)?.name ?? r.agent,
      skill: skill ? `@skills.${skill}` : '@routing.anySkill',
      count: r.candidates.length,
    },
  };
}

/** Nombre de una macro como parámetro de traducción ('@clave' o texto). */
function macroNameParam(m: Macro): string {
  return typeof m.name === 'string' ? m.name.replace(/^@+/, '') : `@${m.name.k}`;
}

function reducer(state: HelpdeskState, action: Action): HelpdeskState {
  const { clock } = state;
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'reset':
      return initialState();
    case 'tick':
      return { ...state, clock: state.clock + action.minutes };
    case 'slaSweep': {
      let seq = state.seq;
      let changed = false;
      const tickets = state.tickets.map((t) => {
        if (t.slaHandled || t.status !== 'open' || slaRemaining(t, clock) > 0) return t;
        changed = true;
        const to = bumpPriority(t.priority);
        const text: Txt =
          to === t.priority
            ? { k: 'notes.slaBreachUrgent' }
            : { k: 'notes.slaBreach', p: { from: `@priorities.${t.priority}`, to: `@priorities.${to}` } };
        return {
          ...t,
          slaHandled: true,
          priority: to,
          tags: t.tags.includes('sla-vencido') ? t.tags : [...t.tags, 'sla-vencido'],
          notes: [...t.notes, note(seq++, 'system', text, clock)],
        };
      });
      return changed ? { ...state, tickets, seq } : state;
    }
    case 'reply':
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          status: 'pending',
          messages: [...t.messages, { id: `m${state.seq}`, from: 'agent', author: 'you', text: action.text, at: clock }],
        })),
      };
    case 'customerReply':
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          status: 'open',
          messages: [...t.messages, { id: `m${state.seq}`, from: 'customer', text: { k: 'data.customerReply' }, at: clock }],
        })),
      };
    case 'note':
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({ ...t, notes: [...t.notes, note(state.seq, 'you', action.text, clock)] })),
      };
    case 'resolve':
      return {
        ...state,
        tickets: mapTicket(state, action.id, (t) => ({ ...t, status: 'resolved', resolvedAt: clock })),
      };
    case 'reopen':
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          status: 'open',
          resolvedAt: null,
          notes: [...t.notes, note(state.seq, 'you', { k: 'notes.reopened' }, clock)],
        })),
      };
    case 'assign': {
      const text: Txt | null = action.auto ? routeNote(action.auto) : null;
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          assignee: action.agent,
          notes: text ? [...t.notes, note(state.seq, 'system', text, clock)] : t.notes,
        })),
      };
    }
    case 'priority':
      return { ...state, tickets: mapTicket(state, action.id, (t) => ({ ...t, priority: action.priority })) };
    case 'category':
      return { ...state, tickets: mapTicket(state, action.id, (t) => ({ ...t, category: action.category })) };
    case 'escalate':
      return {
        ...state,
        seq: state.seq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          escalation: { target: action.target, reason: action.reason, at: clock },
          priority: action.raise ? bumpPriority(t.priority) : t.priority,
          tags: t.tags.includes('escalado') ? t.tags : [...t.tags, 'escalado'],
          notes: [
            ...t.notes,
            note(state.seq, 'you', { k: 'notes.escalated', p: { target: `@escalate.targets.${action.target}`, reason: action.reason } }, clock),
          ],
        })),
      };
    case 'pqrs': {
      const target = state.tickets.find((t) => t.id === action.id);
      if (!target) return state;
      if (action.pqrsType === null) {
        return {
          ...state,
          seq: state.seq + 1,
          tickets: mapTicket(state, action.id, (t) => ({
            ...t,
            pqrs: null,
            notes: [...t.notes, note(state.seq, 'you', { k: 'notes.pqrsRemoved' }, clock)],
          })),
        };
      }
      const pqrsType = action.pqrsType;
      if (target.pqrs) {
        return {
          ...state,
          seq: state.seq + 1,
          tickets: mapTicket(state, action.id, (t) => ({
            ...t,
            pqrs: t.pqrs ? { ...t.pqrs, type: pqrsType } : t.pqrs,
            notes: [...t.notes, note(state.seq, 'you', { k: 'notes.pqrsType', p: { type: `@pqrs.types.${pqrsType}` } }, clock)],
          })),
        };
      }
      const year = dateOfDay(dayOf(clock)).getUTCFullYear();
      const radicado = `PQRS-${year}-${String(state.pqrsSeq).padStart(4, '0')}`;
      return {
        ...state,
        seq: state.seq + 1,
        pqrsSeq: state.pqrsSeq + 1,
        tickets: mapTicket(state, action.id, (t) => ({
          ...t,
          pqrs: { type: pqrsType, radicado, filedDay: dayOf(clock) },
          notes: [...t.notes, note(state.seq, 'you', { k: 'notes.pqrsMarked', p: { type: `@pqrs.types.${pqrsType}`, radicado } }, clock)],
        })),
      };
    }
    case 'applyMacro': {
      const m = state.macros.find((x) => x.id === action.macroId);
      if (!m) return state;
      return {
        ...state,
        seq: state.seq + 2,
        macros: state.macros.map((x) => (x.id === m.id ? { ...x, runs: x.runs + 1 } : x)),
        tickets: mapTicket(state, action.id, (t) => {
          const next = applyActions(t, m.actions, clock, `m${state.seq}`);
          return { ...next, notes: [...next.notes, note(state.seq + 1, 'you', { k: 'notes.macroApplied', p: { name: macroNameParam(m) } }, clock)] };
        }),
      };
    }
    case 'incoming':
      return {
        ...state,
        seq: action.seq,
        tickets: [action.ticket, ...state.tickets],
        autoLog: [action.log, ...state.autoLog],
        macros: state.macros.map((m) => (action.macroIds.includes(m.id) ? { ...m, runs: m.runs + 1 } : m)),
      };
    case 'addMacro':
      return {
        ...state,
        seq: state.seq + 1,
        macros: [
          ...state.macros,
          {
            id: `mc${state.seq}`,
            name: action.name.replace(/^@+/, ''),
            conditions: action.conditions,
            actions: action.actions,
            auto: action.auto,
            active: true,
            runs: 0,
          },
        ],
      };
    case 'toggleMacro':
      return { ...state, macros: state.macros.map((m) => (m.id === action.macroId ? { ...m, active: !m.active } : m)) };
    case 'deleteMacro':
      return { ...state, macros: state.macros.filter((m) => m.id !== action.macroId) };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'survey': {
      const t = state.tickets.find((x) => x.id === action.ticketId);
      if (!t) return state;
      const survey: Survey = {
        id: `s${state.seq}`,
        ticketId: t.id,
        agent: t.assignee,
        score: action.score,
        nps: action.nps,
        comment: action.comment,
        at: clock,
      };
      return { ...state, seq: state.seq + 1, surveys: [survey, ...state.surveys.filter((s) => s.ticketId !== t.id)] };
    }
  }
}

/** Asunto del ticket: la primera frase del mensaje (máx. 80 caracteres). */
export function subjectFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  // Sin el saludo inicial ("Hola, …", "Buenas tardes. …") y sin la marca de transcripción.
  const body =
    clean
      .replace(/^\([^)]*\)\s*/, '')
      .replace(/^(hola|buenas tardes|buenas noches|buenas|buenos d[ií]as|hi|hello|good (morning|afternoon|evening))[,.!:\s]+/i, '')
      .trim() || clean;
  const match = body.match(/^.*?[.?!](?=\s|$)/);
  const sentence = (match ? match[0] : body).trim() || body;
  const lead = /^[¿¡]/.test(sentence) ? 2 : 1;
  const first = sentence.slice(0, lead).toUpperCase() + sentence.slice(lead);
  return first.length > 80 ? `${first.slice(0, 77).trimEnd()}…` : first;
}

/**
 * Flujo de un ticket entrante: clasificación por reglas → macros automáticas →
 * respuesta automática (si aplica) → asignación por habilidad, idioma y carga.
 */
export function processIncoming(
  state: HelpdeskState,
  input: IncomingInput,
  kbLang: Lang,
): { ticket: Ticket; log: AutoLogEntry; macroIds: string[]; seq: number; result: IncomingResult } {
  let seq = state.seq;
  const { clock } = state;
  const c = classify(input.text);
  const id = `TCK-${nextTicketNumber(state.tickets)}`;
  const subject = subjectFrom(input.text);

  let ticket: Ticket = {
    id,
    brand: input.brand,
    channel: input.channel,
    customer: input.customer.trim(),
    contact: input.contact.trim(),
    city: input.city.trim(),
    subject,
    category: c.category,
    priority: c.priority,
    sentiment: c.sentiment,
    language: c.language,
    status: 'open',
    assignee: null,
    createdAt: clock,
    resolvedAt: null,
    tags: [],
    messages: [{ id: `m${seq++}`, from: 'customer', text: input.text.trim(), at: clock }],
    notes: [],
    pqrs: null,
    escalation: null,
    slaHandled: false,
  };

  const norm = normalize(input.text);
  const applied = state.macros.filter((m) => m.active && m.auto && macroMatches(m, ticket, norm));
  for (const m of applied) ticket = applyActions(ticket, m.actions, clock, `m${seq++}`);
  for (const m of applied) {
    ticket = { ...ticket, notes: [...ticket.notes, note(seq++, 'system', { k: 'notes.macroAuto', p: { name: macroNameParam(m) } }, clock)] };
  }

  const decision = autoReplyDecision(c, state.settings, kbLang);
  let routed: RouteResult | null = null;
  if (decision.result === 'sent' && decision.article) {
    const first = input.customer.trim().split(/\s+/)[0] || input.customer.trim();
    ticket = {
      ...ticket,
      status: 'pending',
      tags: ticket.tags.includes('respuesta-automatica') ? ticket.tags : [...ticket.tags, 'respuesta-automatica'],
      messages: [
        ...ticket.messages,
        { id: `m${seq++}`, from: 'bot', kind: 'autoReply', text: { k: `kb.articles.${decision.article.id}.reply`, p: { name: first } }, at: clock },
      ],
    };
  } else if (!ticket.assignee) {
    routed = route(ticket, state.tickets, kbLang);
    ticket = {
      ...ticket,
      assignee: routed.agent,
      notes: [
        ...ticket.notes,
        note(
          seq++,
          'system',
          routeNote(routed),
          clock,
        ),
      ],
    };
  }

  const log: AutoLogEntry = {
    id: `l${seq++}`,
    ticketId: id,
    channel: input.channel,
    category: c.category,
    confidence: c.confidence,
    result: decision.result,
    eligible: decision.eligible,
    at: clock,
  };

  return {
    ticket,
    log,
    macroIds: applied.map((m) => m.id),
    seq,
    result: {
      ticketId: id,
      classification: c,
      macros: applied.map((m) => m.name),
      decision: decision.result,
      route: routed,
      assignee: ticket.assignee,
      priority: ticket.priority,
    },
  };
}

function isValidState(v: unknown): v is HelpdeskState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<HelpdeskState>;
  return (
    s.version === STORAGE_VERSION &&
    Array.isArray(s.tickets) &&
    Array.isArray(s.macros) &&
    Array.isArray(s.autoLog) &&
    Array.isArray(s.surveys) &&
    typeof s.clock === 'number' &&
    typeof s.seq === 'number' &&
    typeof s.pqrsSeq === 'number' &&
    !!s.settings &&
    typeof s.settings.threshold === 'number'
  );
}

/** Estado de la mesa de ayuda, guardado en localStorage de este navegador. */
export function useHelpdeskStore() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Carga lo guardado después de montar (el primer render es igual en servidor y cliente).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isValidState(parsed)) dispatch({ type: 'hydrate', state: parsed });
      }
    } catch {
      /* almacenamiento bloqueado o dañado: se usan los datos de ejemplo */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sin espacio o bloqueado: la demo sigue funcionando en esta pestaña */
    }
  }, [state, hydrated]);

  // Reloj de la demo: avanza un minuto por cada minuto real.
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'tick', minutes: 1 }), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Regla de escalamiento por SLA vencido.
  useEffect(() => {
    if (state.tickets.some((t) => !t.slaHandled && t.status === 'open' && slaRemaining(t, state.clock) <= 0)) {
      dispatch({ type: 'slaSweep' });
    }
  }, [state.clock, state.tickets]);

  const incoming = useCallback((input: IncomingInput, kbLang: Lang): IncomingResult => {
    const out = processIncoming(stateRef.current, input, kbLang);
    dispatch({ type: 'incoming', ticket: out.ticket, log: out.log, macroIds: out.macroIds, seq: out.seq });
    return out.result;
  }, []);

  const autoAssign = useCallback((id: string, baseLang: Lang): RouteResult | null => {
    const tk = stateRef.current.tickets.find((t) => t.id === id);
    if (!tk) return null;
    const r = route(tk, stateRef.current.tickets, baseLang);
    dispatch({ type: 'assign', id, agent: r.agent, auto: r });
    return r;
  }, []);

  return { state, dispatch, incoming, autoAssign, hydrated };
}

export type HelpdeskStore = ReturnType<typeof useHelpdeskStore>;
