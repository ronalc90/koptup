'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bars3Icon,
  BellAlertIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatNit } from '../lib/presets';
import { useDashboard } from '../lib/store';
import { VIEWS, type ViewId } from '../lib/types';
import Alerts from './Alerts';
import Ask from './Ask';
import Customers, { CustomerModal, InvoiceModal } from './Customers';
import Finance from './Finance';
import { useNarrative } from './narrative';
import Overview from './Overview';
import { useReportPdf } from './report';
import SettingsView from './SettingsView';
import Sources from './Sources';
import { NS, SeverityBadge, Toasts, useFmt } from './ui';

const ICONS: Record<ViewId, typeof HomeIcon> = {
  resumen: HomeIcon,
  finanzas: CreditCardIcon,
  clientes: UserGroupIcon,
  preguntas: ChatBubbleLeftRightIcon,
  alertas: BellAlertIcon,
  fuentes: CircleStackIcon,
  configuracion: Cog6ToothIcon,
};

function initials(name: string) {
  const words = name.replace(/S\.A\.S\.?|S\.A\.?|LTDA\.?/gi, '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || 'E';
}

function Nav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const t = useTranslations(`${NS}.nav`);
  const { view, setView, alerts } = useDashboard();
  return (
    <nav className="space-y-1" aria-label={t('label')}>
      {VIEWS.map((v) => {
        const Icon = ICONS[v];
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              onNavigate?.();
            }}
            data-testid={`exec-menu-${v}`}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? t(v) : undefined}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${active ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg' : 'hover:bg-slate-700'}`}
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="font-medium text-sm flex-1">{t(v)}</span>}
            {v === 'alertas' && alerts.length > 0 && (
              <span className={`${collapsed ? 'absolute top-0.5 right-1' : ''} min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold inline-flex items-center justify-center`}>{alerts.length}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations(`${NS}.shell`);
  const { company, dataset } = useDashboard();
  const name = dataset.source === 'sample' ? company.name : dataset.fileName ?? '';
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-sm" aria-hidden="true">
        {dataset.source === 'sample' ? initials(company.name) : 'CSV'}
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate" title={name}>
            {name}
          </p>
          <p className="text-[11px] text-slate-300">{t('product')}</p>
        </div>
      )}
    </div>
  );
}

interface SearchResult {
  id: string;
  kind: 'view' | 'customer' | 'invoice';
  label: string;
  hint: string;
  run: () => void;
}

