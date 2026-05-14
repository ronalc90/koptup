'use client';

import { useTranslations } from 'next-intl';

const CHARTS = ['burndown', 'velocity', 'cumulative', 'control', 'leadTime'] as const;

export default function AnalyticsTab() {
  const t = useTranslations('demoProjectsPro.reports');

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">{t('subtitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHARTS.map((c, idx) => (
          <div
            key={c}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t(c)}</p>
            <svg viewBox="0 0 200 80" className="w-full h-20">
              {idx === 0 && (
                <path d="M0 10 L40 25 L80 40 L120 55 L160 65 L200 75" stroke="#0d9488" strokeWidth="2" fill="none" />
              )}
              {idx === 1 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <rect
                    key={i}
                    x={i * 33 + 4}
                    y={80 - (30 + (i * 7) % 35)}
                    width="24"
                    height={30 + (i * 7) % 35}
                    fill="#0891b2"
                    rx="2"
                  />
                ))}
              {idx === 2 && (
                <>
                  <path d="M0 80 L0 60 L40 55 L80 45 L120 30 L160 22 L200 15 L200 80 Z" fill="#14b8a6" opacity="0.7" />
                  <path d="M0 80 L0 70 L40 67 L80 60 L120 50 L160 45 L200 38 L200 80 Z" fill="#06b6d4" opacity="0.6" />
                </>
              )}
              {idx === 3 && (
                <>
                  <line x1="0" y1="40" x2="200" y2="40" stroke="#94a3b8" strokeDasharray="3 3" />
                  {[5, 25, 50, 75, 100, 125, 150, 175].map((x, i) => (
                    <circle key={i} cx={x} cy={40 + Math.sin(i) * 18} r="3" fill="#0d9488" />
                  ))}
                </>
              )}
              {idx === 4 &&
                Array.from({ length: 8 }).map((_, i) => {
                  const h = 12 + ((i * 13) % 50);
                  return <rect key={i} x={i * 24 + 4} y={80 - h} width="20" height={h} fill="#22d3ee" rx="2" />;
                })}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
