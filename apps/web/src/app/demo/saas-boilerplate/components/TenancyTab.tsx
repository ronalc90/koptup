'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CodeBlock } from './shared';

type TenancyKey = 'sharedDb' | 'schemaPerTenant' | 'dbPerTenant';

export default function TenancyTab() {
  const t = useTranslations('demoSaas');
  const [tenancy, setTenancy] = useState<TenancyKey>('sharedDb');
  const tenancyKeys: TenancyKey[] = ['sharedDb', 'schemaPerTenant', 'dbPerTenant'];

  const pros = t.raw(`tenancy.patterns.${tenancy}.pros`) as string[];
  const cons = t.raw(`tenancy.patterns.${tenancy}.cons`) as string[];
  const snippet = t(`tenancy.patterns.${tenancy}.snippet`);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('tenancy.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('tenancy.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tenancyKeys.map((k) => {
          const active = tenancy === k;
          return (
            <button
              key={k}
              onClick={() => setTenancy(k)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                active
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-secondary-900 dark:text-white">{t(`tenancy.patterns.${k}.name`)}</div>
                {active && <CheckCircleIcon className="w-5 h-5 text-primary-600" />}
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t(`tenancy.patterns.${k}.tagline`)}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-2">{t('tenancy.prosLabel')}</div>
              <ul className="space-y-1.5">
                {pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mb-2">{t('tenancy.consLabel')}</div>
              <ul className="space-y-1.5">
                {cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                    <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 mb-2 px-1">{t('tenancy.snippetLabel')}</div>
          <CodeBlock code={snippet} lang={tenancy === 'sharedDb' ? 'sql' : 'ts'} />
        </Card>
      </div>
    </section>
  );
}
