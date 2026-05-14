'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { LAYERS, type LayerKey } from './data';
import Tooltip from './ui/Tooltip';
import InfoIcon from './ui/InfoIcon';

interface SidebarProps {
  activeLayer: LayerKey | null;
  onSelect: (key: LayerKey) => void;
}

/**
 * Navegación lateral por las 19 capas de la plataforma RAG.
 *
 * Reducción de densidad:
 *  - Las 6 capas primarias quedan visibles por defecto.
 *  - Las 13 restantes se agrupan bajo "Más capacidades" (collapse-by-default).
 *  - Cada item tiene tooltip con descripción breve al hover (sin click).
 */
const PRIMARY_LAYERS: ReadonlySet<LayerKey> = new Set([
  'ingestion',
  'retrieval',
  'ranking',
  'models',
  'security',
  'observability',
]);

export default function Sidebar({ activeLayer, onSelect }: SidebarProps) {
  const t = useTranslations('demoChatbot');
  const [filter, setFilter] = useState('');
  const [showMore, setShowMore] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return LAYERS;
    return LAYERS.filter((l) => {
      const title = t(`layers.${l.key}.title`).toLowerCase();
      return title.includes(q);
    });
  }, [filter, t]);

  // Cuando se filtra, mostramos todos los matches; sino, dividimos primarias/avanzadas.
  const isFiltering = filter.trim().length > 0;
  const primary = useMemo(
    () => filtered.filter((l) => PRIMARY_LAYERS.has(l.key)),
    [filtered],
  );
  const advanced = useMemo(
    () => filtered.filter((l) => !PRIMARY_LAYERS.has(l.key)),
    [filtered],
  );

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
      className="flex h-full w-full flex-col border-r border-secondary-200 bg-white/70 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/70"
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

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {isFiltering ? (
          <ul className="space-y-1">{filtered.map(renderItem)}</ul>
        ) : (
          <>
            <ul className="space-y-1">{primary.map(renderItem)}</ul>
            {advanced.length > 0 ? (
              <div className="mt-3 border-t border-secondary-200/70 pt-3 dark:border-secondary-800/70">
                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-800/50 dark:hover:text-secondary-200"
                  aria-expanded={showMore}
                >
                  <span className="flex items-center gap-1.5">
                    {showMore ? (
                      <ChevronDownIcon className="h-3 w-3" />
                    ) : (
                      <ChevronRightIcon className="h-3 w-3" />
                    )}
                    {showMore
                      ? t('ux.sidebarMore.hide')
                      : t('ux.sidebarMore.showMore', { count: advanced.length })}
                  </span>
                  <span className="font-mono normal-case tracking-normal text-secondary-400">
                    {advanced.length}
                  </span>
                </button>
                {showMore ? (
                  <ul className="mt-2 space-y-1">{advanced.map(renderItem)}</ul>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </nav>
    </aside>
  );
}
