'use client';

/**
 * Estado compartido de la demo (sala de espera, atenciones, citas y auditoría).
 * Se guarda en localStorage de este navegador para que sobreviva a una recarga;
 * "Restablecer" vuelve a los datos de ejemplo. No se envía nada a ningún servidor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FIRST_ATTENTION_NUMBER, FIRST_INVOICE_NUMBER, FIRST_RX_NUMBER, INITIAL_ATTENTIONS, INITIAL_PATIENTS } from './mockData';
import { demoClock } from './logic';
import type { Appointment, Attention, AuditEntry, Patient, PayMethod } from './types';

const STORAGE_KEY = 'koptup:demo:telemedicina:v2';

export interface TelemedState {
  patients: Patient[];
  attentions: Attention[];
  appointments: Appointment[];
  audit: AuditEntry[];
  counters: { attention: number; rx: number; invoice: number; patient: number; seq: number };
}

export function initialState(): TelemedState {
  return {
    patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
    attentions: JSON.parse(JSON.stringify(INITIAL_ATTENTIONS)),
    appointments: [],
    audit: [{ id: 'a0', at: '09:30:00', actor: 'system', key: 'sessionStart' }],
    counters: { attention: FIRST_ATTENTION_NUMBER, rx: FIRST_RX_NUMBER, invoice: FIRST_INVOICE_NUMBER, patient: 1, seq: 1 },
  };
}

function isState(x: unknown): x is TelemedState {
  const s = x as TelemedState;
  return !!s && Array.isArray(s.patients) && Array.isArray(s.attentions) && Array.isArray(s.appointments) && Array.isArray(s.audit) && !!s.counters;
}

export type LogFn = (actor: AuditEntry['actor'], key: string, params?: AuditEntry['params']) => void;

export function useTelemedStore() {
  const [state, setState] = useState<TelemedState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Carga lo guardado después de montar (el primer render es igual en servidor y navegador).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isState(parsed)) {
          setState({
            ...parsed,
            // Una consulta que quedó abierta al recargar vuelve a la sala de espera.
            patients: parsed.patients.map((p) => (p.status === 'inConsult' ? { ...p, status: 'waiting' } : p)),
          });
        }
      }
    } catch {
      /* sin almacenamiento: la demo funciona igual, solo no recuerda los cambios */
    }
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

  // La espera de la sala aumenta un minuto por cada minuto real.
  useEffect(() => {
    const i = window.setInterval(() => {
      setState((s) => ({ ...s, patients: s.patients.map((p) => (p.status === 'waiting' ? { ...p, waitMin: p.waitMin + 1 } : p)) }));
    }, 60000);
    return () => window.clearInterval(i);
  }, []);

  const log: LogFn = useCallback((actor, key, params) => {
    setState((s) => ({
      ...s,
      audit: [{ id: `a${s.counters.seq}`, at: demoClock(true), actor, key, params }, ...s.audit].slice(0, 300),
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
    setState((s) => ({ ...s, counters: { ...s.counters, rx: s.counters.rx + 1 } }));
    return `RX-2026-${n.toString().padStart(4, '0')}`;
  }, []);

  /** Registra una atención finalizada; le asigna número, factura (simulada) y RIPS (simulado). */
  const addAttention = useCallback((a: Omit<Attention, 'id' | 'invoice'> & { billable: boolean }) => {
    const c = stateRef.current.counters;
    const id = `AT-2026-${c.attention}`;
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

  const addAppointment = useCallback((a: Omit<Appointment, 'id'>) => {
    const id = `C-${(stateRef.current.counters.seq + 300).toString()}`;
    setState((s) => ({ ...s, appointments: [...s.appointments, { ...a, id }], counters: { ...s.counters, seq: s.counters.seq + 1 } }));
    return id;
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id) }));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorado */
    }
    setState(initialState());
  }, []);

  return { state, loaded, log, updatePatient, addPatient, nextRxNumber, addAttention, payAttention, addAppointment, cancelAppointment, reset };
}

export type TelemedStore = ReturnType<typeof useTelemedStore>;
