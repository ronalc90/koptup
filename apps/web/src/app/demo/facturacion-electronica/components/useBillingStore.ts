'use client';

// Estado de la demo: documentos, facturas de proveedores, emisor y avance del recorrido.
// Vive en el navegador (localStorage de este equipo); nada se envía a un servidor ni a la DIAN.
//
// Los datos de ejemplo se arman con la fecha de hoy en Colombia DESPUÉS de montar la página
// (nunca en el primer render), para que el HTML del servidor y el del navegador coincidan.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SAMPLE_ISSUER,
  buildSampleDocs,
  buildSampleIncoming,
  resolutionFor,
  type BillingDoc,
  type IncomingInvoice,
  type Issuer,
  type RadianEvent,
} from './data';
import { cufeInput, incomingCufeInput } from './docs';
import { defaultDraft, draftForType, type Draft } from './draft';
import type { DocType } from './data';
import { colombiaNow, sha384Hex } from './fiscal';

const STORAGE_KEY = 'koptup-demo-facturacion-v3';
/** Versión anterior: datos con la fecha fija del 8 de octubre de 2026. */
const LEGACY_KEY = 'koptup-demo-facturacion-v2';
const LEGACY_ANCHOR = '2026-10-08';

export interface Progress {
  invoice: boolean;
  download: boolean;
  creditNote: boolean;
  radian: boolean;
  export: boolean;
}

export interface BillingState {
  v: 3;
  /** Fecha (hoy en Colombia) con la que se armaron los datos de ejemplo. */
  anchor: string;
  issuer: Issuer;
  docs: BillingDoc[];
  incoming: IncomingInvoice[];
  dianDown: boolean;
  progress: Progress;
}

/** Aviso que se muestra al cargar cuando lo guardado era de otro mes. */
export type RestoreNotice = { kind: 'monthChanged'; from: string } | null;

export type EmissionTab = DocType | 'contingencia';

const EMPTY_PROGRESS: Progress = { invoice: false, download: false, creditNote: false, radian: false, export: false };

export function initialState(today: string, issuer: Issuer = SAMPLE_ISSUER): BillingState {
  return {
    v: 3,
    anchor: today,
    issuer: { ...issuer },
    docs: buildSampleDocs(today),
    incoming: buildSampleIncoming(today),
    dianDown: false,
    progress: { ...EMPTY_PROGRESS },
  };
}

type Saved = Omit<BillingState, 'v' | 'anchor'> & { v: number; anchor?: string };

function isSaved(x: unknown, v: 2 | 3): x is Saved {
  const s = x as Saved;
  return (
    !!s &&
    s.v === v &&
    (v === 2 || typeof s.anchor === 'string') &&
    Array.isArray(s.docs) &&
    Array.isArray(s.incoming) &&
    !!s.issuer &&
    !!s.progress
  );
}

/**
 * Recupera lo guardado en este navegador. Si era de otro mes (o de la versión con fecha
 * fija de otro mes), vuelve a armar los datos de ejemplo con la fecha de hoy y conserva
 * el emisor personalizado, con un aviso. Función pura para poder probarla.
 */
