'use client';

/**
 * Estado del tablero en el navegador: preferencias guardadas en localStorage
 * (prefijo `demo:bi:`), dataset activo (ejemplo o CSV del visitante, que no se
 * guarda ni sale del navegador), período, vista, avisos y el avance de los
 * primeros pasos.
 *
 * El mes de corte (`anchor`) llega del servidor: es el último mes cerrado en
 * Colombia, así el HTML y la hidratación usan las mismas fechas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSample } from './dataset';
import { isMonthKey } from './dates';
import { alerts as buildAlerts, buildContext, buildIndex, findPeriod, findings as buildFindings, periodOptions, type Alert, type Context, type Finding, type Segment } from './engine';
import { PRESETS, REFERENCE_ANCHOR } from './presets';
import { SECTORS, type CompanyProfile, type Dataset, type MonthKey, type Period, type SectorId, type Settings, type ViewId } from './types';

const SETTINGS_KEY = 'demo:bi:settings:v1';
/** Período elegido junto con el mes de corte en que se eligió (si el corte cambia, se vuelve al último mes). */
const PERIOD_KEY = 'demo:bi:period:v2';
const GUIDE_KEY = 'demo:bi:guide:v1';
/** Bloque de primeros pasos abierto ('1') u oculto ('0'). */
const GUIDE_OPEN_KEY = 'demo:bi:guide-open:v1';

/**
 * Lleva la vista al comienzo de la sección del tablero (título de la sección
 * justo debajo de la barra fija del tablero), no al inicio de la página: el
 * encabezado de la demo queda arriba y la sección elegida a la vista.
 */
export function scrollToContent() {
  if (typeof window === 'undefined') return;
  const content = document.getElementById('exec-content');
  if (!content) return;
  const bar = document.getElementById('exec-toolbar');
  const siteNav = window.matchMedia('(min-width: 768px)').matches ? 80 : 64;
  const top = content.getBoundingClientRect().top + window.scrollY - siteNav - (bar?.offsetHeight ?? 0);
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

/** Pasos de "Primeros pasos": se marcan solos cuando el visitante hace cada cosa. */
export type GuideStep = 'period' | 'finance' | 'customer' | 'ask' | 'pdf';
export const GUIDE_STEPS: GuideStep[] = ['period', 'finance', 'customer', 'ask', 'pdf'];
export type GuideProgress = Record<GuideStep, boolean>;
const emptyGuide = (): GuideProgress => ({ period: false, finance: false, customer: false, ask: false, pdf: false });

export function defaultSettings(): Settings {
  return {
    sector: 'comercio',
    companies: {},
    goals: Object.fromEntries(SECTORS.map((s) => [s, PRESETS[s].goalGrowth])) as Record<SectorId, number>,
    thresholds: Object.fromEntries(SECTORS.map((s) => [s, { ...PRESETS[s].thresholds }])) as Settings['thresholds'],
    recipients: [
      { id: 'r1', name: '', role: 'ceo', channel: 'email', address: 'gerencia@example.com' },
      { id: 'r2', name: '', role: 'cfo', channel: 'whatsapp', address: '+57 300 000 0000' },
    ],
  };
}

/** Valida lo leído de localStorage: si algo no cuadra, se usan los valores por defecto. */
function sanitize(raw: unknown): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Settings>;
  const sector = SECTORS.includes(r.sector as SectorId) ? (r.sector as SectorId) : base.sector;
  const companies: Settings['companies'] = {};
  for (const s of SECTORS) {
    const c = r.companies?.[s];
    if (c && typeof c.name === 'string' && typeof c.nit === 'string' && typeof c.city === 'string') companies[s] = { name: c.name.slice(0, 120), nit: c.nit.slice(0, 20), city: c.city.slice(0, 60) };
  }
  const goals = { ...base.goals };
  const thresholds = { ...base.thresholds };
  for (const s of SECTORS) {
    const g = r.goals?.[s];
    if (typeof g === 'number' && Number.isFinite(g) && g >= -50 && g <= 100) goals[s] = g;
    const t = r.thresholds?.[s];
    if (t && typeof t === 'object') {
      const merged = { ...base.thresholds[s] };
      for (const k of Object.keys(merged) as (keyof typeof merged)[]) {
        const v = (t as unknown as Record<string, unknown>)[k];
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100_000) merged[k] = v;
      }
      thresholds[s] = merged;
    }
  }
  const recipients = Array.isArray(r.recipients)
    ? r.recipients
        .filter((x) => x && typeof x.name === 'string' && typeof x.address === 'string' && (x.channel === 'email' || x.channel === 'whatsapp'))
        .slice(0, 10)
        .map((x, i) => ({
          id: typeof x.id === 'string' ? x.id : `r${i}`,
          name: x.name.slice(0, 80),
          role: x.role === 'ceo' || x.role === 'cfo' ? x.role : undefined,
          channel: x.channel,
          address: x.address.slice(0, 120),
        }))
    : base.recipients;
  return { sector, companies, goals, thresholds, recipients };
}

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'error';
}

