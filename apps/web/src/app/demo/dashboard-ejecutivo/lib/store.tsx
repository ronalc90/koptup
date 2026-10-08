'use client';

/**
 * Estado del tablero en el navegador: preferencias guardadas en localStorage
 * (prefijo `demo:bi:`), dataset activo (ejemplo o CSV del visitante, que no se
 * guarda ni sale del navegador), período, vista y avisos.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSample } from './dataset';
import { alerts as buildAlerts, buildContext, buildIndex, findPeriod, findings as buildFindings, periodOptions, type Alert, type Context, type Finding } from './engine';
import { PRESETS } from './presets';
import { SECTORS, type CompanyProfile, type Dataset, type Period, type SectorId, type Settings, type ViewId } from './types';

const SETTINGS_KEY = 'demo:bi:settings:v1';
const PERIOD_KEY = 'demo:bi:period:v1';

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
  setView: (v: ViewId) => void;
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

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [upload, setUploadState] = useState<Dataset | null>(null);
  const [periodKey, setPeriodKeyState] = useState<string | null>(null);
  const [view, setViewState] = useState<ViewId>('resumen');
  const [customer, setCustomer] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const saved = readJson(SETTINGS_KEY);
    if (saved) setSettings(sanitize(saved));
    const p = readJson(PERIOD_KEY);
    if (typeof p === 'string') setPeriodKeyState(p);
  }, []);

  const sample = useMemo(() => buildSample(settings.sector), [settings.sector]);
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
    writeJson(SETTINGS_KEY, null);
    writeJson(PERIOD_KEY, null);
  }, []);

  const setPeriodKey = useCallback((k: string) => {
    setPeriodKeyState(k);
    writeJson(PERIOD_KEY, k);
  }, []);

  const setUpload = useCallback((ds: Dataset | null) => {
    setUploadState(ds);
    setPeriodKeyState(null);
  }, []);

  const setView = useCallback((v: ViewId) => {
    setViewState(v);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const value: Store = {
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
    customer,
    openCustomer: setCustomer,
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
