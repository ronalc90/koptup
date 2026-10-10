'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CATEGORIES, STEP_TYPES, TYPE_DEFS, typeKey } from '../lib/catalog';
import { normalize } from '../lib/engine';
import type { Category, StepType } from '../lib/types';
import { TYPE_ICONS } from './icons';
import { focusRing } from './ui';

export const DRAG_NEW = 'application/x-koptup-new-step';

interface Props {
  onAdd: (type: StepType) => void;
  disabled?: boolean;
}

export default function NodePalette({ onAdd, disabled }: Props) {
  const t = useTranslations('demoAutomation');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<Category, boolean>>({ triggers: false, ai: false, apps: false, notify: false, logic: false, code: false });

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return STEP_TYPES;
    return STEP_TYPES.filter((type) => normalize(`${t(`types.${typeKey(type)}.name`)} ${t(`types.${typeKey(type)}.desc`)}`).includes(q));
  }, [search, t]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-secondary-800 px-3 py-2">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary-300">{t('palette.title')}</h2>
        <p className="mb-2 text-[11px] leading-snug text-secondary-500">{t('palette.hint')}</p>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('palette.searchPlaceholder')}
            aria-label={t('palette.searchPlaceholder')}
            className="w-full rounded-md border border-secondary-800 bg-secondary-900 py-1.5 pl-8 pr-2 text-xs text-secondary-200 placeholder-secondary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {filtered.length === 0 && <p className="px-2 py-4 text-center text-xs text-secondary-500">{t('palette.noResults')}</p>}
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((type) => TYPE_DEFS[type].category === cat);
          if (items.length === 0) return null;
          const open = !collapsed[cat] || !!search;
          return (
            <div key={cat}>
              <button
                type="button"
                onClick={() => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }))}
                aria-expanded={open}
                className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-400 hover:text-secondary-200 ${focusRing}`}
              >
                {open ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
                <span className="truncate">{t(`palette.categories.${cat}`)}</span>
                <span className="ml-auto normal-case text-secondary-500">{items.length}</span>
              </button>
              {open && (
                <ul className="mt-1 space-y-0.5">
                  {items.map((type) => {
                    const Icon = TYPE_ICONS[type];
                    return (
                      <li key={type}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onAdd(type)}
                          draggable={!disabled}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DRAG_NEW, type);
                            e.dataTransfer.setData('text/plain', type);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          title={t(`types.${typeKey(type)}.desc`)}
                          className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-secondary-300 transition-colors hover:bg-secondary-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-secondary-400" />
                          <span className="min-w-0 flex-1 truncate">{t(`types.${typeKey(type)}.name`)}</span>
                          <PlusIcon className="h-3 w-3 shrink-0 text-secondary-600 group-hover:text-primary-300" aria-hidden />
                          <span className="sr-only">{t('palette.addSr')}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
