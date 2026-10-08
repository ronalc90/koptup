'use client';

/**
 * MyBotsMenu — "Mis bots": los bots creados desde este navegador (registro en
 * localStorage con su token de dueño). Permite cargar uno, crear uno nuevo y
 * eliminarlo en el backend (`DELETE /api/chatbot/bots/:id`).
 *
 * No lista los bots de otras personas: el backend expone `GET /bots`, pero la
 * demo solo muestra los propios.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, PlusIcon, TrashIcon, CheckIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { BotApiError, deleteBot, forgetBot, listOwnedBots } from './api';

interface MyBotsMenuProps {
  currentBotId: string | null;
  /** Cambia cuando se guarda un bot (para refrescar la lista). */
  refreshKey: number;
  onSelect: (botId: string) => void;
  onCreateNew: () => void;
  onDeleted: (botId: string) => void;
}

export default function MyBotsMenu({ currentBotId, refreshKey, onSelect, onCreateNew, onDeleted }: MyBotsMenuProps) {
  const t = useTranslations('demoChatbot.builder.myBots');
  const [bots, setBots] = useState<Array<{ botId: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setBots(listOwnedBots('builder').map((b) => ({ botId: b.botId, name: b.name })));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey, currentBotId, open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleDelete = useCallback(
    async (botId: string, name: string) => {
      if (!window.confirm(t('deleteConfirm', { name }))) return;
      try {
        await deleteBot(botId);
        toast.success(t('deleted', { name }));
      } catch (err) {
        if (err instanceof BotApiError && err.status === 404) {
          // Ya no existía en el servidor: solo se quita de la lista.
          forgetBot(botId);
          toast.success(t('deleted', { name }));
        } else {
          toast.error(t('deleteFailed'));
          return;
        }
      }
      refresh();
      onDeleted(botId);
    },
    [onDeleted, refresh, t],
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition hover:border-primary-300 hover:bg-primary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
      >
        <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
        {t('label')}
        <span className="rounded bg-secondary-100 px-1 font-mono text-[10px] text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
          {bots.length}
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-secondary-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-xl dark:border-secondary-700 dark:bg-secondary-900 sm:left-auto sm:right-0">
          <p className="border-b border-secondary-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:border-secondary-800 dark:text-secondary-400">
            {t('title')}
          </p>
          <div className="max-h-72 overflow-y-auto">
            {bots.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] italic text-secondary-500 dark:text-secondary-400">{t('empty')}</p>
            ) : (
              <ul className="py-1">
                {bots.map((b) => {
                  const selected = b.botId === currentBotId;
                  return (
                    <li
                      key={b.botId}
                      className={`flex items-center gap-2 px-3 py-2 ${
                        selected ? 'bg-primary-50 dark:bg-primary-950/40' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onSelect(b.botId);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-secondary-800 dark:text-secondary-100">{b.name}</span>
                          <span className="block truncate font-mono text-[10px] text-secondary-500 dark:text-secondary-400">{b.botId}</span>
                        </span>
                        {selected ? <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-300" aria-hidden="true" /> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(b.botId, b.name)}
                        aria-label={`${t('delete')}: ${b.name}`}
                        className="rounded p-1 text-secondary-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreateNew();
            }}
            className="flex w-full items-center justify-center gap-1.5 border-t border-secondary-100 bg-secondary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-secondary-800 dark:bg-secondary-950 dark:text-primary-200 dark:hover:bg-secondary-800"
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t('create')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
