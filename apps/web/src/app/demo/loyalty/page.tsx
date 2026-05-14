'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  SparklesIcon,
  TrophyIcon,
  GiftIcon,
  FireIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CakeIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  CreditCardIcon,
  StarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import AdminView from './components/AdminView';
import AnalyticsView from './components/AnalyticsView';
import { TIER_THEME, type TierKey } from './components/shared';

type MainTab = 'member' | 'admin' | 'analytics';

export default function LoyaltyDemoPage() {
  const t = useTranslations('demoLoyalty');
  const [tab, setTab] = useState<MainTab>('member');

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-6 md:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur text-white">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
          </div>
          <p className="text-lg text-amber-50/90 max-w-3xl">{t('pageSubtitle')}</p>
        </header>

        <nav className="flex gap-2 mb-6 border-b border-secondary-200 dark:border-secondary-800 overflow-x-auto">
          {(['member', 'admin', 'analytics'] as const).map((k) => {
            const Icon = k === 'member' ? UserGroupIcon : k === 'admin' ? Cog6ToothIcon : ChartBarIcon;
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                    : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(`tabs.${k}`)}
              </button>
            );
          })}
        </nav>

        {tab === 'member' && <MemberView />}
        {tab === 'admin' && <AdminView />}
        {tab === 'analytics' && <AnalyticsView />}
      </div>
    </div>
  );
}

