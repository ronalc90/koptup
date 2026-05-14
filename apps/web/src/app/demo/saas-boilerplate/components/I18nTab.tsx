'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { CodeBlock } from './shared';

type Locale = 'es-AR' | 'en-US' | 'pt-BR' | 'de-DE';
type Currency = 'USD' | 'EUR' | 'ARS' | 'BRL';

const localeOptions: { v: Locale; flag: string; label: string }[] = [
  { v: 'es-AR', flag: 'AR', label: 'Español (AR)' },
  { v: 'en-US', flag: 'US', label: 'English (US)' },
  { v: 'pt-BR', flag: 'BR', label: 'Português (BR)' },
  { v: 'de-DE', flag: 'DE', label: 'Deutsch (DE)' },
];

const timezones = [
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/Berlin',
  'Asia/Tokyo',
];

export default function I18nTab() {
  const t = useTranslations('demoSaas');
  const [locale, setLocale] = useState<Locale>('es-AR');
  const [tz, setTz] = useState(timezones[0]);
  const [currency, setCurrency] = useState<Currency>('USD');

  const previewPrice = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(1299.5);
  const previewDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', timeZone: tz }).format(new Date());

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('i18n.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('i18n.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-secondary-500 mb-2">{t('i18n.languageLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                {localeOptions.map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setLocale(o.v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      locale === o.v
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100'
                        : 'border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800">{o.flag}</span>
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-secondary-500 mb-2">{t('i18n.timezoneLabel')}</label>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white"
              >
                {timezones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary-500 mb-2">{t('i18n.currencyLabel')}</label>
              <div className="grid grid-cols-4 gap-2">
                {(['USD', 'EUR', 'ARS', 'BRL'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currency === c
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('i18n.previewLabel')}</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3">
              <div className="text-xs text-secondary-500 mb-1">{t('i18n.examplePrice')}</div>
              <div className="text-2xl font-bold text-secondary-900 dark:text-white">{previewPrice}</div>
            </div>
            <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3">
              <div className="text-xs text-secondary-500 mb-1">{t('i18n.exampleDate')}</div>
              <div className="text-sm text-secondary-900 dark:text-white">{previewDate}</div>
            </div>
            <CodeBlock
              lang="ts"
              code={`new Intl.NumberFormat('${locale}', {\n  style: 'currency',\n  currency: '${currency}'\n}).format(1299.5);`}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
