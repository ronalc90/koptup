'use client';

/**
 * Estado compartido de la demo (sala de espera, consulta en curso, atenciones, citas y
 * auditoría). Se guarda en localStorage de este navegador para que sobreviva a una recarga,
 * incluida la consulta que estés atendiendo. La jornada es la de hoy (hora de Colombia): si
 * vuelves otro día, empieza una jornada nueva con los datos de ejemplo. "Restablecer" vuelve
 * a los datos de ejemplo. No se envía nada a ningún servidor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_DATE, FIRST_ATTENTION_NUMBER, FIRST_INVOICE_NUMBER, FIRST_RX_NUMBER, INITIAL_ATTENTIONS, INITIAL_PATIENTS } from './mockData';
import { clockAt, shiftIso, todayInBogota } from './logic';
import type { Appointment, Attention, AuditEntry, ConsultDraft, ConsultSession, Patient, PayMethod, Soap } from './types';

const STORAGE_KEY = 'koptup:demo:telemedicina:v3';
/** Versiones anteriores (fechas fijas del 8 de octubre de 2026): se descartan. */
const OLD_KEYS = ['koptup:demo:telemedicina:v2'];

export const EMPTY_DRAFT: ConsultDraft = { dx: null, meds: [], orders: [], rx: null, rxSent: false };
export const EMPTY_SOAP: Soap = { s: '', o: '', a: '', p: '' };

export interface TelemedState {
  /** Fecha de la jornada (hoy en Colombia). */
  day: string;
  /** Momento real (ms) en que el reloj de la demo marcó las 09:30. 0 = aún sin abrir. */
  clockStart: number;
  patients: Patient[];
  attentions: Attention[];
  appointments: Appointment[];
  audit: AuditEntry[];
  consult: ConsultSession | null;
  counters: { attention: number; rx: number; invoice: number; patient: number; seq: number };
}

/** Datos de ejemplo de una jornada, con las fechas corridas a `day`. */
export function initialState(day: string = BASE_DATE, clockStart = 0): TelemedState {
  const patients: Patient[] = JSON.parse(JSON.stringify(INITIAL_PATIENTS));
  patients.forEach((p) => {
    p.pastConsults.forEach((c) => (c.date = shiftIso(c.date, day)));
    p.labs.forEach((l) => (l.date = shiftIso(l.date, day)));
  });
  const attentions: Attention[] = JSON.parse(JSON.stringify(INITIAL_ATTENTIONS));
  const year = day.slice(0, 4);
  attentions.forEach((a) => {
    a.date = shiftIso(a.date, day);
    // Los consecutivos de ejemplo llevan el año de la jornada (AT-2026-1041, RX-2026-0146…).
    a.id = a.id.replace(/-\d{4}-/, `-${year}-`);
    if (a.rx) a.rx.number = a.rx.number.replace(/-\d{4}-/, `-${year}-`);
  });
  return {
    day,
    clockStart,
    patients,
    attentions,
    appointments: [],
    audit: [{ id: 'a0', at: '09:30:00', actor: 'system', key: 'sessionStart' }],
    consult: null,
    counters: { attention: FIRST_ATTENTION_NUMBER, rx: FIRST_RX_NUMBER, invoice: FIRST_INVOICE_NUMBER, patient: 1, seq: 1 },
  };
}

function isState(x: unknown): x is TelemedState {
  const s = x as TelemedState;
  return (
    !!s &&
    typeof s.day === 'string' &&
    typeof s.clockStart === 'number' &&
    Array.isArray(s.patients) &&
    Array.isArray(s.attentions) &&
    Array.isArray(s.appointments) &&
    Array.isArray(s.audit) &&
    !!s.counters
  );
}

export type LogFn = (actor: AuditEntry['actor'], key: string, params?: AuditEntry['params'], who?: string) => void;

/** Qué pasó al cargar: si se recuperó una consulta abierta o si empezó una jornada nueva. */
export interface LoadInfo {
  resumedPatient: string | null;
  newDay: boolean;
}

