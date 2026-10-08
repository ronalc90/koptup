'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityEvent,
  ChannelId,
  Deal,
  Enrollment,
  EventType,
  LostReason,
  REF_DATE,
  SEQUENCE_STEPS,
  StageId,
  addDays,
  isOpen,
} from './crm';
import { SEED_DEALS, SEED_ENROLLMENTS } from './data';

/**
 * Estado del CRM de ejemplo. Arranca siempre con la semilla (mismo HTML en el
 * servidor y en el navegador) y, ya montado, recupera los cambios guardados en
 * localStorage de este navegador. Nada se envía a un servidor.
 */
const STORAGE_KEY = 'koptup-demo-crm-ia:v1';

export interface CrmState {
  version: 1;
  deals: Deal[];
  events: ActivityEvent[];
  enrollments: Enrollment[];
  doneActions: string[];
  seq: number;
}

const seedState = (): CrmState => ({
  version: 1,
  deals: SEED_DEALS.map((d) => ({ ...d })),
  events: [],
  enrollments: SEED_ENROLLMENTS.map((e) => ({ ...e })),
  doneActions: [],
  seq: 1,
});

function isValidState(v: unknown): v is CrmState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<CrmState>;
  return (
    s.version === 1 &&
    Array.isArray(s.deals) &&
    Array.isArray(s.events) &&
    Array.isArray(s.enrollments) &&
    Array.isArray(s.doneActions) &&
    typeof s.seq === 'number'
  );
}

export type NewDealInput = Omit<
  Deal,
  'id' | 'createdAt' | 'lastContact' | 'interactions30d' | 'i18n' | 'lostReason'
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
    date: REF_DATE,
    type,
    order: s.seq,
    ...data,
  };
  const deals = touches
    ? s.deals.map((d) =>
        d.id === dealId
          ? { ...d, lastContact: REF_DATE, interactions30d: d.interactions30d + 1 }
          : d,
      )
    : s.deals;
  return { ...s, deals, events: [...s.events, event], seq: s.seq + 1 };
}

export function useCrmStore() {
  const [state, setState] = useState<CrmState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidState(parsed)) setState(parsed);
      }
    } catch {
      // Sin acceso a localStorage (modo privado, bloqueado): se usa la semilla.
    }
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
    setState((s) => {
      const deal = s.deals.find((d) => d.id === id);
      if (!deal || deal.stage === stage) return s;
      const closing = stage === 'won' || stage === 'lost';
      const deals = s.deals.map((d) => {
        if (d.id !== id) return d;
        const next: Deal = { ...d, stage, lostReason: stage === 'lost' ? lostReason ?? 'noResponse' : undefined };
        if (closing) next.closeDate = REF_DATE;
        else if (!isOpen(d) || d.closeDate < REF_DATE) next.closeDate = addDays(REF_DATE, 30);
        return next;
      });
      const key = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'stage';
      const params: ActivityEvent['params'] =
        stage === 'lost' ? { reason: lostReason ?? 'noResponse' } : stage === 'won' ? undefined : { stage };
      const type: EventType = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'stage';
      // Una secuencia activa se detiene al cerrar el negocio.
      const enrollments = closing
        ? s.enrollments.map((e) =>
            e.dealId === id && (e.status === 'active' || e.status === 'paused')
              ? { ...e, status: 'finished' as const }
              : e,
          )
        : s.enrollments;
      return withEvent({ ...s, deals, enrollments }, id, type, { key, params }, false);
    });
  }, []);

  const addDeal = useCallback((input: NewDealInput) => {
    setState((s) => {
      const deal: Deal = {
        ...input,
        id: `n${s.seq}`,
        createdAt: REF_DATE,
        lastContact: REF_DATE,
        interactions30d: 1,
      };
      return { ...s, deals: [deal, ...s.deals], seq: s.seq + 1 };
    });
  }, []);

  const updateDeal = useCallback((id: string, patch: Partial<Pick<Deal, 'nextAction' | 'value' | 'closeDate' | 'owner'>>) => {
    setState((s) => ({ ...s, deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
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
      const enrollments = [...s.enrollments, { dealId, start: REF_DATE, stepsDone: 0, status: 'active' as const }];
      return withEvent({ ...s, enrollments }, dealId, 'sequence', { key: 'enrolled' }, false);
    });
  }, []);

  /** Ejecuta (simulado) el siguiente paso; devuelve el id del paso o null. */
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

  const reset = useCallback(() => {
    setState(seedState());
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
    reset,
  };
}

export type CrmStore = ReturnType<typeof useCrmStore>;
