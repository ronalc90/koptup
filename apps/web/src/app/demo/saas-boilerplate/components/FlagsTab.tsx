'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ProgressBar, Toggle } from './shared';

const flagsList = [
  { name: 'new-billing-ui', rollout: 100, tag: 'GA' },
  { name: 'ai-assistant', rollout: 35, tag: 'beta' },
  { name: 'export-csv', rollout: 80, tag: 'gradual' },
  { name: 'beta-analytics', rollout: 10, tag: 'internal' },
];

const experiments = [
  { name: 'checkout-v2', a: 12.4, b: 14.8 },
  { name: 'onboarding-tour', a: 38.2, b: 41.5 },
];

export default function FlagsTab() {
  const t = useTranslations('demoSaas');
  const [state, setState] = useState<Record<string, boolean>>({
    'new-billing-ui': true,
    'ai-assistant': false,
    'export-csv': true,
    'beta-analytics': false,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('flags.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('flags.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('flags.flagsTitle')}</h3>
          <div className="space-y-3">
            {flagsList.map((f) => (
              <div key={f.name} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-secondary-900 dark:text-white">{f.name}</code>
                    <Badge size="sm" variant={f.tag === 'GA' ? 'success' : f.tag === 'beta' ? 'warning' : 'info'}>{f.tag}</Badge>
                  </div>
                  <Toggle value={state[f.name]} onChange={() => setState((s) => ({ ...s, [f.name]: !s[f.name] }))} />
                </div>
                <div className="flex items-center justify-between text-xs text-secondary-500 mb-1">
                  <span>{f.rollout}% {t('flags.rollout')}</span>
                </div>
                <ProgressBar value={f.rollout} max={100} />
              </div>
            ))}
          </div>
        </Card>

        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('flags.experimentsTitle')}</h3>
          <div className="space-y-4">
            {experiments.map((e) => {
              const winner = e.b > e.a ? 'b' : 'a';
              return (
                <div key={e.name} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <code className="font-mono text-sm text-secondary-900 dark:text-white">{e.name}</code>
                    <Badge size="sm" variant="primary">{winner.toUpperCase()} +{Math.abs(e.b - e.a).toFixed(1)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-secondary-500 mb-1">{t('flags.variantA')}</div>
                      <div className="text-lg font-bold text-secondary-900 dark:text-white">{e.a}%</div>
                      <div className="text-xs text-secondary-500">{t('flags.conversion')}</div>
                    </div>
                    <div className={winner === 'b' ? 'rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 -mx-2' : ''}>
                      <div className="text-xs text-secondary-500 mb-1">{t('flags.variantB')}</div>
                      <div className="text-lg font-bold text-secondary-900 dark:text-white">{e.b}%</div>
                      <div className="text-xs text-secondary-500">{t('flags.conversion')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