interface Store {
  /** Mes de corte de los datos de ejemplo (último mes cerrado). */
  anchor: MonthKey;
  settings: Settings;
  saveSettings: (s: Settings) => void;
  resetAll: () => void;
  company: CompanyProfile;
  dataset: Dataset;
  setUpload: (ds: Dataset | null) => void;
  periods: Period[];
  period: Period;
  setPeriodKey: (k: string) => void;
  ctx: Context;
  alerts: Alert[];
  findings: Finding[];
  view: ViewId;
  /** Cambia de sección; con `target` baja hasta ese elemento (id) cuando la sección se pinta. */
  setView: (v: ViewId, target?: string) => void;
  scrollTarget: string | null;
  clearScrollTarget: () => void;
  /** Filtro de segmento de la vista Clientes (se puede fijar desde los primeros pasos o las alertas). */
  segment: 'all' | Segment;
  setSegment: (s: 'all' | Segment) => void;
  guide: GuideProgress;
  markGuide: (step: GuideStep) => void;
  /** Bloque de primeros pasos abierto (se recuerda en el navegador; «Restablecer demo» lo vuelve a abrir). */
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  customer: string | null;
  openCustomer: (name: string | null) => void;
  invoice: string | null;
  openInvoice: (id: string | null) => void;
  toasts: Toast[];
  notify: (text: string, tone?: Toast['tone']) => void;
}

const Ctx = createContext<Store | null>(null);

function readJson(key: string): unknown {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible (modo privado): la demo sigue funcionando sin guardar */
  }
}

