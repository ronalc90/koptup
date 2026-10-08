'use client';

// Estado de la demo: documentos, facturas de proveedores, emisor y avance del recorrido.
// Vive en el navegador (localStorage de este equipo); nada se envía a un servidor ni a la DIAN.

import { useCallback, useEffect, useState } from 'react';
import {
  SAMPLE_ISSUER,
  buildSampleDocs,
  buildSampleIncoming,
  type BillingDoc,
  type IncomingInvoice,
  type Issuer,
  type RadianEvent,
} from './data';
import { cufeInput, incomingCufeInput } from './docs';
import { defaultDraft, draftForType, type Draft } from './draft';
import type { DocType } from './data';
import { sha384Hex } from './fiscal';

const STORAGE_KEY = 'koptup-demo-facturacion-v2';

export interface Progress {
  invoice: boolean;
  download: boolean;
  creditNote: boolean;
  radian: boolean;
  export: boolean;
}

export interface BillingState {
  v: 2;
  issuer: Issuer;
  docs: BillingDoc[];
  incoming: IncomingInvoice[];
  dianDown: boolean;
  progress: Progress;
}

export type EmissionTab = DocType | 'contingencia';

export function initialState(): BillingState {
  return {
    v: 2,
    issuer: { ...SAMPLE_ISSUER },
    docs: buildSampleDocs(),
    incoming: buildSampleIncoming(),
    dianDown: false,
    progress: { invoice: false, download: false, creditNote: false, radian: false, export: false },
  };
}

function isValidState(x: unknown): x is BillingState {
  const s = x as BillingState;
  return !!s && s.v === 2 && Array.isArray(s.docs) && Array.isArray(s.incoming) && !!s.issuer && !!s.progress;
}

export function useBillingStore() {
  const [state, setState] = useState<BillingState>(initialState);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [hydrated, setHydrated] = useState(false);
  const [storageFull, setStorageFull] = useState(false);
  // Estado de interfaz (no se guarda): pestaña de emisión, documento recién emitido y detalle abierto.
  const [tab, setTabState] = useState<EmissionTab>('factura');
  const [successId, setSuccessId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidState(parsed)) setState(parsed);
      }
    } catch {
      // Sin acceso a localStorage: la demo funciona igual, solo que no recuerda los cambios.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageFull(false);
    } catch {
      setStorageFull(true);
    }
  }, [state, hydrated]);

  // CUFE/CUDE de ejemplo de los documentos que aún no lo tienen (SHA-384 con Web Crypto).
  useEffect(() => {
    if (!hydrated) return;
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
      setState((s) => ({
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
  }, [hydrated, state.docs, state.incoming, state.issuer]);

  const addDoc = useCallback((doc: BillingDoc) => setState((s) => ({ ...s, docs: [doc, ...s.docs] })), []);

  const updateDoc = useCallback(
    (id: string, fn: (d: BillingDoc) => BillingDoc) =>
      setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === id ? fn(d) : d)) })),
    [],
  );

  // El CUFE incluye el NIT del emisor: si cambia, se recalculan los de ejemplo.
  const setIssuer = useCallback(
    (issuer: Issuer) =>
      setState((s) =>
        s.issuer.nit === issuer.nit
          ? { ...s, issuer }
          : {
              ...s,
              issuer,
              docs: s.docs.map((d) => ({ ...d, cufe: '' })),
              incoming: s.incoming.map((i) => ({ ...i, cufe: '' })),
            },
      ),
    [],
  );

  const setDianDown = useCallback((dianDown: boolean) => setState((s) => ({ ...s, dianDown })), []);

  const addRadianEvent = useCallback(
    (incomingId: string, ev: RadianEvent) =>
      setState((s) => ({
        ...s,
        incoming: s.incoming.map((i) => (i.id === incomingId ? { ...i, events: [...i.events, ev] } : i)),
        progress: { ...s.progress, radian: true },
      })),
    [],
  );

  const markProgress = useCallback(
    (key: keyof Progress) =>
      setState((s) => (s.progress[key] ? s : { ...s, progress: { ...s.progress, [key]: true } })),
    [],
  );

  const setTab = useCallback((next: EmissionTab) => {
    setTabState(next);
    setSuccessId(null);
    if (next === 'contingencia') return;
    setDraft((d) => {
      if (d.type === next) return d;
      // Factura y POS no comparten líneas: cada uno arranca con las suyas.
      if (next === 'pos' || d.type === 'pos') return { ...draftForType(next), client: d.client };
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
    setState(initialState());
    setDraft(defaultDraft());
    setTabState('factura');
    setSuccessId(null);
    setDetailId(null);
  }, []);

  return {
    state,
    hydrated,
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
    markProgress,
    reset,
  };
}

export type BillingStore = ReturnType<typeof useBillingStore>;
