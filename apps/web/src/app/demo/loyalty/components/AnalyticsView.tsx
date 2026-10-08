'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowDownTrayIcon, LightBulbIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { ANALYTICS, REWARDS, TIERS, type Segment } from './data';
import { cedulaLabel, downloadText, programCost, segmentSize, tierCounts, toCsv } from './engine';
import { useSessionYearPoints } from './ConfigProgram';
import { txLabel } from './MemberView';
import { useLoyalty } from './store';
import { KpiBox, SampleTag, SectionTitle, TIER_THEME, useFmt, useToast } from './ui';

export default function AnalyticsView({ onCreateCampaign }: { onCreateCampaign: (s: Segment) => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state } = useLoyalty();
  const extra = useSessionYearPoints();
  const counts = tierCounts(state.rules.thresholds, extra);
  const total = TIERS.reduce((s, k) => s + counts[k], 0);

  // Movimientos de la sesión (lo que hiciste en la demo).
  const sessionTx = state.ledger.filter((tx) => tx.session);
  const issued = sessionTx.filter((tx) => tx.points > 0).reduce((s, tx) => s + tx.points, 0);
  const burned = sessionTx.filter((tx) => tx.points < 0).reduce((s, tx) => s - tx.points, 0);
  const outstanding = ANALYTICS.outstandingPoints + issued - burned;
  const liability = outstanding * state.rules.pointValue;
  const cost = programCost(ANALYTICS.monthlyMemberSales, state.rules, ANALYTICS.expiredPct);
  const lift = Math.round((ANALYTICS.ticketMember / ANALYTICS.ticketNonMember - 1) * 100);
  const activeSales = state.sales.filter((s) => !s.reversed);
  const newMembers = state.members.filter((m) => m.session).length;

  const exportCsv = () => {
    const sep = f.locale === 'en' ? ',' : ';';
    const running: Record<string, number> = {};
    const rows: (string | number)[][] = [
      [t('export.date'), t('export.time'), t('export.member'), t('export.cedula'), t('export.type'), t('export.detail'), t('export.points'), t('export.balance'), t('export.origin')],
    ];
    state.ledger.forEach((tx) => {
      running[tx.memberId] = (running[tx.memberId] ?? 0) + tx.points;
      const m = state.members.find((x) => x.id === tx.memberId);
      rows.push([
        tx.date,
        tx.time ?? '',
        m?.name ?? '',
        m ? cedulaLabel(m.cedula) : '',
        t(`export.kinds.${tx.kind}`),
        txLabel(t, tx, f.money, state.missions),
        tx.points,
        running[tx.memberId],
        tx.session ? t('export.fromDemo') : t('export.sample'),
      ]);
    });
    downloadText('club-ceiba-verde-movimientos.csv', toCsv(rows, sep));
    notify(t('export.done', { n: f.num(state.ledger.length) }));
  };

  const top = REWARDS.map((r) => {
    const sessionCount = sessionTx.filter((tx) => tx.kind === 'redeem' && tx.rewardId === r.id).length;
    const n = (ANALYTICS.topRewards[r.id] ?? 0) + sessionCount;
    return { r, n, sessionCount };
  })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  const segments: { key: Segment; color: string }[] = [
    { key: 'vip', color: 'from-purple-500 to-fuchsia-600' },
    { key: 'atRisk', color: 'from-orange-500 to-red-600' },
    { key: 'nearTier', color: 'from-emerald-500 to-teal-600' },
    { key: 'dormant', color: 'from-slate-500 to-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('analytics.title')}</h2>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('analytics.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} className="shrink-0 self-start">
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> {t('export.button')}
        </Button>
      </div>

      <Card>
        <SectionTitle icon={PresentationChartLineIcon} title={t('analytics.session.title')} subtitle={t('analytics.session.subtitle')} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <KpiBox label={t('analytics.session.sales')} value={f.num(activeSales.length)} sub={f.money(activeSales.reduce((s, x) => s + x.paid, 0))} />
          <KpiBox label={t('analytics.session.issued')} value={f.num(issued)} tone="success" />
          <KpiBox label={t('analytics.session.burned')} value={f.num(burned)} tone="danger" />
          <KpiBox label={t('analytics.session.members')} value={f.num(newMembers)} />
          <KpiBox label={t('analytics.session.alerts')} value={f.num(state.alerts.filter((a) => a.session).length)} tone="warning" />
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t('analytics.kpis.title')}</p>
          <SampleTag />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiBox label={t('analytics.kpis.members')} value={f.num(total)} sub={t('analytics.kpis.membersSub', { n: f.num(newMembers) })} />
          <KpiBox label={t('analytics.kpis.active')} value={f.num(ANALYTICS.active90)} sub={t('analytics.kpis.activeSub', { pct: Math.round((ANALYTICS.active90 / total) * 100) })} />
          <KpiBox label={t('analytics.kpis.redemption')} value={`${ANALYTICS.redemptionRate} %`} sub={t('analytics.kpis.redemptionSub')} />
          <KpiBox
            label={t('analytics.kpis.ticket')}
            value={f.money(ANALYTICS.ticketMember)}
            tone="success"
            sub={t('analytics.kpis.ticketSub', { other: f.money(ANALYTICS.ticketNonMember), pct: lift })}
          />
          <KpiBox label={t('analytics.kpis.expired')} value={`${ANALYTICS.expiredPct} %`} sub={t('analytics.kpis.expiredSub')} />
          <KpiBox label={t('analytics.kpis.liability')} value={f.moneyM(liability)} sub={t('analytics.kpis.liabilitySub', { pts: f.num(outstanding), value: f.money(state.rules.pointValue) })} />
        </div>
        <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
          {t('analytics.kpis.cost', { cost: f.moneyM(cost.net), sales: f.moneyM(ANALYTICS.monthlyMemberSales) })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CohortChart />
        <Card>
          <SectionTitle title={t('analytics.tiers.title')} subtitle={t('analytics.tiers.subtitle')} />
          <TierDonut counts={counts} total={total} />
        </Card>
      </div>

      <Card>
        <SectionTitle title={t('analytics.top.title')} subtitle={t('analytics.top.subtitle')} right={<SampleTag />} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-xs uppercase text-secondary-500 border-b border-secondary-200 dark:border-secondary-800">
                <th className="text-left py-2">{t('analytics.top.reward')}</th>
                <th className="text-right py-2">{t('analytics.top.redemptions')}</th>
                <th className="text-right py-2">{t('analytics.top.points')}</th>
                <th className="text-right py-2">{t('analytics.top.cost')}</th>
              </tr>
            </thead>
            <tbody>
              {top.map(({ r, n, sessionCount }) => (
                <tr key={r.id} className="border-b border-secondary-100 dark:border-secondary-800/50">
                  <td className="py-2 font-medium text-secondary-900 dark:text-white">
                    {t(`rewards.items.${r.id}.name`)}
                    {sessionCount > 0 && <span className="ml-2 text-xs text-primary-600">{t('analytics.top.yours', { n: sessionCount })}</span>}
                  </td>
                  <td className="py-2 text-right text-secondary-700 dark:text-secondary-300">{f.num(n)}</td>
                  <td className="py-2 text-right font-mono text-secondary-700 dark:text-secondary-300">{f.num(n * r.pts)}</td>
                  <td className="py-2 text-right font-mono text-secondary-700 dark:text-secondary-300">{f.money(n * r.pts * state.rules.pointValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={LightBulbIcon} title={t('analytics.segments.title')} subtitle={t('analytics.segments.subtitle')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {segments.map((s) => (
            <div key={s.key} className={`rounded-xl p-4 bg-gradient-to-br ${s.color} text-white flex flex-col`}>
              <p className="text-xs uppercase tracking-wider opacity-90">{t(`segments.${s.key}`)}</p>
              <p className="text-2xl font-bold mt-1">{f.num(segmentSize(s.key, state.rules.thresholds, extra))}</p>
              <p className="text-xs opacity-90 mt-1">{t(`analytics.segments.rules.${s.key}`)}</p>
              <p className="font-semibold mt-3 text-sm flex-1">{t(`analytics.segments.actions.${s.key}`)}</p>
              <Button size="sm" className="mt-3 bg-white text-secondary-900 hover:bg-white/90 self-start" onClick={() => onCreateCampaign(s.key)}>
                {t('analytics.segments.create')}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('analytics.segments.note')}</p>
      </Card>
    </div>
  );
}

function CohortChart() {
  const t = useTranslations('demoLoyalty');
  const colorFor = (v: number) => {
    if (v >= 80) return 'bg-primary-700 text-white';
    if (v >= 60) return 'bg-primary-500 text-white';
    if (v >= 40) return 'bg-primary-300 text-primary-900';
    return 'bg-primary-100 text-primary-900';
  };
  const cols = ANALYTICS.cohort[0].length;
  return (
    <Card>
      <SectionTitle title={t('analytics.cohort.title')} subtitle={t('analytics.cohort.subtitle')} right={<SampleTag />} />
      <div className="mt-4 overflow-x-auto">
        <table className="text-xs w-full min-w-[360px]">
          <thead>
            <tr>
              <th className="text-left text-secondary-500 font-medium pr-2">{t('analytics.cohort.month')}</th>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i} className="text-secondary-500 font-medium px-1">
                  {t('analytics.cohort.after', { n: i })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ANALYTICS.cohort.map((row, r) => (
              <tr key={r}>
                <td className="text-secondary-600 dark:text-secondary-400 pr-2 py-0.5 whitespace-nowrap">{t(`months.${ANALYTICS.cohortStartMonth + r}`)} 2026</td>
                {Array.from({ length: cols }, (_, c) => {
                  const v = row[c];
                  return (
                    <td key={c} className="p-0.5">
                      {v === undefined ? (
                        <div className="rounded text-center py-1.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-400">–</div>
                      ) : (
                        <div className={`rounded text-center py-1.5 font-medium ${colorFor(v)}`}>{v} %</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TierDonut({ counts, total }: { counts: Record<(typeof TIERS)[number], number>; total: number }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const circumference = 2 * Math.PI * 60;
  let offset = 0;
  return (
    <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90 shrink-0" role="img" aria-label={t('analytics.tiers.title')}>
        <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="20" className="text-secondary-100 dark:text-secondary-800" />
        {TIERS.map((k) => {
          const len = total > 0 ? (counts[k] / total) * circumference : 0;
          const seg = <circle key={k} cx="80" cy="80" r="60" fill="none" stroke={TIER_THEME[k].hex} strokeWidth="20" strokeDasharray={`${len} ${circumference - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return seg;
        })}
      </svg>
      <div className="flex-1 space-y-2 w-full">
        {TIERS.map((k) => (
          <div key={k} className="flex items-center gap-3 text-sm">
            <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: TIER_THEME[k].hex }} />
            <span className="flex-1 text-secondary-700 dark:text-secondary-300">{t(`tiers.${k}`)}</span>
            <span className="text-xs text-secondary-500">{f.num(counts[k])}</span>
            <span className="font-mono text-secondary-900 dark:text-white w-12 text-right">{total > 0 ? Math.round((counts[k] / total) * 100) : 0} %</span>
          </div>
        ))}
        <p className="pt-2 text-xs text-secondary-500 border-t border-secondary-100 dark:border-secondary-800">{t('analytics.tiers.total', { n: f.num(total) })}</p>
      </div>
    </div>
  );
}
