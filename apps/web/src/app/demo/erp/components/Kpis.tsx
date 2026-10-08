'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  ShoppingCartIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { INCOME_TAX_RATE } from '../lib/catalog';
import { balance, periodRange, pnl, receivables } from '../lib/engine';
import { useErp } from '../lib/store';
import type { ModuleId } from '../lib/types';
import { useFmt } from './ui';

type Tone = 'good' | 'bad' | 'neutral';

interface Kpi {
  key: string;
  value: string;
  full?: string;
  /** Variación: porcentaje (o puntos porcentuales si isPp). */
  delta: number | null;
  isPp?: boolean;
  /** true si un aumento es bueno, false si es malo, null si es neutro. */
  upIsGood: boolean | null;
  extra?: string;
  extraAlert?: boolean;
  icon: typeof ChartBarIcon;
  color: string;
  module: ModuleId;
}

export default function Kpis() {
  const t = useTranslations('demoErp.kpis');
  const tp = useTranslations('demoErp.periods');
  const { computed, state, filters, goTo } = useErp();
  const f = useFmt();

  const kpis = useMemo<Kpi[]>(() => {
    const r = periodRange(filters.period);
    const co = filters.company;
    const cur = pnl(computed.entries, co, r, INCOME_TAX_RATE);
    const prev = r.prev ? pnl(computed.entries, co, r.prev, INCOME_TAX_RATE) : null;
    const bal = (prefixes: string[], end: string) => balance(computed.entries, co, prefixes, null, end);
    const pct = (a: number, b: number | null) => (b === null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100);
    const margin = cur.revenue ? cur.gross / cur.revenue : 0;
    const prevMargin = prev && prev.revenue ? prev.gross / prev.revenue : null;
    const cash = bal(['11'], r.end);
    const ar = bal(['1305'], r.end);
    const ap = -bal(['2205'], r.end);
    const over60 = receivables(state, computed, co, r.end)
      .filter((x) => x.daysOverdue > 60)
      .reduce((s, x) => s + x.open, 0);
    return [
      { key: 'revenue', value: f.moneyShort(cur.revenue), full: f.money(cur.revenue), delta: prev ? pct(cur.revenue, prev.revenue) : null, upIsGood: true, icon: ShoppingCartIcon, color: 'from-green-500 to-emerald-600', module: 'sales' },
      { key: 'grossMargin', value: f.pct(margin), delta: prevMargin === null ? null : (margin - prevMargin) * 100, isPp: true, upIsGood: true, icon: ChartBarIcon, color: 'from-blue-500 to-indigo-600', module: 'accounting' },
      { key: 'ebitda', value: f.moneyShort(cur.ebitda), full: f.money(cur.ebitda), delta: prev ? pct(cur.ebitda, prev.ebitda) : null, upIsGood: true, icon: ScaleIcon, color: 'from-purple-500 to-violet-600', module: 'accounting' },
      { key: 'cash', value: f.moneyShort(cash), full: f.money(cash), delta: r.prev ? pct(cash, bal(['11'], r.prev.end)) : null, upIsGood: true, icon: WalletIcon, color: 'from-amber-500 to-orange-600', module: 'finance' },
      { key: 'ar', value: f.moneyShort(ar), full: f.money(ar), delta: r.prev ? pct(ar, bal(['1305'], r.prev.end)) : null, upIsGood: false, extra: t('arOverdue', { value: f.moneyShort(over60) }), extraAlert: over60 > 0, icon: BanknotesIcon, color: 'from-cyan-500 to-sky-600', module: 'finance' },
      { key: 'ap', value: f.moneyShort(ap), full: f.money(ap), delta: r.prev ? pct(ap, -bal(['2205'], r.prev.end)) : null, upIsGood: null, icon: ReceiptPercentIcon, color: 'from-rose-500 to-red-600', module: 'purchases' },
    ];
    // f cambia con idioma y moneda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed, state, filters.period, filters.company, filters.currency, f.locale, t]);

  const compareLabel = filters.period === 'ytd' ? t('ytdNote') : t('vs', { period: tp(`prev_${filters.period}`) });

  return (
    <section aria-label={t('aria')} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => {
        const up = (k.delta ?? 0) > 0;
        const flat = k.delta === null || Math.abs(k.delta) < 0.05;
        const tone: Tone = flat || k.upIsGood === null ? 'neutral' : up === k.upIsGood ? 'good' : 'bad';
        const toneCls = tone === 'good' ? 'text-green-600 dark:text-green-400' : tone === 'bad' ? 'text-red-600 dark:text-red-400' : 'text-secondary-500 dark:text-secondary-400';
        return (
          <button key={k.key} onClick={() => goTo(k.module, undefined, true)} className="text-left" title={k.full ? `${t(k.key)}: ${k.full}` : undefined}>
            <Card variant="bordered" padding="sm" className="h-full hover:shadow-medium hover:border-primary-300 dark:hover:border-primary-700 transition-all">
              <div className="flex items-start justify-between mb-2 gap-1">
                <div className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center shadow-sm`}>
                  <k.icon className="w-5 h-5 text-white" />
                </div>
                {k.delta !== null && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${toneCls}`} aria-label={t(up ? 'deltaUp' : 'deltaDown')}>
                    {!flat && (up ? <ArrowUpRightIcon className="w-3.5 h-3.5" /> : <ArrowDownRightIcon className="w-3.5 h-3.5" />)}
                    {flat ? `${f.dec(0, 1)}${k.isPp ? ' pp' : '%'}` : k.isPp ? `${up ? '+' : ''}${f.dec(k.delta!, 1)} pp` : `${up ? '+' : ''}${f.dec(k.delta!, 1)}%`}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-0.5">{t(k.key)}</p>
              <p className="text-lg font-bold text-secondary-900 dark:text-white truncate">{k.value}</p>
              {k.extra && <p className={`text-[10px] mt-0.5 truncate ${k.extraAlert ? 'text-red-600 dark:text-red-400' : 'text-secondary-500'}`}>{k.extra}</p>}
              <p className="text-[10px] text-secondary-500 mt-1 truncate">{compareLabel}</p>
            </Card>
          </button>
        );
      })}
    </section>
  );
}
