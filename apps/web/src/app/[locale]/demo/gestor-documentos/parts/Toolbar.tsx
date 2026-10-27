'use client';

import { useTranslations } from 'next-intl';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ScaleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SUGGESTED_QUERIES } from '../lib/sample';
import { useDocs } from '../lib/store';
import type { DateFilter, Filters, SortKey, TypeFilter } from '../lib/types';
import { focusRing, inputCls, labelCls } from './ui';

interface ToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  tags: string[];
  resultCount: number;
  onSemantic: () => void;
  onExport: () => void;
  onAudit: () => void;
  onMenu: () => void;
  showSuggestions: boolean;
}

const TYPES: TypeFilter[] = ['all', 'pdf', 'docx', 'txt', 'csv'];
const DATES: DateFilter[] = ['all', 'd7', 'd30', 'd365'];
const SORTS: SortKey[] = ['relevance', 'newest', 'oldest', 'name', 'size'];

export default function Toolbar(p: ToolbarProps) {
  const t = useTranslations('demoDocs');
  const { loc, mode } = useDocs();
  const active = (p.filters.type !== 'all' ? 1 : 0) + (p.filters.date !== 'all' ? 1 : 0) + (p.filters.tag ? 1 : 0);
  const iconBtn = `inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${focusRing}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={p.onMenu} className={`${iconBtn} md:hidden`} aria-label={t('shell.menu')}>
          <Bars3Icon className="h-5 w-5" />
          <span>{t('shell.menu')}</span>
        </button>
        <div className="relative min-w-[200px] flex-1 basis-64">
          <label htmlFor="docs-search" className="sr-only">
            {t('toolbar.searchLabel')}
          </label>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="docs-search"
            type="search"
            value={p.query}
            maxLength={100}
            onChange={(e) => p.onQuery(e.target.value)}
            placeholder={t('toolbar.searchPlaceholder')}
            className="w-full rounded-lg bg-slate-100 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          />
          {p.query && (
            <button type="button" onClick={() => p.onQuery('')} aria-label={t('toolbar.clear')} className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white ${focusRing}`}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={p.onSemantic}
          disabled={!p.query.trim()}
          title={p.query.trim() ? undefined : t('toolbar.semanticHint')}
          className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <SparklesIcon className="h-5 w-5" />
          <span>{t('toolbar.semantic')}</span>
        </button>
        <button type="button" onClick={p.onToggleFilters} aria-expanded={p.showFilters} aria-controls="docs-filters" className={iconBtn}>
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>{t('toolbar.filters')}</span>
          {active > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">{active}</span>}
        </button>
        <button type="button" onClick={p.onExport} className={iconBtn}>
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>{t('toolbar.export')}</span>
        </button>
        <button type="button" onClick={p.onAudit} className={iconBtn}>
          <ScaleIcon className="h-5 w-5" />
          <span>{t('toolbar.audit')}</span>
        </button>
      </div>

      {p.showFilters && (
        <div id="docs-filters" className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="f-type" className={labelCls}>{t('toolbar.typeLabel')}</label>
            <select id="f-type" value={p.filters.type} onChange={(e) => p.onFilters({ ...p.filters, type: e.target.value as TypeFilter })} className={inputCls}>
              {TYPES.map((x) => (
                <option key={x} value={x}>{t(`toolbar.types.${x}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-date" className={labelCls}>{t('toolbar.dateLabel')}</label>
            <select id="f-date" value={p.filters.date} onChange={(e) => p.onFilters({ ...p.filters, date: e.target.value as DateFilter })} className={inputCls}>
              {DATES.map((x) => (
                <option key={x} value={x}>{t(`toolbar.dates.${x}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-tag" className={labelCls}>{t('toolbar.tagLabel')}</label>
            <select id="f-tag" value={p.filters.tag} onChange={(e) => p.onFilters({ ...p.filters, tag: e.target.value })} className={inputCls}>
              <option value="">{t('toolbar.tagAll')}</option>
              {p.tags.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-sort" className={labelCls}>{t('toolbar.sortLabel')}</label>
            <select id="f-sort" value={p.sort} onChange={(e) => p.onSort(e.target.value as SortKey)} className={inputCls}>
              {SORTS.map((x) => (
                <option key={x} value={x}>{t(`toolbar.sort.${x}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => p.onFilters({ type: 'all', date: 'all', tag: '' })}
              className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${focusRing}`}
            >
              {t('toolbar.clearFilters')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span aria-live="polite">{t('toolbar.results', { count: p.resultCount })}</span>
        {p.showSuggestions && mode === 'sample' && (
          <>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
            <span>{t('toolbar.suggested')}</span>
            {SUGGESTED_QUERIES[loc].map((q) => (
              <button key={q} type="button" onClick={() => p.onQuery(q)} className={`rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-slate-700 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-blue-300 ${focusRing}`}>
                {q}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
