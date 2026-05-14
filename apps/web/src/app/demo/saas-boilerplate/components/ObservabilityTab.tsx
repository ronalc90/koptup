'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';

type ToneKey = 'red' | 'blue' | 'amber' | 'emerald';

const TONES: Record<ToneKey, { dot: string; bar: string }> = {
  red: { dot: 'bg-red-500', bar: 'bg-red-500/70' },
  blue: { dot: 'bg-blue-500', bar: 'bg-blue-500/70' },
  amber: { dot: 'bg-amber-500', bar: 'bg-amber-500/70' },
  emerald: { dot: 'bg-emerald-500', bar: 'bg-emerald-500/70' },
};

export default function ObservabilityTab() {
  const t = useTranslations('demoSaas');

  const cards: { key: 'sentry' | 'otel' | 'grafana' | 'status'; stat: string; value: string; tone: ToneKey }[] = [
    { key: 'sentry', stat: t('observability.errors'), value: '23', tone: 'red' },
    { key: 'otel', stat: 'spans/min', value: '12.4k', tone: 'blue' },
    { key: 'grafana', stat: t('observability.p95'), value: '184ms', tone: 'amber' },
    { key: 'status', stat: t('observability.uptime'), value: '99.98%', tone: 'emerald' },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('observability.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('observability.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((o) => {
          const tone = TONES[o.tone];
          return (
            <Card key={o.key} variant="bordered">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-secondary-900 dark:text-white">{t(`observability.${o.key}`)}</span>
                <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{t(`observability.${o.key}Desc`)}</p>
              <div className="flex items-end gap-1 h-12 mb-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = 20 + ((i * 17 + o.key.length * 7) % 60);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${tone.bar}`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-secondary-900 dark:text-white">{o.value}</span>
                <span className="text-xs text-secondary-500">{o.stat}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
