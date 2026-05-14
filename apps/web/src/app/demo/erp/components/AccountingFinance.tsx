'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { formatMoney, SectionHeader, CountryBadge } from './shared';

export function AccountingModule({
  openDetail,
  currencyCode,
}: {
  openDetail: (ref: string) => void;
  currencyCode: string;
}) {
  const t = useTranslations('demoErp.accounting');
  const entries = [
    { id: 'AS-1042', date: '2026-05-12', account: '1110 - Bancos', desc: 'Cobro cliente Acme', debit: 45000, credit: 0, country: 'CO' },
    { id: 'AS-1042', date: '2026-05-12', account: '1305 - Clientes', desc: 'Cobro cliente Acme', debit: 0, credit: 45000, country: 'CO' },
    { id: 'AS-1043', date: '2026-05-13', account: '5105 - Gastos personal', desc: 'Nómina quincenal', debit: 28500, credit: 0, country: 'MX' },
    { id: 'AS-1043', date: '2026-05-13', account: '2370 - Retenciones', desc: 'Nómina quincenal', debit: 0, credit: 3400, country: 'MX' },
    { id: 'AS-1043', date: '2026-05-13', account: '1110 - Bancos', desc: 'Nómina quincenal', debit: 0, credit: 25100, country: 'MX' },
    { id: 'AS-1044', date: '2026-05-14', account: '4135 - Ventas', desc: 'Factura FE-9821', debit: 0, credit: 18900, country: 'AR' },
    { id: 'AS-1044', date: '2026-05-14', account: '1305 - Clientes', desc: 'Factura FE-9821', debit: 18900, credit: 0, country: 'AR' },
  ];
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-3 font-semibold">{t('tableDate')}</th>
                <th className="py-2 pr-3 font-semibold">{t('tableEntry')}</th>
                <th className="py-2 pr-3 font-semibold">{t('tableAccount')}</th>
                <th className="py-2 pr-3 font-semibold">{t('tableDescription')}</th>
                <th className="py-2 pr-3 font-semibold text-right">{t('tableDebit')}</th>
                <th className="py-2 pl-3 font-semibold text-right">{t('tableCredit')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={`${e.id}-${i}`}
                  onClick={() => openDetail(e.id)}
                  className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 pr-3 text-secondary-700 dark:text-secondary-300 whitespace-nowrap">{e.date}</td>
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-xs text-primary-600 dark:text-primary-400">{e.id}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-secondary-700 dark:text-secondary-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CountryBadge code={e.country} />
                      {e.account}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-secondary-600 dark:text-secondary-400">{e.desc}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white font-medium">
                    {e.debit ? formatMoney(e.debit, currencyCode) : '—'}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-secondary-900 dark:text-white font-medium">
                    {e.credit ? formatMoney(e.credit, currencyCode) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-secondary-50 dark:bg-secondary-800/50">
                <td colSpan={4} className="py-2.5 pr-3 text-right text-secondary-700 dark:text-secondary-300">
                  {t('totals')}
                </td>
                <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white">{formatMoney(totalDebit, currencyCode)}</td>
                <td className="py-2.5 pl-3 text-right text-secondary-900 dark:text-white">{formatMoney(totalCredit, currencyCode)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-4">
        <Card variant="bordered" padding="md">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-3">{t('plTitle')}</h3>
          <PlRow label={t('plRevenue')} value={2_845_000} cc={currencyCode} />
          <PlRow label={t('plCogs')} value={-1_650_000} cc={currencyCode} />
          <PlRow label={t('plGross')} value={1_195_000} cc={currencyCode} bold />
          <PlRow label={t('plOpex')} value={-583_000} cc={currencyCode} />
          <PlRow label={t('plEbitda')} value={612_000} cc={currencyCode} bold highlight />
          <PlRow label={t('plTax')} value={-184_000} cc={currencyCode} />
          <PlRow label={t('plNet')} value={428_000} cc={currencyCode} bold highlight />
        </Card>

        <Card variant="bordered" padding="md">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-3">{t('balanceTitle')}</h3>
          <div className="space-y-2 text-sm">
            <BalanceBar label={t('assets')} value={4_820_000} pct={100} cc={currencyCode} color="bg-blue-500" />
            <BalanceBar label={t('liabilities')} value={2_180_000} pct={45} cc={currencyCode} color="bg-rose-500" />
            <BalanceBar label={t('equity')} value={2_640_000} pct={55} cc={currencyCode} color="bg-emerald-500" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PlRow({ label, value, cc, bold, highlight }: { label: string; value: number; cc: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div
      className={`flex justify-between py-1.5 text-sm ${
        bold ? 'border-t border-secondary-200 dark:border-secondary-700 font-bold' : ''
      } ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-700 dark:text-secondary-300'}`}
    >
      <span>{label}</span>
      <span>{formatMoney(value, cc)}</span>
    </div>
  );
}

function BalanceBar({ label, value, pct, cc, color }: { label: string; value: number; pct: number; cc: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-secondary-700 dark:text-secondary-300">{label}</span>
        <span className="font-semibold text-secondary-900 dark:text-white">{formatMoney(value, cc)}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FinanceModule({ currencyCode }: { currencyCode: string }) {
  const t = useTranslations('demoErp.finance');
  const months = [
    { m: 'Dic', in: 380, out: 290 },
    { m: 'Ene', in: 420, out: 310 },
    { m: 'Feb', in: 460, out: 340 },
    { m: 'Mar', in: 520, out: 380 },
    { m: 'Abr', in: 540, out: 410 },
    { m: 'May', in: 615, out: 430 },
  ];
  const maxVal = Math.max(...months.flatMap((x) => [x.in, x.out]));

  const arBuckets = [
    { k: 'bucketCurrent', v: 540, color: 'bg-emerald-500' },
    { k: 'bucket30', v: 245, color: 'bg-blue-500' },
    { k: 'bucket60', v: 120, color: 'bg-yellow-500' },
    { k: 'bucket90', v: 52, color: 'bg-orange-500' },
    { k: 'bucket90plus', v: 25, color: 'bg-red-500' },
  ];
  const apBuckets = [
    { k: 'bucketCurrent', v: 380, color: 'bg-emerald-500' },
    { k: 'bucket30', v: 210, color: 'bg-blue-500' },
    { k: 'bucket60', v: 95, color: 'bg-yellow-500' },
    { k: 'bucket90', v: 48, color: 'bg-orange-500' },
    { k: 'bucket90plus', v: 21, color: 'bg-red-500' },
  ];
  const totalAr = arBuckets.reduce((s, b) => s + b.v, 0);
  const totalAp = apBuckets.reduce((s, b) => s + b.v, 0);

  const matches = [
    { bank: 'WIRE 2026-05-12 Acme Corp', ledger: 'AS-1042 · Acme S.A.', amount: 45000, conf: 98, status: 'matched' as const },
    { bank: 'ACH 2026-05-13 GlobalTech', ledger: 'AS-1037 · GlobalTech LLC', amount: 18250, conf: 95, status: 'matched' as const },
    { bank: 'TRSF 2026-05-14 N3K-882', ledger: 'AS-1051 · Pendiente', amount: 9420, conf: 71, status: 'review' as const },
    { bank: 'WIRE 2026-05-14 LATAM SAS', ledger: 'AS-1052 · LATAM SAS', amount: 32100, conf: 99, status: 'matched' as const },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <SectionHeader title={t('cashFlowTitle')} subtitle={t('cashFlowSubtitle')} />
        <div className="flex items-end gap-2 sm:gap-4 h-48 mt-4">
          {months.map((m) => (
            <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center items-end gap-1 h-40">
                <div className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-700" style={{ height: `${(m.in / maxVal) * 100}%` }} />
                <div className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t transition-all duration-700" style={{ height: `${(m.out / maxVal) * 100}%` }} />
              </div>
              <span className="text-xs text-secondary-600 dark:text-secondary-400">{m.m}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-secondary-700 dark:text-secondary-300">{t('inflows')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-secondary-700 dark:text-secondary-300">{t('outflows')}</span>
          </span>
          <span className="ml-auto font-semibold text-emerald-600 dark:text-emerald-400">
            {t('net')}: {formatMoney(185_000, currencyCode)}
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        <AgingCard title={t('arAging')} buckets={arBuckets} total={totalAr} cc={currencyCode} />
        <AgingCard title={t('apAging')} buckets={apBuckets} total={totalAp} cc={currencyCode} />
      </div>

      <Card variant="bordered" padding="md" className="lg:col-span-3">
        <SectionHeader title={t('reconciliation')} subtitle={t('reconciliationSubtitle')} />
        <div className="space-y-2">
          {matches.map((m, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-400 transition-colors">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">{t('bankMovement')}</p>
                  <p className="font-mono text-xs text-secondary-700 dark:text-secondary-300">{m.bank}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">{t('ledgerEntry')}</p>
                  <p className="text-xs text-secondary-700 dark:text-secondary-300">{m.ledger}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-secondary-900 dark:text-white text-sm">{formatMoney(m.amount, currencyCode)}</span>
                <Badge variant={m.status === 'matched' ? 'success' : 'warning'} className="gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  {m.status === 'matched' ? t('matched') : t('review')} · {m.conf}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AgingCard({ title, buckets, total, cc }: { title: string; buckets: { k: string; v: number; color: string }[]; total: number; cc: string }) {
  const t = useTranslations('demoErp.finance');
  return (
    <Card variant="bordered" padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-secondary-900 dark:text-white">{title}</h3>
        <span className="text-sm font-semibold text-secondary-900 dark:text-white">{formatMoney(total * 1000, cc)}</span>
      </div>
      <div className="space-y-2">
        {buckets.map((b) => (
          <div key={b.k}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-secondary-600 dark:text-secondary-400">{t(b.k as any)}</span>
              <span className="font-semibold text-secondary-900 dark:text-white">{formatMoney(b.v * 1000, cc)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
              <div className={`h-full ${b.color} transition-all duration-700`} style={{ width: `${(b.v / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
