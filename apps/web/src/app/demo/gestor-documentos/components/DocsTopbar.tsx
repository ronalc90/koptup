'use client';

import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

export type SearchMode = 'bm25' | 'dense' | 'hybrid';

interface DocsTopbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSemanticSearch: () => void;
  onToggleFilters: () => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  rightExtras?: React.ReactNode;
}

/**
 * Topbar global del DMS: search bar principal + segmented control BM25/Dense/Hybrid
 * + acciones secundarias (búsqueda IA, filtros) + ranura para extras (E-discovery, etc).
 */
export default function DocsTopbar({
  searchQuery,
  onSearchChange,
  onSemanticSearch,
  onToggleFilters,
  searchMode,
  onSearchModeChange,
  rightExtras,
}: DocsTopbarProps) {
  const t = useTranslations('docManager');
  const tp = useTranslations('demoDocsPro');

  const modes: SearchMode[] = ['bm25', 'dense', 'hybrid'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Segmented control BM25 / Dense / Hybrid */}
        <div
          className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1"
          role="group"
          aria-label={tp('topbar.modeLabel')}
          title={tp('topbar.modeHint')}
        >
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onSearchModeChange(m)}
              aria-pressed={searchMode === m}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                searchMode === m
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tp(`search.modes.${m}`)}
            </button>
          ))}
        </div>

        <button
          onClick={onSemanticSearch}
          className="px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <SparklesIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{t('search.aiSearch')}</span>
        </button>
        <button
          onClick={onToggleFilters}
          className="px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{t('filters.title')}</span>
        </button>

        {rightExtras}
      </div>
    </div>
  );
}
