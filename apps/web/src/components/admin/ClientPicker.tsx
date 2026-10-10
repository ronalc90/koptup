'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/demo-system';
import type { ClientAccount } from '@/lib/portal';

/**
 * Selector de la cuenta de un cliente (Admin › Proyectos, Facturas y
 * Conversaciones). Busca en GET /api/admin/clients (cuentas `client`, `user`
 * o `prospect`; nunca las del equipo).
 */
export default function ClientPicker({
  value,
  onChange,
  label,
}: {
  value: ClientAccount | null;
  onChange: (client: ClientAccount | null) => void;
  label: string;
}) {
  const t = useTranslations('adminClientPicker');
  const inputId = useId();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (value) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      apiRequest<ClientAccount[]>(`/admin/clients${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
        .then((rows) => {
          if (!cancelled) setResults(Array.isArray(rows) ? rows : []);
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, value]);

  if (value) {
    return (
      <div>
        <p className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{label}</p>
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-950" data-testid="client-picker-selected">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
              {value.name}
              {value.company ? ` · ${value.company}` : ''}
            </p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">{value.email}</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900" aria-label={t('change')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('placeholder')}
        className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
        autoComplete="off"
      />
      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-secondary-200 dark:border-secondary-800 divide-y divide-secondary-100 dark:divide-secondary-800">
        {loading ? (
          <p className="p-3 text-sm text-secondary-500">{t('loading')}</p>
        ) : failed ? (
          <p className="p-3 text-sm text-red-600">{t('error')}</p>
        ) : results.length === 0 ? (
          <p className="p-3 text-sm text-secondary-500">{t('empty')}</p>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c)}
              className="w-full text-left px-3 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-900"
              data-testid="client-picker-option"
            >
              <span className="block text-sm font-medium text-secondary-900 dark:text-white">
                {c.name}
                {c.company ? ` · ${c.company}` : ''}
              </span>
              <span className="block text-xs text-secondary-500">
                {c.email} · {t(`roles.${c.role === 'prospect' ? 'prospect' : 'client'}`)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
