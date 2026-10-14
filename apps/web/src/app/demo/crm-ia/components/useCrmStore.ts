'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityEvent,
  ChannelId,
  Deal,
  Enrollment,
  EventType,
  LostReason,
  SEED_REF_DATE,
  SEQUENCE_STEPS,
  StageId,
  addDays,
  daysBetween,
  isIsoDate,
  isOpen,
  todayInColombia,
} from './crm';
import { SEED_DEALS, SEED_ENROLLMENTS } from './data';

/**
 * Estado del CRM de ejemplo. Arranca con la semilla (mismo HTML en el servidor
 * y en el navegador) y, ya montado, corre las fechas al día de hoy (hora de
 * Colombia) y recupera los cambios guardados en localStorage de este
 * navegador. Nada se envía a un servidor.
 */
export const STORAGE_KEY = 'koptup-demo-crm-ia:v1';

/** Pasos del recorrido que no se deducen del historial. */
export interface GuideFlags {
  opened?: boolean;
  forecast?: boolean;
}

export interface CrmState {
  version: 2;
  /** Fecha de corte («hoy» en la demo), AAAA-MM-DD. */
  refDate: string;
  deals: Deal[];
  events: ActivityEvent[];
  enrollments: Enrollment[];
  doneActions: string[];
  seq: number;
  guide: GuideFlags;
}

/** Corre todas las fechas del estado `days` días (la foto del CRM se mueve entera). */
export function shiftState(s: CrmState, days: number): CrmState {
  if (!days) return s;
  const sh = (iso: string) => addDays(iso, days);
  return {
    ...s,
    refDate: sh(s.refDate),
    deals: s.deals.map((d) => ({ ...d, createdAt: sh(d.createdAt), closeDate: sh(d.closeDate), lastContact: sh(d.lastContact) })),
    events: s.events.map((e) => ({ ...e, date: sh(e.date) })),
    enrollments: s.enrollments.map((e) => ({ ...e, start: sh(e.start) })),
  };
}

/** Datos de ejemplo con la fecha de corte `refDate`. */
export function seedState(refDate: string = SEED_REF_DATE): CrmState {
  const base: CrmState = {
    version: 2,
    refDate: SEED_REF_DATE,
    deals: SEED_DEALS.map((d) => ({ ...d })),
    events: [],
    enrollments: SEED_ENROLLMENTS.map((e) => ({ ...e })),
    doneActions: [],
    seq: 1,
    guide: {},
  };
  return shiftState(base, daysBetween(SEED_REF_DATE, refDate));
}

/**
 * Lee lo guardado: acepta la versión 1 (fecha de corte fija del 8 oct 2026) y
 * la 2. Devuelve null si no es un estado válido.
 */
export function parseStored(v: unknown): CrmState | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Partial<Omit<CrmState, 'version'>> & { version?: number };
  const valid =
    (s.version === 1 || s.version === 2) &&
    Array.isArray(s.deals) &&
    Array.isArray(s.events) &&
    Array.isArray(s.enrollments) &&
    Array.isArray(s.doneActions) &&
    typeof s.seq === 'number';
  if (!valid) return null;
  return {
    version: 2,
    refDate: s.version === 2 && isIsoDate(s.refDate) ? s.refDate : SEED_REF_DATE,
    deals: s.deals as Deal[],
    events: s.events as ActivityEvent[],
    enrollments: s.enrollments as Enrollment[],
    doneActions: s.doneActions as string[],
    seq: s.seq as number,
    guide: s.version === 2 && s.guide && typeof s.guide === 'object' ? s.guide : {},
  };
}

/** Lleva un estado guardado otro día a la fecha de hoy. */
export const alignTo = (s: CrmState, today: string): CrmState => shiftState(s, daysBetween(s.refDate, today));

export type NewDealInput = Omit<
  Deal,
  'id' | 'createdAt' | 'lastContact' | 'interactions30d' | 'i18n' | 'lostReason' | 'nextActionAuto'
>;