export function useTelemedStore() {
  const [state, setState] = useState<TelemedState>(() => initialState());
  const [loaded, setLoaded] = useState(false);
  const [loadInfo, setLoadInfo] = useState<LoadInfo | null>(null);
  // Hora real para el reloj de la demo; 0 antes de montar (el primer render marca las 09:30).
  const [nowMs, setNowMs] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Carga lo guardado después de montar (el primer render es igual en servidor y navegador).
  useEffect(() => {
    const today = todayInBogota();
    let next: TelemedState | null = null;
    let info: LoadInfo = { resumedPatient: null, newDay: false };
    try {
      OLD_KEYS.forEach((k) => window.localStorage.removeItem(k));
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isState(parsed) && parsed.day === today && parsed.clockStart > 0) {
          const consult = parsed.consult ?? null;
          const consultPatient = consult ? parsed.patients.find((p) => p.id === consult.patientId && p.status === 'inConsult') : undefined;
          next = {
            ...parsed,
            consult: consultPatient ? consult : null,
            // Si no hay consulta que recuperar, nadie queda "en consulta".
            patients: parsed.patients.map((p) => (p.status === 'inConsult' && p.id !== consultPatient?.id ? { ...p, status: 'waiting' } : p)),
          };
          info = { resumedPatient: consultPatient?.name ?? null, newDay: false };
        } else if (isState(parsed)) {
          info = { resumedPatient: null, newDay: true };
        }
      }
    } catch {
      /* sin almacenamiento: la demo funciona igual, solo no recuerda los cambios */
    }
    setState(next ?? initialState(today, Date.now()));
    setLoadInfo(info);
    setNowMs(Date.now());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorado */
    }
  }, [state, loaded]);

  // El reloj de la demo (y con él la espera de la sala) avanza en tiempo real.
  useEffect(() => {
    if (!loaded) return;
    const i = window.setInterval(() => setNowMs(Date.now()), 15000);
    return () => window.clearInterval(i);
  }, [loaded]);

  /** Hora actual del reloj de la demo (HH:MM o HH:MM:SS). */
  const clock = useCallback((withSeconds = false) => clockAt(stateRef.current.clockStart, Date.now(), withSeconds), []);

  const log: LogFn = useCallback((actor, key, params, who) => {
    const at = clockAt(stateRef.current.clockStart, Date.now(), true);
    setState((s) => ({
      ...s,
      audit: [{ id: `a${s.counters.seq}`, at, actor, key, params, ...(who ? { who } : {}) }, ...s.audit].slice(0, 300),
      counters: { ...s.counters, seq: s.counters.seq + 1 },
    }));
  }, []);

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setState((s) => ({ ...s, patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);

  /** Agrega un paciente nuevo (desde la vista del paciente) y devuelve su id. */
  const addPatient = useCallback((p: Omit<Patient, 'id'>) => {
    const id = `n${stateRef.current.counters.patient}`;
    setState((s) => ({ ...s, patients: [...s.patients, { ...p, id }], counters: { ...s.counters, patient: s.counters.patient + 1 } }));
    return id;
  }, []);

  /** Reserva el siguiente consecutivo de receta (RX-2026-0149, …). */
  const nextRxNumber = useCallback(() => {
    const n = stateRef.current.counters.rx;
    const year = stateRef.current.day.slice(0, 4);
    setState((s) => ({ ...s, counters: { ...s.counters, rx: s.counters.rx + 1 } }));
    return `RX-${year}-${n.toString().padStart(4, '0')}`;
  }, []);

  /** Registra una atención finalizada; le asigna número, factura (simulada) y RIPS (simulado). */
  const addAttention = useCallback((a: Omit<Attention, 'id' | 'invoice'> & { billable: boolean }) => {
    const c = stateRef.current.counters;
    const id = `AT-${stateRef.current.day.slice(0, 4)}-${c.attention}`;
    const invoice = a.billable ? `ALTV-${c.invoice}` : null;
    const { billable, ...rest } = a;
    setState((s) => ({
      ...s,
      attentions: [...s.attentions, { ...rest, id, invoice }],
      counters: { ...s.counters, attention: s.counters.attention + 1, invoice: s.counters.invoice + (billable ? 1 : 0) },
    }));
    return { id, invoice };
  }, []);

  const payAttention = useCallback((id: string, method: PayMethod) => {
    const ref = `SIM-${(480200 + stateRef.current.counters.seq).toString()}`;
    setState((s) => ({
      ...s,
      attentions: s.attentions.map((a) => (a.id === id ? { ...a, payStatus: 'paid', payMethod: method, payRef: ref } : a)),
      counters: { ...s.counters, seq: s.counters.seq + 1 },
    }));
    return ref;
  }, []);

  const addAppointment = useCallback((a: Omit<Appointment, 'id' | 'status'>) => {
    const id = `C-${(stateRef.current.counters.seq + 300).toString()}`;
    setState((s) => ({
      ...s,
      appointments: [...s.appointments, { ...a, id, status: 'booked' }],
      counters: { ...s.counters, seq: s.counters.seq + 1 },
    }));
    return id;
  }, []);

  const updateAppointment = useCallback((id: string, patch: Partial<Appointment>) => {
    setState((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id) }));
  }, []);

  /** Abre la consulta con un paciente de la sala de espera. */
  const startConsult = useCallback((patientId: string) => {
    const startedAt = clockAt(stateRef.current.clockStart, Date.now());
    setState((s) => ({
      ...s,
      patients: s.patients.map((p) => (p.id === patientId ? { ...p, status: 'inConsult' } : p)),
      consult: {
        patientId,
        startEpoch: Date.now(),
        startedAt,
        chat: [{ id: 'c0', from: 'patient', text: '', key: 'hello', at: startedAt }],
        scriptIdx: 0,
        draft: EMPTY_DRAFT,
        soap: EMPTY_SOAP,
        micOn: true,
        tab: 'record',
      },
    }));
  }, []);

  /** Cambia la consulta en curso (no hace nada si ya se cerró). */
  const updateConsult = useCallback((patch: Partial<ConsultSession> | ((c: ConsultSession) => Partial<ConsultSession>)) => {
    setState((s) => (s.consult ? { ...s, consult: { ...s.consult, ...(typeof patch === 'function' ? patch(s.consult) : patch) } } : s));
  }, []);

  const endConsult = useCallback(() => {
    setState((s) => ({ ...s, consult: null }));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorado */
    }
    setState(initialState(todayInBogota(), Date.now()));
    setNowMs(Date.now());
  }, []);

  /** Hora del reloj de la demo para mostrar (se refresca cada 15 s). */
  const now = clockAt(state.clockStart, nowMs);

  return {
    state,
    loaded,
    loadInfo,
    now,
    clock,
    log,
    updatePatient,
    addPatient,
    nextRxNumber,
    addAttention,
    payAttention,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    startConsult,
    updateConsult,
    endConsult,
    reset,
  };
}

export type TelemedStore = ReturnType<typeof useTelemedStore>;
