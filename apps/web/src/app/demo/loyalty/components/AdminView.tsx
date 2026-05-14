'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  TicketIcon,
  MegaphoneIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { KpiBox, TIER_THEME, type TierKey } from './shared';

type AdminTab = 'points' | 'tiers' | 'missions' | 'referrals' | 'cashback' | 'sweepstakes';

export default function AdminView() {
  const t = useTranslations('demoLoyalty');
  const [sub, setSub] = useState<AdminTab>('points');

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('admin.title')}</h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.subtitle')}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {(['points', 'tiers', 'missions', 'referrals', 'cashback', 'sweepstakes'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSub(k)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                sub === k
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              {t(`admin.tabs.${k}`)}
            </button>
          ))}
        </div>
      </Card>

      {sub === 'points' && <ProgramPoints />}
      {sub === 'tiers' && <ProgramTiers />}
      {sub === 'missions' && <ProgramMissions />}
      {sub === 'referrals' && <ProgramReferrals />}
      {sub === 'cashback' && <ProgramCashback />}
      {sub === 'sweepstakes' && <ProgramSweepstakes />}

      <Campaigns />
      <Coalitions />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Fraud />
        <Experiments />
      </div>
    </div>
  );
}

function ProgramPoints() {
  const t = useTranslations('demoLoyalty');
  const [base, setBase] = useState(1);
  const [cats, setCats] = useState({ groceries: 2, fashion: 1.5, electronics: 1, travel: 3, dining: 2 });
  const [chans, setChans] = useState({ web: 1, app: 1.5, pos: 1, marketplace: 1.25 });

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.points.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.points.subtitle')}</p>

      <div className="mt-5 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center gap-4">
        <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-900 dark:text-white">{t('admin.programs.points.baseRate')}</p>
          <p className="text-xs text-secondary-500">{t('admin.programs.points.baseHelp')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setBase((b) => Math.max(0.5, b - 0.5))} className="p-1 rounded bg-white dark:bg-secondary-900 border">
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="font-mono font-bold w-12 text-center text-secondary-900 dark:text-white">{base}x</span>
          <button onClick={() => setBase((b) => b + 0.5)} className="p-1 rounded bg-white dark:bg-secondary-900 border">
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <div>
          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('admin.programs.points.multipliers')}</p>
          <div className="space-y-2">
            {(Object.keys(cats) as Array<keyof typeof cats>).map((k) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs text-secondary-600 dark:text-secondary-300 w-28">{t(`admin.programs.points.categories.${k}`)}</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  value={cats[k]}
                  onChange={(e) => setCats({ ...cats, [k]: parseFloat(e.target.value) })}
                  className="flex-1 accent-primary-600"
                />
                <span className="text-xs font-mono w-10 text-right text-secondary-900 dark:text-white">{cats[k]}x</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('admin.programs.points.channels')}</p>
          <div className="space-y-2">
            {(Object.keys(chans) as Array<keyof typeof chans>).map((k) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs text-secondary-600 dark:text-secondary-300 w-28">{t(`admin.programs.points.channelList.${k}`)}</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.25}
                  value={chans[k]}
                  onChange={(e) => setChans({ ...chans, [k]: parseFloat(e.target.value) })}
                  className="flex-1 accent-primary-600"
                />
                <span className="text-xs font-mono w-10 text-right text-secondary-900 dark:text-white">{chans[k]}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProgramTiers() {
  const t = useTranslations('demoLoyalty');
  const tiers: { key: TierKey; threshold: number; members: number }[] = [
    { key: 'bronze', threshold: 0, members: 18420 },
    { key: 'silver', threshold: 5000, members: 7320 },
    { key: 'gold', threshold: 15000, members: 2840 },
    { key: 'platinum', threshold: 40000, members: 620 },
  ];
  const [downgradeMonths, setDowngradeMonths] = useState(6);
  const [thresholds, setThresholds] = useState(tiers.map((tt) => tt.threshold));

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.tiers.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.tiers.subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {tiers.map((tt, idx) => {
          const theme = TIER_THEME[tt.key];
          return (
            <div key={tt.key} className={`rounded-lg p-4 bg-gradient-to-br ${theme.from} ${theme.to} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{t(`member.tier.${tt.key}`)}</span>
                <Badge className="bg-white/20 text-white border-0" size="sm">
                  {t('admin.programs.tiers.membersIn', { count: tt.members.toLocaleString() })}
                </Badge>
              </div>
              <p className="text-xs opacity-90 mb-2">
                {t('admin.programs.tiers.upgradeAt', { tier: t(`member.tier.${tt.key}`) })}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={thresholds[idx]}
                  onChange={(e) => {
                    const next = [...thresholds];
                    next[idx] = parseInt(e.target.value, 10);
                    setThresholds(next);
                  }}
                  className="flex-1 accent-white"
                />
                <span className="font-mono text-xs w-16 text-right">{thresholds[idx].toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center gap-3">
        <ArrowTrendingDownIcon className="h-5 w-5 text-secondary-500" />
        <span className="text-sm text-secondary-700 dark:text-secondary-300 flex-1">
          {t('admin.programs.tiers.downgradeAfter', { months: downgradeMonths })}
        </span>
        <input
          type="range"
          min={3}
          max={24}
          value={downgradeMonths}
          onChange={(e) => setDowngradeMonths(parseInt(e.target.value, 10))}
          className="w-32 accent-primary-600"
        />
      </div>
    </Card>
  );
}

function ProgramMissions() {
  const t = useTranslations('demoLoyalty');
  const items = [
    { title: 'Double Weekend', running: 3420, completion: 68, uplift: 12 },
    { title: 'Refer 3 Friends', running: 1240, completion: 41, uplift: 18 },
    { title: 'App-only Quest', running: 890, completion: 79, uplift: 9 },
  ];
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.missions.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.missions.subtitle')}</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-secondary-900 dark:text-white text-sm">{it.title}</span>
              <Badge variant="success" size="sm">{t('admin.programs.missions.running')}</Badge>
            </div>
            <div className="text-xs text-secondary-500 mt-2">{t('admin.programs.missions.completion')}: <b className="text-secondary-900 dark:text-white">{it.completion}%</b></div>
            <div className="text-xs text-secondary-500">{t('admin.programs.missions.uplift')}: <b className="text-green-600">+{it.uplift}%</b></div>
            <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-primary-500" style={{ width: `${it.completion}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProgramReferrals() {
  const t = useTranslations('demoLoyalty');
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.referrals.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.referrals.subtitle')}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <KpiBox label={t('admin.programs.referrals.rewardReferrer')} value="500 pts" />
        <KpiBox label={t('admin.programs.referrals.rewardReferee')} value="300 pts" />
        <KpiBox label={t('admin.programs.referrals.totalReferrals')} value="4,218" />
        <KpiBox label={t('admin.programs.referrals.conversion')} value="34%" tone="success" />
      </div>
    </Card>
  );
}

function ProgramCashback() {
  const t = useTranslations('demoLoyalty');
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.cashback.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.cashback.subtitle')}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <KpiBox label={t('admin.programs.cashback.rate')} value="2.4%" />
        <KpiBox label={t('admin.programs.cashback.redeemed')} value="$48,210" tone="success" />
        <KpiBox label={t('admin.programs.cashback.segments')} value="6" />
      </div>
    </Card>
  );
}

function ProgramSweepstakes() {
  const t = useTranslations('demoLoyalty');
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white">{t('admin.programs.sweepstakes.title')}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.programs.sweepstakes.subtitle')}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <KpiBox label={t('admin.programs.sweepstakes.activeDraws')} value="4" icon={TicketIcon} />
        <KpiBox label={t('admin.programs.sweepstakes.tickets')} value="12,840" />
        <KpiBox label={t('admin.programs.sweepstakes.winners')} value="18" tone="success" />
      </div>
    </Card>
  );
}

function Campaigns() {
  const t = useTranslations('demoLoyalty');
  const channels = ['web', 'app', 'pos', 'email', 'whatsapp'] as const;
  const items = [
    { id: 'doublePoints', audience: '125k', scheduled: 'Sat 18:00', on: ['web', 'app', 'email'] },
    { id: 'winback', audience: '38k', scheduled: 'Mon 09:00', on: ['email', 'whatsapp'] },
    { id: 'vipDay', audience: '2.6k', scheduled: 'Fri 10:00', on: ['app', 'email', 'whatsapp'] },
    { id: 'birthday', audience: 'auto', scheduled: 'daily', on: ['app', 'email', 'whatsapp', 'pos'] },
  ] as const;

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <MegaphoneIcon className="h-5 w-5" /> {t('admin.campaigns.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.campaigns.subtitle')}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-secondary-500 border-b border-secondary-200 dark:border-secondary-800">
              <th className="text-left py-2">Campaign</th>
              <th className="text-left py-2">{t('admin.campaigns.audience')}</th>
              <th className="text-left py-2">{t('admin.campaigns.scheduled')}</th>
              <th className="text-left py-2">Channels</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-secondary-100 dark:border-secondary-800/50">
                <td className="py-3 font-medium text-secondary-900 dark:text-white">{t(`admin.campaigns.items.${it.id}`)}</td>
                <td className="py-3 text-secondary-600 dark:text-secondary-300">{it.audience}</td>
                <td className="py-3 text-secondary-600 dark:text-secondary-300">{it.scheduled}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {channels.map((c) => {
                      const enabled = (it.on as readonly string[]).includes(c);
                      return (
                        <span
                          key={c}
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            enabled
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                              : 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800'
                          }`}
                        >
                          {t(`admin.campaigns.channels.${c}`)}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Coalitions() {
  const t = useTranslations('demoLoyalty');
  const partners = ['Starbucks', 'Avianca', 'Falabella', 'Rappi', 'Movistar'];
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="h-5 w-5" /> {t('admin.coalitions.title')}
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.coalitions.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline">
          <PlusIcon className="h-4 w-4 mr-1" />
          {t('admin.coalitions.addPartner')}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {partners.map((p) => (
          <div key={p} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-3 text-center">
            <div className="h-10 mx-auto mb-2 rounded bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm">
              {p[0]}
            </div>
            <p className="text-xs font-medium text-secondary-700 dark:text-secondary-200">{p}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/60 dark:to-purple-950/60">
        <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('admin.coalitions.sharedPool')}</p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-white">8.4M pts</p>
      </div>
    </Card>
  );
}

function Fraud() {
  const t = useTranslations('demoLoyalty');
  const alerts = [
    { id: 'farming', sev: 'high' as const },
    { id: 'multiAccount', sev: 'high' as const },
    { id: 'fakeReferral', sev: 'medium' as const },
    { id: 'abnormalRedeem', sev: 'low' as const },
  ];
  const sevVariant = { high: 'danger', medium: 'warning', low: 'info' } as const;
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5" /> {t('admin.fraud.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.fraud.subtitle')}</p>
      <div className="mt-4 space-y-2">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-900 dark:text-white">{t(`admin.fraud.alerts.${a.id}`)}</p>
            </div>
            <Badge variant={sevVariant[a.sev]} size="sm">{t(`admin.fraud.severity.${a.sev}`)}</Badge>
            <Button size="sm" variant="outline">{t('admin.fraud.review')}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Experiments() {
  const t = useTranslations('demoLoyalty');
  const items = [
    { id: 'tripleMultiplier', uplift: 14 },
    { id: 'tierFastTrack', uplift: 9 },
    { id: 'missionLayout', uplift: -2 },
  ];
  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <BeakerIcon className="h-5 w-5" /> {t('admin.experiments.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('admin.experiments.subtitle')}</p>
      <div className="mt-4 space-y-2">
        {items.map((it) => {
          const positive = it.uplift >= 0;
          return (
            <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800">
              <Badge variant="info" size="sm">{t('admin.experiments.running')}</Badge>
              <p className="flex-1 text-sm font-medium text-secondary-900 dark:text-white">{t(`admin.experiments.items.${it.id}`)}</p>
              <span className={`text-sm font-bold flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
                {positive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                {positive ? '+' : ''}
                {it.uplift}%
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