function Search() {
  const t = useTranslations(`${NS}.search`);
  const tn = useTranslations(`${NS}.nav`);
  const fmt = useFmt();
  const { ctx, dataset, setView, openCustomer, openInvoice } = useDashboard();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: SearchResult[] = [];
    for (const v of VIEWS) {
      if (tn(v).toLowerCase().includes(needle)) out.push({ id: `v:${v}`, kind: 'view', label: tn(v), hint: t('hintView'), run: () => setView(v) });
    }
    for (const c of ctx.idx.customers) {
      if (c.name.toLowerCase().includes(needle) || c.city.toLowerCase().includes(needle) || c.seller.toLowerCase().includes(needle)) {
        const stat = ctx.customers.find((x) => x.name === c.name);
        out.push({
          id: `c:${c.name}`,
          kind: 'customer',
          label: c.name,
          hint: t('hintCustomer', { city: c.city, sales: fmt.moneyM(stat?.sales ?? 0) }),
          run: () => {
            setView('clientes');
            openCustomer(c.name);
          },
        });
      }
    }
    if (needle.length >= 3) {
      for (const r of dataset.rows) {
        if (r.id.toLowerCase().includes(needle)) {
          out.push({ id: `i:${r.id}`, kind: 'invoice', label: r.id, hint: t('hintInvoice', { customer: r.customer, value: fmt.money(r.value), date: fmt.date(r.date) }), run: () => openInvoice(r.id) });
          if (out.filter((x) => x.kind === 'invoice').length >= 5) break;
        }
      }
    }
    return out.slice(0, 10);
  }, [q, ctx, dataset.rows, tn, t, fmt, setView, openCustomer, openInvoice]);

  const choose = (r: SearchResult) => {
    r.run();
    setOpen(false);
    setQ('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <label htmlFor="exec-search" className="sr-only">
        {t('label')}
      </label>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
      <input
        id="exec-search"
        type="search"
        role="combobox"
        aria-expanded={open && q.trim().length > 0}
        aria-controls="exec-search-list"
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `sr-${active}` : undefined}
        placeholder={t('placeholder')}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
        className="w-full pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        data-testid="exec-search-input"
      />
      {open && q.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[28rem] mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-50" data-testid="exec-search-panel">
          {results.length ? (
            <ul id="exec-search-list" role="listbox" aria-label={t('results')} className="p-2">
              {results.map((r, i) => (
                <li
                  key={r.id}
                  id={`sr-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`p-2.5 rounded-lg cursor-pointer ${i === active ? 'bg-purple-50 dark:bg-slate-700' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-purple-700 dark:text-purple-300">{t(`kinds.${r.kind}`)}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.label}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.hint}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p id="exec-search-list" className="p-4 text-sm text-slate-500">
              {t('empty', { q: q.trim() })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Bell() {
  const t = useTranslations(`${NS}.bell`);
  const { alerts, setView } = useDashboard();
  const { alertTitle } = useNarrative();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('open', { count: alerts.length })}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        data-testid="exec-header-notifications"
      >
        <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" aria-hidden="true" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">{alerts.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50" data-testid="exec-notifications-panel">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('title')}</h3>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-label={t('close')}>
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          {alerts.length ? (
            <ul className="max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <button
                    type="button"
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => {
                      setView(a.view);
                      setOpen(false);
                    }}
                  >
                    <SeverityBadge severity={a.severity} />
                    <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">{alertTitle(a)}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-slate-500">{t('empty')}</p>
          )}
          <div className="p-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setView('alertas');
                setOpen(false);
              }}
              className="w-full text-center text-sm font-medium text-purple-700 hover:text-purple-800 dark:text-purple-300 py-1.5"
            >
              {t('viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shell() {
  const t = useTranslations(`${NS}.shell`);
  const tn = useTranslations(`${NS}.nav`);
  const ts = useTranslations(`${NS}.sectors`);
  const fmt = useFmt();
  const { view, periods, period, setPeriodKey, company, dataset, setUpload } = useDashboard();
  const { download, busy } = useReportPdf();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sample = dataset.source === 'sample';

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <aside
        id="exec-sidebar"
        data-testid="exec-sidebar"
        className={`hidden md:block shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-[width] duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto p-4 flex flex-col gap-6">
          <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between gap-2'}`}>
            <Brand collapsed={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? t('expand') : t('collapse')}
              aria-expanded={!collapsed}
              aria-controls="exec-sidebar"
              data-testid="exec-sidebar-toggle"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            >
              {collapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
            </button>
          </div>
          <Nav collapsed={collapsed} />
          {!collapsed && (
            <p className="text-[11px] text-slate-300 border-t border-slate-700 pt-4">{sample ? t('sidebarSample') : t('sidebarUpload')}</p>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-16 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden" aria-hidden="true" onClick={() => setMobileOpen(false)} />
          <div
            id="exec-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={tn('label')}
            className="fixed left-0 top-16 bottom-0 w-72 max-w-[85vw] z-[61] md:hidden bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 overflow-y-auto flex flex-col gap-6"
          >
            <div className="flex items-center justify-between gap-2">
              <Brand collapsed={false} />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label={t('closeMenu')} className="p-2 hover:bg-slate-700 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <Nav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <p className="text-[11px] text-slate-300 border-t border-slate-700 pt-4">{sample ? t('sidebarSample') : t('sidebarUpload')}</p>
          </div>
        </>
      )}

      <div className="flex-1 min-w-0">
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-16 md:top-20 z-40">
          <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('openMenu')}
              aria-controls="exec-mobile-menu"
              aria-expanded={mobileOpen}
              className="md:hidden p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              data-testid="exec-mobile-hamburger"
            >
              <Bars3Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </button>
            <Search />
            <Bell />
            <button type="button" onClick={download} disabled={busy} className="inline-flex items-center gap-1.5 p-2.5 sm:px-3 sm:py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-60" aria-label={t('pdf')} data-testid="exec-pdf">
              <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">{busy ? t('pdfBusy') : t('pdf')}</span>
            </button>
          </div>
          <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
            <label htmlFor="exec-period" className="sr-only">
              {t('period')}
            </label>
            <select
              id="exec-period"
              value={period.key}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="exec-month-select"
            >
              {(['month', 'quarter', 'year'] as const).map((kind) => (
                <optgroup key={kind} label={t(`periodKinds.${kind}`)}>
                  {periods
                    .filter((p) => p.kind === kind)
                    .map((p) => (
                      <option key={p.key} value={p.key}>
                        {fmt.period(p)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900"
              title={sample ? t('sampleHint') : t('uploadHint')}
              data-testid="exec-sample-badge"
            >
              {sample ? t('sampleBadge') : t('uploadBadge')}
            </span>
            {sample ? (
              <span className="min-w-0">
                <strong className="text-slate-800 dark:text-slate-100">{company.name}</strong> · {t('nit', { nit: formatNit(company.nit) })} · {ts(`${dataset.sector}.name`)}
              </span>
            ) : (
              <span className="min-w-0">
                <strong className="text-slate-800 dark:text-slate-100">{dataset.fileName}</strong>{' '}
                <button type="button" className="ml-1 font-semibold text-purple-700 dark:text-purple-300 hover:underline" onClick={() => setUpload(null)}>
                  {t('backToSample')}
                </button>
              </span>
            )}
            <span>{t('cutoff', { date: fmt.date(dataset.cutoff) })}</span>
            <span>{t('currency')}</span>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tn(view)}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t(`intro.${view}`, { period: fmt.periodIn(period) })}</p>
          </div>
          {view === 'resumen' && <Overview />}
          {view === 'finanzas' && <Finance />}
          {view === 'clientes' && <Customers />}
          {view === 'preguntas' && <Ask />}
          {view === 'alertas' && <Alerts />}
          {view === 'fuentes' && <Sources />}
          {view === 'configuracion' && <SettingsView />}
        </main>
      </div>
      <CustomerModal />
      <InvoiceModal />
      <Toasts />
    </div>
  );
}