/* ----------------------------- MEMBER VIEW ----------------------------- */
function MemberView() {
  const t = useTranslations('demoLoyalty');
  const tier: TierKey = 'gold';
  const nextTier: TierKey = 'platinum';
  const points = 12480;
  const expiringSoon = 320;
  const tierProgress = 72;
  const pointsToNext = 1820;
  const theme = TIER_THEME[tier];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card padding="none" className={`overflow-hidden bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-xl`}>
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className={`text-sm uppercase tracking-wider ${theme.text}`}>{t('member.greeting')}</p>
                <p className="text-xs opacity-80 mt-1">{t('member.memberSince')}</p>
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur" size="lg">
                <TrophyIcon className="h-4 w-4 mr-1" /> {t(`member.tier.${tier}`)}
              </Badge>
            </div>
            <div className="mb-6">
              <p className={`text-sm ${theme.text}`}>{t('member.pointsLabel')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-5xl md:text-6xl font-bold tracking-tight">{points.toLocaleString()}</p>
                <p className="text-lg opacity-80">{t('common.points')}</p>
              </div>
              <p className="text-xs opacity-80 mt-2 flex items-center gap-1">
                <FireIcon className="h-4 w-4" /> {t('member.expiringSoon', { count: expiringSoon })}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className={theme.text}>{t('member.tier.progressTo', { points: pointsToNext, tier: t(`member.tier.${nextTier}`) })}</span>
                <span className="font-semibold">{tierProgress}%</span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${tierProgress}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs opacity-80">
                <span>{t(`member.tier.${tier}`)}</span>
                <span>{t(`member.tier.${nextTier}`)}</span>
              </div>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur px-6 md:px-8 py-4 grid grid-cols-3 gap-2">
            {(['freeShipping', 'doublePoints', 'earlyAccess'] as const).map((p) => (
              <div key={p} className="flex items-center gap-2 text-xs">
                <CheckBadgeIcon className="h-4 w-4 shrink-0" />
                <span>{t(`member.tier.perksList.${p}`)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="p-5 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur">
              <CakeIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{t('member.birthday.title')}</p>
              <p className="text-sm opacity-90">{t('member.birthday.subtitle')}</p>
            </div>
            <Button size="sm" className="bg-white text-rose-600 hover:bg-white/90">
              <GiftIcon className="h-4 w-4 mr-1" /> {t('member.birthday.cta')}
            </Button>
          </div>
        </Card>

        <RewardsCatalog points={points} />
        <Missions />
      </div>

      <div className="space-y-6">
        <WalletPass tier={tier} />
        <Referrals />
        <StreakCard />
        <Leaderboard />
      </div>
    </div>
  );
}

function WalletPass({ tier }: { tier: TierKey }) {
  const t = useTranslations('demoLoyalty');
  const [flipped, setFlipped] = useState(false);
  const theme = TIER_THEME[tier];

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <CreditCardIcon className="h-5 w-5" /> {t('member.wallet.title')}
      </h3>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('member.wallet.subtitle')}</p>

      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label={t('member.wallet.tapToFlip')}
        className={`mt-4 w-full aspect-[2/3] rounded-2xl bg-gradient-to-br ${theme.from} ${theme.to} text-white p-5 shadow-2xl ring-2 ${theme.ring} flex flex-col justify-between text-left transition-transform hover:scale-[1.02]`}
      >
        {!flipped ? (
          <>
            <div className="flex items-start justify-between">
              <SparklesIcon className="h-7 w-7" />
              <span className="text-xs uppercase tracking-widest opacity-80">KopTup</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Ronald Gutiérrez</p>
              <p className="text-lg font-bold mt-1">{t(`member.tier.${tier}`)} Member</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider opacity-80">{t('member.wallet.memberCode')}</p>
            <div className="space-y-3">
              <div className="bg-white rounded p-2">
                <div className="flex gap-px h-10">
                  {Array.from({ length: 38 }).map((_, i) => (
                    <div key={i} className="bg-secondary-900" style={{ width: `${(i % 3) + 1}px` }} />
                  ))}
                </div>
              </div>
              <p className="font-mono text-sm tracking-widest text-center">LYL-4829-2025</p>
            </div>
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button size="sm" variant="outline" className="text-xs">
          <DevicePhoneMobileIcon className="h-4 w-4 mr-1" /> Apple
        </Button>
        <Button size="sm" variant="outline" className="text-xs">
          <DevicePhoneMobileIcon className="h-4 w-4 mr-1" /> Google
        </Button>
      </div>
    </Card>
  );
}

function RewardsCatalog({ points }: { points: number }) {
  const t = useTranslations('demoLoyalty');
  const [category, setCategory] = useState<'all' | 'giftcards' | 'experiences' | 'products' | 'donations'>('all');
  const [redeemed, setRedeemed] = useState<Record<string, boolean>>({});

  const items = useMemo(
    () => [
      { id: 'starbucks', cat: 'giftcards', pts: 1500, partner: 'Starbucks', color: 'from-green-600 to-emerald-800' },
      { id: 'amazon', cat: 'giftcards', pts: 3000, partner: 'Amazon', color: 'from-orange-500 to-orange-700' },
      { id: 'netflix', cat: 'giftcards', pts: 2200, partner: 'Netflix', color: 'from-red-600 to-red-900' },
      { id: 'spotify', cat: 'giftcards', pts: 1800, partner: 'Spotify', color: 'from-emerald-500 to-green-700' },
      { id: 'uber', cat: 'giftcards', pts: 2400, partner: 'Uber', color: 'from-slate-700 to-slate-900' },
      { id: 'concert', cat: 'experiences', pts: 8500, partner: 'LiveNation', color: 'from-purple-600 to-fuchsia-700', stockLow: true },
      { id: 'spa', cat: 'experiences', pts: 6000, partner: 'Spa Lux', color: 'from-rose-400 to-pink-600' },
      { id: 'donation', cat: 'donations', pts: 500, partner: 'UNICEF', color: 'from-sky-500 to-blue-700' },
    ],
    []
  );

  const filtered = items.filter((i) => category === 'all' || i.cat === category);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <GiftIcon className="h-5 w-5" /> {t('member.rewards.title')}
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('member.rewards.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'giftcards', 'experiences', 'products', 'donations'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              category === c
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            }`}
          >
            {t(`member.rewards.categories.${c}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((it) => {
          const enough = points >= it.pts;
          const isRedeemed = redeemed[it.id];
          return (
            <div
              key={it.id}
              className="rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 flex flex-col"
            >
              <div className={`bg-gradient-to-br ${it.color} h-20 flex items-center justify-center text-white font-bold text-lg`}>
                {it.partner}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-xs font-medium text-secondary-700 dark:text-secondary-200">
                  {t(`member.rewards.items.${it.id}`)}
                </p>
                <p className="text-sm font-bold text-secondary-900 dark:text-white mt-1">
                  {it.pts.toLocaleString()} {t('common.pts')}
                </p>
                {it.stockLow && (
                  <Badge variant="warning" size="sm" className="mt-2 self-start">
                    {t('member.rewards.stockLow')}
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="mt-3 text-xs"
                  variant={isRedeemed ? 'outline' : 'primary'}
                  disabled={!enough || isRedeemed}
                  onClick={() => setRedeemed((r) => ({ ...r, [it.id]: true }))}
                >
                  {isRedeemed
                    ? t('member.rewards.redeemed')
                    : enough
                    ? t('common.redeem')
                    : t('member.rewards.insufficientPoints')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Missions() {
  const t = useTranslations('demoLoyalty');
  const missions = [
    { id: 'buy3', current: 2, total: 3, icon: ShoppingBagIcon, color: 'bg-blue-500' },
    { id: 'review', current: 1, total: 2, icon: StarIcon, color: 'bg-yellow-500' },
    { id: 'refer', current: 0, total: 1, icon: UserGroupIcon, color: 'bg-purple-500' },
    { id: 'app', current: 1, total: 1, icon: DevicePhoneMobileIcon, color: 'bg-green-500' },
  ] as const;

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <BoltIcon className="h-5 w-5" /> {t('member.missions.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('member.missions.subtitle')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {missions.map((m) => {
          const pct = (m.current / m.total) * 100;
          const done = m.current >= m.total;
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${m.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    {t(`member.missions.items.${m.id}.title`)}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                    {t(`member.missions.items.${m.id}.reward`)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                <div className={`h-full ${done ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-secondary-500 dark:text-secondary-400">
                  {t('member.missions.progress', { current: m.current, total: m.total })}
                </span>
                {done && (
                  <button className="text-primary-600 dark:text-primary-400 font-medium">
                    {t('member.missions.claim')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Referrals() {
  const t = useTranslations('demoLoyalty');
  const [copied, setCopied] = useState(false);
  const link = 'koptup.com/r/ronald-x9k';

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <LinkIcon className="h-5 w-5" /> {t('member.referrals.title')}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('member.referrals.subtitle')}</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-center">
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">7</p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('member.referrals.friendsInvited')}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950 text-center">
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">3,500</p>
          <p className="text-xs text-primary-600 dark:text-primary-400">{t('member.referrals.pointsEarned')}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{t('member.referrals.yourLink')}</p>
        <div className="flex gap-2">
          <Input value={link} readOnly className="flex-1 text-xs font-mono" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <ClipboardDocumentCheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-3 mb-1">{t('member.referrals.channels')}</p>
      <div className="flex gap-2">
        {[ChatBubbleLeftRightIcon, EnvelopeIcon, GlobeAltIcon].map((Icon, i) => (
          <button
            key={i}
            className="flex-1 p-2 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-800 flex justify-center"
          >
            <Icon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function StreakCard() {
  const t = useTranslations('demoLoyalty');
  const days = 14;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <div className="flex items-center gap-3">
          <FireIcon className="h-10 w-10" />
          <div>
            <p className="text-3xl font-bold">{t('member.streak.days', { days })}</p>
            <p className="text-sm opacity-90">{t('member.streak.title')}</p>
          </div>
        </div>
        <p className="text-xs opacity-90 mt-3">{t('member.streak.subtitle')}</p>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full bg-white/80" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function Leaderboard() {
  const t = useTranslations('demoLoyalty');
  const rows = [
    { rank: 1, name: 'María L.', pts: 28400, you: false },
    { rank: 2, name: 'Carlos P.', pts: 25100, you: false },
    { rank: 3, name: 'Sofía R.', pts: 21900, you: false },
    { rank: 4, name: 'Andrés M.', pts: 18700, you: false },
    { rank: 5, name: 'Ronald', pts: 12480, you: true },
    { rank: 6, name: 'Luisa K.', pts: 11800, you: false },
    { rank: 7, name: 'Diego F.', pts: 10500, you: false },
  ];

  return (
    <Card>
      <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
        <TrophyIcon className="h-5 w-5" /> {t('member.leaderboard.title')}
      </h3>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('member.leaderboard.subtitle')}</p>
      <div className="mt-3 space-y-1">
        {rows.map((r) => (
          <div
            key={r.rank}
            className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
              r.you ? 'bg-primary-50 dark:bg-primary-950 ring-1 ring-primary-300' : ''
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                r.rank <= 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
              }`}
            >
              {r.rank}
            </span>
            <span className={`flex-1 ${r.you ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-secondary-700 dark:text-secondary-300'}`}>
              {r.name} {r.you && <Badge variant="primary" size="sm" className="ml-1">{t('member.leaderboard.you')}</Badge>}
            </span>
            <span className="font-mono text-xs text-secondary-600 dark:text-secondary-400">
              {r.pts.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
