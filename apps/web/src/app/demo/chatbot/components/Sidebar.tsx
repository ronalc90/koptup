'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LAYERS, type LayerKey } from './data';
import Tooltip from './ui/Tooltip';
import InfoIcon from './ui/InfoIcon';

interface SidebarProps {
  activeLayer: LayerKey | null;
  onSelect: (key: LayerKey) => void;
}

/**
 * Navegación lateral por las 19 capas de la plataforma RAG.
 * Todas las capas visibles por defecto con scroll vertical.
 * Buscador en el header filtra in-line.
 */
export default function Sidebar({ activeLayer, onSelect }: SidebarProps) {
  const t = useTranslations('demoChatbot');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return LAYERS;
    return LAYERS.filter((l) => {
      const title = t(`layers.${l.key}.title`).toLowerCase();
      const summary = t(`layers.${l.key}.summary`).toLowerCase();
      return title.includes(q) || summary.includes(q);
    });
  }, [filter, t]);

  const renderItem = (layer: (typeof LAYERS)[number]) => {
    const isActive = activeLayer === layer.key;
    const tooltip = t(`ux.layers.${layer.key}`);
    return (
      <li key={layer.key}>
        <Tooltip content={tooltip} side="right" align="center" maxWidth={280}>
          <button
            type="button"
            onClick={() => onSelect(layer.key)}
            className={`group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
              isActive
                ? 'bg-primary-50 text-primary-900 shadow-sm ring-1 ring-primary-200 dark:bg-primary-950/70 dark:text-primary-100 dark:ring-primary-800/60'
                : 'text-secondary-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-secondary-200 dark:text-secondary-300 dark:hover:bg-secondary-800/60 dark:hover:ring-secondary-700'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className={`mt-0.5 inline-flex h-5 w-7 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-200 text-secondary-700 group-hover:bg-primary-100 group-hover:text-primary-800 dark:bg-secondary-800 dark:text-secondary-300 dark:group-hover:bg-primary-900/40 dark:group-hover:text-primary-200'
              }`}
            >
              {layer.glyph}
            </span>
            <span className="flex-1 leading-tight">
              <span className="block font-semibold tracking-tight">
                {t(`layers.${layer.key}.title`)}
              </span>
              <span className="mt-0.5 block text-[10.5px] text-secondary-500 dark:text-secondary-400">
                {t(`layers.${layer.key}.summary`)}
              </span>
            </span>
          </button>
        </Tooltip>
      </li>
    );
  };

  return (
    <aside
      className="flex min-h-0 w-full flex-1 flex-col border-r border-secondary-200 bg-white/70 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/70"
      aria-label={t('sidebar.title')}
    >
      <div className="border-b border-secondary-200 px-4 py-4 dark:border-secondary-800">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('sidebar.title')}
          </p>
          <InfoIcon content={t('ux.sectionInfo.sidebar')} side="bottom" align="end" />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-secondary-500 dark:text-secondary-400">
          {t('sidebar.subtitle')}
        </p>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('sidebar.search')}
          className="mt-3 w-full rounded-md border border-secondary-200 bg-white px-2.5 py-1.5 text-xs text-secondary-900 placeholder:text-secondary-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
          aria-label={t('sidebar.search')}
        />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-secondary-400">
            {t('sidebar.noResults')}
          </p>
        ) : (
          <ul className="space-y-1">{filtered.map(renderItem)}</ul>
        )}
        <p className="mt-3 px-3 text-[10px] text-secondary-400 dark:text-secondary-500">
          {filtered.length} / {LAYERS.length} capacidades
        </p>
      </nav>
    </aside>
  );
}
