'use client';

/**
 * TenantSelector — dropdown que lista los bots (tenants) creados, permite
 * cambiar el activo, crear uno nuevo y eliminar el actual.
 *
 * SRP: única responsabilidad → orquestar la lista de tenants persistida en
 * el backend (`/api/chatbot/bots`). El llamador es responsable de reflejar
 * el cambio (recargar config, redirigir, etc.) vía callbacks.
 *
 * Persiste el bot activo en `localStorage` con la clave global
 * `koptup.chatbot.currentBotId` para que distintas vistas (Builder y
 * Playground) compartan el mismo "tenant actual".
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { deleteBot, listBots, type RemoteBotSummary } from './api';

export const CURRENT_BOT_LS_KEY = 'koptup.chatbot.currentBotId';

interface TenantSelectorProps {
  /** Bot actualmente seleccionado (se resalta en la lista). */
  currentBotId: string | null;
  /** Llamado cuando el usuario selecciona otro bot. */
  onSelect: (botId: string) => void;
  /** Llamado cuando el usuario quiere crear un bot nuevo. */
  onCreateNew: () => void;
  /**
   * Llamado cuando el bot actual fue eliminado (para que el llamador limpie
   * su estado y vuelva a un default razonable).
   */
  onDeleted?: () => void;
}

function persistCurrent(botId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (botId) window.localStorage.setItem(CURRENT_BOT_LS_KEY, botId);
    else window.localStorage.removeItem(CURRENT_BOT_LS_KEY);
  } catch {
    /* localStorage no disponible — no bloqueamos. */
  }
}

export default function TenantSelector({
  currentBotId,
  onSelect,
  onCreateNew,
  onDeleted,
}: TenantSelectorProps) {
  const t = useTranslations('demoChatbot');
  const [bots, setBots] = useState<RemoteBotSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listBots();
      setBots(next);
    } catch {
      // 404/offline: dejamos la lista vacía, no rompemos la UI.
      setBots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, currentBotId]);

  // Persistir current cada vez que cambia.
  useEffect(() => {
    persistCurrent(currentBotId);
  }, [currentBotId]);

  // Cerrar al hacer click afuera del dropdown.
  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const current = bots.find((b) => b.botId === currentBotId);
  const label = current?.name || t('tenants.selectBot');
  const avatar = current?.avatar || '🤖';

  const handleSelect = useCallback(
    (botId: string) => {
      setOpen(false);
      onSelect(botId);
    },
    [onSelect],
  );

  const handleCreate = useCallback(() => {
    setOpen(false);
    onCreateNew();
  }, [onCreateNew]);

  const handleDelete = useCallback(
    async (botId: string, name: string) => {
      if (typeof window !== 'undefined') {
        const ok = window.confirm(t('tenants.deleteConfirm', { name }));
        if (!ok) return;
      }
      try {
        await deleteBot(botId);
        toast.success(t('tenants.deleted', { name }));
        await refresh();
        if (botId === currentBotId) {
          persistCurrent(null);
          onDeleted?.();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'error';
        toast.error(`${t('tenants.deleteFailed')}: ${msg}`);
      }
    },
    [currentBotId, onDeleted, refresh, t],
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-md border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition hover:border-primary-300 hover:bg-primary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-violet-600 text-[11px] text-white">
          {avatar}
        </span>
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-secondary-500 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-xl dark:border-secondary-700 dark:bg-secondary-900"
        >
          <div className="flex items-center justify-between border-b border-secondary-100 px-3 py-2 dark:border-secondary-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
              <BuildingOffice2Icon className="mr-1 inline h-3 w-3" />
              {t('tenants.selectBot')}
            </p>
            {loading ? (
              <span className="text-[10px] text-secondary-400">…</span>
            ) : (
              <span className="text-[10px] text-secondary-400">{bots.length}</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {bots.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] italic text-secondary-500 dark:text-secondary-400">
                {t('tenants.empty')}
              </p>
            ) : (
              <ul className="py-1">
                {bots.map((b) => {
                  const selected = b.botId === currentBotId;
                  return (
                    <li key={b.botId}>
                      <div
                        className={`group flex items-center gap-2 px-3 py-2 transition ${
                          selected
                            ? 'bg-primary-50 dark:bg-primary-950/40'
                            : 'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(b.botId)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm"
                            style={{ backgroundColor: b.color || '#4F46E5', color: 'white' }}
                          >
                            {b.avatar || '🤖'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-secondary-800 dark:text-secondary-100">
                              {b.name}
                            </span>
                            <span className="block truncate text-[10px] text-secondary-500 dark:text-secondary-400">
                              {t('tenants.docsCount', { count: b.docsCount })} ·{' '}
                              {t('tenants.conversationsCount', {
                                count: b.conversationsCount,
                              })}
                            </span>
                          </span>
                          {selected ? (
                            <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.botId, b.name)}
                          aria-label={t('tenants.deleteBot')}
                          className="rounded p-1 text-secondary-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-1.5 border-t border-secondary-100 bg-secondary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-secondary-800 dark:bg-secondary-950 dark:text-primary-200 dark:hover:bg-secondary-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t('tenants.createBot')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
