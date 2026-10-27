'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchSite } from '@/lib/site-search';

interface SiteSearchProps {
  className?: string;
  /** Lo llama el menú móvil para cerrarse al ir a un resultado. */
  onNavigate?: () => void;
}

/**
 * Buscador del sitio: páginas y demos visibles (lib/site-search.ts). Enter va
 * al primer resultado; sin resultados lo dice.
 */
export default function SiteSearch({ className = '', onNavigate }: SiteSearchProps) {
  const t = useTranslations('search');
  const locale = useLocale() === 'en' ? 'en' : 'es';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputId = useId();
  const listId = `${inputId}-results`;
  const results = useMemo(() => searchSite(query, locale), [query, locale]);
  const hasQuery = query.trim().length > 0;

  const finish = () => {
    setQuery('');
    onNavigate?.();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const first = results[0];
    if (!first) return;
    finish();
    router.push(first.href);
  };

  return (
    <form role="search" onSubmit={onSubmit} className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        {t('label')}
      </label>
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
      />
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('placeholder')}
        autoComplete="off"
        aria-controls={hasQuery ? listId : undefined}
        className="w-full rounded-lg border border-secondary-300 bg-white py-2 pl-9 pr-3 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white"
      />
      {hasQuery && (
        <ul
          id={listId}
          aria-label={t('results')}
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-lg dark:border-secondary-700 dark:bg-secondary-900"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400">{t('empty')}</li>
          ) : (
            results.map((result) => (
              <li key={result.href}>
                <Link
                  href={result.href}
                  onClick={finish}
                  className="block px-3 py-2 text-sm text-secondary-800 hover:bg-primary-50 dark:text-secondary-200 dark:hover:bg-secondary-800"
                >
                  {result.label}
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  );
}