export function DashboardProvider({ anchor: anchorProp, children }: { anchor: MonthKey; children: ReactNode }) {
  const anchor = isMonthKey(anchorProp) ? anchorProp : REFERENCE_ANCHOR;
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [upload, setUploadState] = useState<Dataset | null>(null);
  const [periodKey, setPeriodKeyState] = useState<string | null>(null);
  const [view, setViewState] = useState<ViewId>('resumen');
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [segment, setSegment] = useState<'all' | Segment>('all');
  const [guide, setGuide] = useState<GuideProgress>(emptyGuide);
  const [guideOpen, setGuideOpenState] = useState(true);
  const [customer, setCustomer] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Lo guardado en este navegador se lee después de montar (el HTML del servidor no lo conoce).
  useEffect(() => {
    const saved = readJson(SETTINGS_KEY);
    if (saved) setSettings(sanitize(saved));
    const p = readJson(PERIOD_KEY) as { key?: unknown; anchor?: unknown } | null;
    if (p && typeof p.key === 'string' && p.anchor === anchor) setPeriodKeyState(p.key);
    const g = readJson(GUIDE_KEY) as Partial<GuideProgress> | null;
    if (g && typeof g === 'object') {
      const next = emptyGuide();
      for (const k of GUIDE_STEPS) next[k] = g[k] === true;
      setGuide(next);
    }
    try {
      if (window.localStorage.getItem(GUIDE_OPEN_KEY) === '0') setGuideOpenState(false);
    } catch {
      /* sin almacenamiento: queda abierto */
    }
  }, [anchor]);

  const setGuideOpen = useCallback((open: boolean) => {
    setGuideOpenState(open);
    try {
      window.localStorage.setItem(GUIDE_OPEN_KEY, open ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const markGuide = useCallback((step: GuideStep) => {
    setGuide((g) => {
      if (g[step]) return g;
      const next = { ...g, [step]: true };
      writeJson(GUIDE_KEY, next);
      return next;
    });
  }, []);

  const sample = useMemo(() => buildSample(settings.sector, anchor), [settings.sector, anchor]);
  const dataset = upload ?? sample;
  const idx = useMemo(() => buildIndex(dataset), [dataset]);
  const periods = useMemo(() => periodOptions(dataset), [dataset]);
  const period = useMemo(() => findPeriod(dataset, periodKey), [dataset, periodKey]);
  const params = useMemo(
    () => ({ goalGrowth: settings.goals[settings.sector], thresholds: settings.thresholds[settings.sector] }),
    [settings.goals, settings.thresholds, settings.sector],
  );
  const ctx = useMemo(() => buildContext(idx, period, params), [idx, period, params]);
  const alertList = useMemo(() => buildAlerts(ctx), [ctx]);
  const findingList = useMemo(() => buildFindings(ctx), [ctx]);
  const company = settings.companies[settings.sector] ?? PRESETS[settings.sector].company;

  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const saveSettings = useCallback((s: Settings) => {
    setSettings(s);
    writeJson(SETTINGS_KEY, s);
  }, []);

  const resetAll = useCallback(() => {
    setSettings(defaultSettings());
    setUploadState(null);
    setPeriodKeyState(null);
    setSegment('all');
    setGuide(emptyGuide());
    setGuideOpenState(true);
    setCustomer(null);
    setInvoice(null);
    writeJson(SETTINGS_KEY, null);
    writeJson(PERIOD_KEY, null);
    writeJson(GUIDE_KEY, null);
    writeJson(GUIDE_OPEN_KEY, null);
  }, []);

  const setPeriodKey = useCallback(
    (k: string) => {
      setPeriodKeyState(k);
      writeJson(PERIOD_KEY, { key: k, anchor });
      markGuide('period');
    },
    [anchor, markGuide],
  );

  const setUpload = useCallback((ds: Dataset | null) => {
    setUploadState(ds);
    setPeriodKeyState(null);
  }, []);

  const setView = useCallback(
    (v: ViewId, target?: string) => {
      setViewState(v);
      if (v === 'finanzas') markGuide('finance');
      // Con `target` baja hasta ese bloque cuando la sección se pinta; si no, al comienzo de la sección.
      setScrollTarget(target ?? 'exec-content');
    },
    [markGuide],
  );

  const clearScrollTarget = useCallback(() => setScrollTarget(null), []);

  const openCustomer = useCallback(
    (name: string | null) => {
      setCustomer(name);
      if (name) markGuide('customer');
    },
    [markGuide],
  );

  const value: Store = {
    anchor,
    settings,
    saveSettings,
    resetAll,
    company,
    dataset,
    setUpload,
    periods,
    period,
    setPeriodKey,
    ctx,
    alerts: alertList,
    findings: findingList,
    view,
    setView,
    scrollTarget,
    clearScrollTarget,
    segment,
    setSegment,
    guide,
    markGuide,
    guideOpen,
    setGuideOpen,
    customer,
    openCustomer,
    invoice,
    openInvoice: setInvoice,
    toasts,
    notify,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDashboard fuera de DashboardProvider');
  return v;
}