/** Campos que se pueden cambiar desde la ficha del cliente. */
export type DealPatch = Partial<
  Pick<
    Deal,
    | 'company'
    | 'nit'
    | 'contactName'
    | 'role'
    | 'email'
    | 'phone'
    | 'city'
    | 'title'
    | 'value'
    | 'closeDate'
    | 'owner'
    | 'channel'
    | 'size'
    | 'budgetConfirmed'
    | 'decisionMaker'
    | 'nextAction'
  >
>;

/** Agrega un evento al historial y, si es un contacto, actualiza recencia e interacciones. */
function withEvent(
  s: CrmState,
  dealId: string,
  type: EventType,
  data: { key?: string; params?: ActivityEvent['params']; text?: string },
  touches: boolean,
): CrmState {
  const event: ActivityEvent = {
    id: `e${s.seq}`,
    dealId,
    date: s.refDate,
    type,
    order: s.seq,
    ...data,
  };
  const deals = touches
    ? s.deals.map((d) =>
        d.id === dealId ? { ...d, lastContact: s.refDate, interactions30d: d.interactions30d + 1 } : d,
      )
    : s.deals;
  return { ...s, deals, events: [...s.events, event], seq: s.seq + 1 };
}

/** Mueve un negocio de etapa (función pura, probada en __tests__). */
export function moveDealIn(s: CrmState, id: string, stage: StageId, lostReason?: LostReason): CrmState {
  const deal = s.deals.find((d) => d.id === id);
  if (!deal || deal.stage === stage) return s;
  const ref = s.refDate;
  const closing = stage === 'won' || stage === 'lost';
  const deals = s.deals.map((d) => {
    if (d.id !== id) return d;
    const next: Deal = { ...d, stage, lostReason: stage === 'lost' ? lostReason ?? 'noResponse' : undefined };
    if (closing) {
      next.closeDate = ref;
      next.nextActionAuto = stage === 'won' ? 'won' : 'lost';
    } else {
      next.nextActionAuto = undefined;
      if (!isOpen(d) || d.closeDate < ref) next.closeDate = addDays(ref, 30);
    }
    return next;
  });
  const key = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'stage';
  const params: ActivityEvent['params'] =
    stage === 'lost' ? { reason: lostReason ?? 'noResponse' } : stage === 'won' ? undefined : { stage };
  const type: EventType = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'stage';
  // Una secuencia activa o pausada termina al cerrar el negocio.
  const enrollments = closing
    ? s.enrollments.map((e) =>
        e.dealId === id && (e.status === 'active' || e.status === 'paused') ? { ...e, status: 'finished' as const } : e,
      )
    : s.enrollments;
  return withEvent({ ...s, deals, enrollments }, id, type, { key, params }, false);
}

/** Aplica los cambios de la ficha y deja en el historial qué campos cambiaron. */
export function updateDealIn(s: CrmState, id: string, patch: DealPatch): CrmState {
  const deal = s.deals.find((d) => d.id === id);
  if (!deal) return s;
  const changed = (Object.keys(patch) as (keyof DealPatch)[]).filter((k) => patch[k] !== undefined && patch[k] !== deal[k]);
  if (!changed.length) return s;
  const next: Deal = { ...deal };
  for (const k of changed) (next as unknown as Record<string, unknown>)[k] = patch[k];
  if (changed.includes('nextAction')) next.nextActionAuto = undefined;
  const deals = s.deals.map((d) => (d.id === id ? next : d));
  return withEvent({ ...s, deals }, id, 'edit', { key: 'edited', params: { fields: changed.join(',') } }, false);
}