export function restoreState(saved: unknown, legacy: unknown, today: string): { state: BillingState; notice: RestoreNotice } {
  const current: Saved | null = isSaved(saved, 3) ? saved : isSaved(legacy, 2) ? { ...legacy, anchor: LEGACY_ANCHOR } : null;
  if (!current) return { state: initialState(today), notice: null };
  const anchor = current.anchor as string;
  if (anchor > today) return { state: initialState(today, current.issuer), notice: null };
  if (anchor.slice(0, 7) !== today.slice(0, 7)) {
    return { state: initialState(today, current.issuer), notice: { kind: 'monthChanged', from: anchor.slice(0, 7) } };
  }
  return { state: { ...current, v: 3, anchor }, notice: null };
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useBillingStore() {
  const [state, setState] = useState<BillingState | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [notice, setNotice] = useState<RestoreNotice>(null);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [storageFull, setStorageFull] = useState(false);
  // Estado de interfaz (no se guarda): pestaña de emisión, documento recién emitido y detalle abierto.
  const [tab, setTabState] = useState<EmissionTab>('factura');
  const [successId, setSuccessId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Después de montar: fecha de hoy en Colombia y lo guardado en este navegador.
  useEffect(() => {
    const now = colombiaNow().date;
    const { state: restored, notice: n } = restoreState(readJson(STORAGE_KEY), readJson(LEGACY_KEY), now);
    try {
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Sin acceso a localStorage: la demo funciona igual, solo que no recuerda los cambios.
    }
    setToday(now);
    setNotice(n);
    setState(restored);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageFull(false);
    } catch {
      setStorageFull(true);
    }
  }, [state]);

  const mutate = useCallback((fn: (s: BillingState) => BillingState) => setState((s) => (s ? fn(s) : s)), []);

  // CUFE/CUDE de ejemplo de los documentos que aún no lo tienen (SHA-384 con Web Crypto).
  useEffect(() => {
    if (!state) return;
    const missingDocs = state.docs.filter((d) => !d.cufe);
    const missingIn = state.incoming.filter((i) => !i.cufe);
    if (missingDocs.length === 0 && missingIn.length === 0) return;
    let cancelled = false;
    const issuer = state.issuer;
    (async () => {
      const docHashes = new Map<string, string>();
      for (const d of missingDocs) docHashes.set(d.id, await sha384Hex(cufeInput(d, issuer)));
      const inHashes = new Map<string, string>();
      for (const i of missingIn) inHashes.set(i.id, await sha384Hex(incomingCufeInput(i, issuer.nit)));
      if (cancelled) return;
      mutate((s) => ({
        ...s,
        docs: s.docs.map((d) => (!d.cufe && docHashes.has(d.id) ? { ...d, cufe: docHashes.get(d.id) as string } : d)),
        incoming: s.incoming.map((i) => (!i.cufe && inHashes.has(i.id) ? { ...i, cufe: inHashes.get(i.id) as string } : i)),
      }));
    })().catch(() => {
      // Web Crypto no disponible (contexto no seguro): el CUFE queda pendiente.
    });
    return () => {
      cancelled = true;
    };
  }, [state, mutate]);

  const addDoc = useCallback((doc: BillingDoc) => mutate((s) => ({ ...s, docs: [doc, ...s.docs] })), [mutate]);

  const updateDoc = useCallback(
    (id: string, fn: (d: BillingDoc) => BillingDoc) => mutate((s) => ({ ...s, docs: s.docs.map((d) => (d.id === id ? fn(d) : d)) })),
    [mutate],
  );

  // El CUFE incluye el NIT del emisor: si cambia, se recalculan los de ejemplo.
  const setIssuer = useCallback(
    (issuer: Issuer) =>
      mutate((s) =>
        s.issuer.nit === issuer.nit
          ? { ...s, issuer }
          : {
              ...s,
              issuer,
              docs: s.docs.map((d) => ({ ...d, cufe: '' })),
              incoming: s.incoming.map((i) => ({ ...i, cufe: '' })),
            },
      ),
    [mutate],
  );

  const setDianDown = useCallback((dianDown: boolean) => mutate((s) => ({ ...s, dianDown })), [mutate]);

  const addRadianEvent = useCallback(
    (incomingId: string, ev: RadianEvent) =>
      mutate((s) => ({
        ...s,
        incoming: s.incoming.map((i) => (i.id === incomingId ? { ...i, events: [...i.events, ev] } : i)),
        progress: { ...s.progress, radian: true },
      })),
    [mutate],
  );

  /** Factura dirigida a otro NIT: se le avisa al proveedor (no es un evento RADIAN). */
  const returnIncoming = useCallback(
    (incomingId: string, date: string) =>
      mutate((s) => ({ ...s, incoming: s.incoming.map((i) => (i.id === incomingId ? { ...i, returnedDate: date } : i)) })),
    [mutate],
  );

  const markProgress = useCallback(
    (key: keyof Progress) => mutate((s) => (s.progress[key] ? s : { ...s, progress: { ...s.progress, [key]: true } })),
    [mutate],
  );

  const setTab = useCallback((next: EmissionTab) => {
    setTabState(next);
    setSuccessId(null);
    if (next === 'contingencia') return;
    setDraft((d) => {
      if (d.type === next) return d;
      // Factura y POS no comparten líneas: cada uno arranca con las suyas.
      if (next === 'pos' || d.type === 'pos') return { ...draftForType(next), client: d.client };
      // Una factura no lleva referencia ni concepto: se limpian los de la nota.
      if (next === 'factura') return { ...d, type: next, refId: '', concept: '', note: '', returnQty: {}, adjustBase: 0, adjustTax: 'iva19' };
      return { ...d, type: next };
    });
  }, []);

  /** Abre el formulario de nota crédito o débito con la factura de referencia elegida. */
  const startNote = useCallback((type: 'notaCredito' | 'notaDebito', refId: string) => {
    setTabState(type);
    setSuccessId(null);
    setDraft((d) => ({ ...d, type, refId, concept: '', note: '', returnQty: {}, adjustBase: 0, adjustTax: 'iva19' }));
  }, []);

  const reset = useCallback(() => {
    const now = colombiaNow().date;
    setToday(now);
    setState(initialState(now));
    setNotice(null);
    setDraft(defaultDraft());
    setTabState('factura');
    setSuccessId(null);
    setDetailId(null);
  }, []);

  const resolution = useMemo(() => (state ? resolutionFor(state.anchor) : null), [state]);

  return {
    state,
    today,
    resolution,
    notice,
    dismissNotice: useCallback(() => setNotice(null), []),
    storageFull,
    draft,
    setDraft,
    tab,
    setTab,
    startNote,
    successId,
    setSuccessId,
    detailId,
    setDetailId,
    addDoc,
    updateDoc,
    setIssuer,
    setDianDown,
    addRadianEvent,
    returnIncoming,
    markProgress,
    reset,
  };
}

type RawStore = ReturnType<typeof useBillingStore>;

/** Tienda lista: los datos de ejemplo ya se armaron con la fecha de hoy. */
export type BillingStore = Omit<RawStore, 'state' | 'today' | 'resolution'> & {
  state: BillingState;
  today: string;
  resolution: NonNullable<RawStore['resolution']>;
};

export function isReady(store: RawStore): store is BillingStore {
  return !!store.state && !!store.today && !!store.resolution;
}