export function useCrmStore() {
  const [state, setState] = useState<CrmState>(() => seedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const today = todayInColombia();
    let next = seedState(today);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = parseStored(JSON.parse(raw));
        if (parsed) next = alignTo(parsed, today);
      }
    } catch {
      // Sin acceso a localStorage (modo privado, bloqueado): se usa la semilla.
    }
    setState(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorar: la demo sigue funcionando en memoria.
    }
  }, [state, hydrated]);

  const moveDeal = useCallback((id: string, stage: StageId, lostReason?: LostReason) => {
    setState((s) => moveDealIn(s, id, stage, lostReason));
  }, []);

  const addDeal = useCallback((input: NewDealInput) => {
    setState((s) => {
      const deal: Deal = {
        ...input,
        id: `n${s.seq}`,
        createdAt: s.refDate,
        lastContact: s.refDate,
        interactions30d: 1,
      };
      return { ...s, deals: [deal, ...s.deals], seq: s.seq + 1 };
    });
  }, []);

  const updateDeal = useCallback((id: string, patch: DealPatch) => {
    setState((s) => updateDealIn(s, id, patch));
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      deals: s.deals.filter((d) => d.id !== id),
      events: s.events.filter((e) => e.dealId !== id),
      enrollments: s.enrollments.filter((e) => e.dealId !== id),
    }));
  }, []);

  const logActivity = useCallback((dealId: string, type: EventType, text: string) => {
    setState((s) => withEvent(s, dealId, type, { text }, type !== 'note'));
  }, []);

  const registerSent = useCallback((dealId: string, channel: ChannelId, preview: string) => {
    setState((s) => withEvent(s, dealId, channel, { key: 'sent', params: { channel, preview } }, true));
  }, []);

  const enroll = useCallback((dealId: string) => {
    setState((s) => {
      if (s.enrollments.some((e) => e.dealId === dealId)) return s;
      const enrollments = [...s.enrollments, { dealId, start: s.refDate, stepsDone: 0, status: 'active' as const }];
      return withEvent({ ...s, enrollments }, dealId, 'sequence', { key: 'enrolled' }, false);
    });
  }, []);

  /** Ejecuta (simulado) el siguiente paso de la secuencia. */
  const runStep = useCallback((dealId: string) => {
    setState((s) => {
      const e = s.enrollments.find((x) => x.dealId === dealId);
      if (!e || e.status !== 'active' || e.stepsDone >= SEQUENCE_STEPS.length) return s;
      const step = SEQUENCE_STEPS[e.stepsDone];
      const stepsDone = e.stepsDone + 1;
      const enrollments = s.enrollments.map((x) =>
        x.dealId === dealId
          ? { ...x, stepsDone, status: stepsDone >= SEQUENCE_STEPS.length ? ('finished' as const) : x.status }
          : x,
      );
      return withEvent({ ...s, enrollments }, dealId, 'sequence', { key: 'sequence', params: { step: step.id } }, step.channel !== 'task');
    });
  }, []);

  const setEnrollmentStatus = useCallback((dealId: string, status: Enrollment['status']) => {
    setState((s) => {
      const enrollments = s.enrollments.map((x) => (x.dealId === dealId ? { ...x, status } : x));
      const next = { ...s, enrollments };
      return status === 'replied' ? withEvent(next, dealId, 'sequence', { key: 'replied' }, true) : next;
    });
  }, []);

  const unenroll = useCallback((dealId: string) => {
    setState((s) => ({ ...s, enrollments: s.enrollments.filter((x) => x.dealId !== dealId) }));
  }, []);

  const toggleAction = useCallback((actionId: string) => {
    setState((s) => ({
      ...s,
      doneActions: s.doneActions.includes(actionId)
        ? s.doneActions.filter((a) => a !== actionId)
        : [...s.doneActions, actionId],
    }));
  }, []);

  const markGuide = useCallback((flag: keyof GuideFlags) => {
    setState((s) => (s.guide[flag] ? s : { ...s, guide: { ...s.guide, [flag]: true } }));
  }, []);

  const reset = useCallback(() => {
    setState(seedState(todayInColombia()));
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar.
    }
  }, []);

  return {
    state,
    hydrated,
    moveDeal,
    addDeal,
    updateDeal,
    deleteDeal,
    logActivity,
    registerSent,
    enroll,
    runStep,
    setEnrollmentStatus,
    unenroll,
    toggleAction,
    markGuide,
    reset,
  };
}

export type CrmStore = ReturnType<typeof useCrmStore>;
