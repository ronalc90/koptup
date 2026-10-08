'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BoltIcon,
  CakeIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  FireIcon,
  GiftIcon,
  ListBulletIcon,
  LinkIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TicketIcon,
  TrophyIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CLUB, DEMO_MONTH, DEMO_TODAY, LEADERBOARD_SAMPLE, REWARD_CATS, REWARDS, rewardById, type LedgerTx, type Member, type Mission, type Reward, type RewardCat } from './data';
import {
  balanceOf,
  barsFor,
  claimKey,
  expiringPoints,
  memberCode,
  memberLedger,
  missionProgress,
  monthPoints,
  nextTierOf,
  purchaseMonths,
  referralPoints,
  referralsOf,
  streakOf,
  tierFor,
  tierIndex,
  yearPoints,
} from './engine';
import { BIRTHDAY_GIFT, isFrozen, nowTime, useLoyalty, type Coupon } from './store';
import { Modal, SectionTitle, TIER_THEME, selectCls, useFmt, useToast } from './ui';

const TODAY_ISO = DEMO_TODAY;

export default function MemberView() {
  const t = useTranslations('demoLoyalty');
  const store = useLoyalty();
  const { state, activeMember } = store;
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <label htmlFor="ly-member" className="text-sm text-secondary-600 dark:text-secondary-300 flex items-center gap-1.5 shrink-0">
          <UserCircleIcon className="h-5 w-5" /> {t('member.viewAs')}
        </label>
        <select id="ly-member" value={activeMember.id} onChange={(e) => store.setActiveMember(e.target.value)} className={`${selectCls} sm:max-w-xs`}>
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.session ? ` (${t('member.newTag')})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('member.viewAsHint')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <MemberCard member={activeMember} />
          {activeMember.birthMonth === DEMO_MONTH && <BirthdayBanner member={activeMember} onCoupon={setCoupon} />}
          <RewardsCatalog member={activeMember} onCoupon={setCoupon} />
          <Missions member={activeMember} />
          <Movements member={activeMember} />
        </div>
        <div className="space-y-6 min-w-0">
          <WalletPass member={activeMember} />
          <MyCoupons member={activeMember} onOpen={setCoupon} />
          <Referrals member={activeMember} />
          <StreakAndBadges member={activeMember} />
          <Leaderboard member={activeMember} />
        </div>
      </div>

      {coupon && <CouponModal coupon={coupon} onClose={() => setCoupon(null)} />}
    </div>
  );
}

/* ------------------------------- Tarjeta ------------------------------- */

function MemberCard({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const balance = balanceOf(state.ledger, member.id);
  const yp = yearPoints(state.ledger, member.id);
  const th = state.rules.thresholds;
  const tier = tierFor(yp, th);
  const next = nextTierOf(tier);
  const theme = TIER_THEME[tier];
  const progress = next ? Math.min(100, Math.round(((yp - th[tier]) / (th[next] - th[tier])) * 100)) : 100;
  const expiring = state.rules.expiryMonths === 12 ? expiringPoints(member, state.ledger) : 0;
  const first = member.name.split(' ')[0];

  return (
    <Card padding="none" className={`overflow-hidden bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-xl`}>
      <div className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest opacity-90">{CLUB.club}</p>
            <p className={`text-sm mt-1 ${theme.text}`}>{t('member.greeting', { name: first })}</p>
            <p className="text-xs opacity-80 mt-0.5">{t('member.since', { date: f.date(member.since) })}</p>
          </div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur shrink-0" size="lg">
            <TrophyIcon className="h-4 w-4 mr-1" /> {t(`tiers.${tier}`)}
          </Badge>
        </div>
        <div className="mb-6">
          <p className={`text-sm ${theme.text}`}>{t('member.pointsLabel')}</p>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
            <p className="text-5xl md:text-6xl font-bold tracking-tight" data-testid="ly-balance">
              {f.num(balance)}
            </p>
            <p className="text-lg opacity-80">{t('common.points')}</p>
          </div>
          <p className="text-xs opacity-90 mt-1">{t('member.worth', { value: f.money(balance * state.rules.pointValue) })}</p>
          {isFrozen(state, member.id) && <p className="mt-2 inline-block rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-medium">{t('member.frozen')}</p>}
          <p className="text-xs opacity-90 mt-2 flex items-center gap-1">
            <FireIcon className="h-4 w-4 shrink-0" />
            {expiring > 0 ? t('member.expiring', { points: f.num(expiring), date: f.date('2026-10-31') }) : t('member.expiryRule', { months: state.rules.expiryMonths })}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-sm mb-2">
            <span className={theme.text}>
              {next ? t('member.toNext', { points: f.num(th[next] - yp), tier: t(`tiers.${next}`) }) : t('member.topTier')}
            </span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('member.progressLabel')}>
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs opacity-80">{t('member.yearPoints', { points: f.num(yp) })}</p>
        </div>
      </div>
      <div className="bg-black/20 backdrop-blur px-5 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <CheckBadgeIcon className="h-4 w-4 shrink-0" />
            <span>{t(`perks.${tier}.${i}`)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ Cumpleaños ------------------------------ */

function BirthdayBanner({ member, onCoupon }: { member: Member; onCoupon: (c: Coupon) => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, claimBirthday } = useLoyalty();
  const claimed = state.birthdayClaimed.includes(member.id);
  const code = state.coupons.find((c) => c.memberId === member.id && c.kind === 'birthday')?.code;
  return (
    <Card padding="none" className="overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 text-white">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur w-fit">
          <CakeIcon className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{t('member.birthday.title', { name: member.name.split(' ')[0] })}</p>
          <p className="text-sm opacity-90">
            {claimed ? t('member.birthday.claimed', { code: code ?? '' }) : t('member.birthday.subtitle', { value: f.money(BIRTHDAY_GIFT) })}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-white text-rose-600 hover:bg-white/90 shrink-0 self-start sm:self-auto"
          disabled={claimed}
          onClick={() => {
            const c = claimBirthday(member.id, TODAY_ISO, nowTime());
            if (c) {
              onCoupon(c);
              notify(t('member.birthday.toast', { code: c.code }));
            }
          }}
        >
          <GiftIcon className="h-4 w-4 mr-1" /> {claimed ? t('member.birthday.done') : t('member.birthday.cta')}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------ Recompensas ------------------------------ */

function RewardsCatalog({ member, onCoupon }: { member: Member; onCoupon: (c: Coupon) => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, redeemReward } = useLoyalty();
  const [cat, setCat] = useState<'all' | RewardCat>('all');
  const [confirm, setConfirm] = useState<Reward | null>(null);
  const balance = balanceOf(state.ledger, member.id);
  const frozen = isFrozen(state, member.id);
  const items = REWARDS.filter((r) => cat === 'all' || r.cat === cat);

  return (
    <Card>
      <SectionTitle icon={GiftIcon} title={t('member.rewards.title')} subtitle={t('member.rewards.subtitle', { value: f.money(state.rules.pointValue) })} />
      <div className="flex gap-2 my-4 overflow-x-auto pb-1" role="group" aria-label={t('member.rewards.filter')}>
        {(['all', ...REWARD_CATS] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              cat === c ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            }`}
          >
            {t(`member.rewards.categories.${c}`)} ({c === 'all' ? REWARDS.length : REWARDS.filter((r) => r.cat === c).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((r) => {
          const stock = state.stock[r.id];
          const out = typeof stock === 'number' && stock <= 0;
          const enough = balance >= r.pts;
          return (
            <div key={r.id} className="rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 flex flex-col">
              <div className={`bg-gradient-to-br ${r.color} h-16 px-3 flex items-center justify-center text-center text-white font-semibold text-sm`}>
                {t(`member.rewards.categories.${r.cat}`)}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-sm font-medium text-secondary-900 dark:text-white">{t(`rewards.items.${r.id}.name`)}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{t(`rewards.items.${r.id}.desc`)}</p>
                <p className="text-sm font-bold text-secondary-900 dark:text-white mt-2">
                  {f.num(r.pts)} {t('common.pts')}
                </p>
                {typeof stock === 'number' && (
                  <Badge variant={stock <= 3 ? 'warning' : 'default'} size="sm" className="mt-1 self-start">
                    {out ? t('member.rewards.outOfStock') : t('member.rewards.stock', { n: stock })}
                  </Badge>
                )}
                <Button size="sm" className="mt-3 text-xs" disabled={!enough || out || frozen} onClick={() => setConfirm(r)}>
                  {frozen ? t('member.rewards.frozen') : out ? t('member.rewards.outOfStock') : enough ? t('member.rewards.redeem') : t('member.rewards.missing', { n: f.num(r.pts - balance) })}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {confirm && (
        <Modal title={t('member.rewards.confirmTitle')} onClose={() => setConfirm(null)} labelId="ly-redeem-title" size="sm">
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            {t('member.rewards.confirmText', { name: t(`rewards.items.${confirm.id}.name`), pts: f.num(confirm.pts), after: f.num(balance - confirm.pts) })}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const res = redeemReward(member.id, confirm.id, TODAY_ISO, nowTime());
                setConfirm(null);
                if (res.ok) {
                  onCoupon(res.coupon);
                  notify(t('member.rewards.toast', { pts: f.num(confirm.pts), balance: f.num(res.balance) }));
                } else {
                  notify(t(`member.rewards.errors.${res.error}`));
                }
              }}
            >
              {t('member.rewards.confirm')}
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function couponTitle(t: ReturnType<typeof useTranslations>, c: Coupon, money: (n: number) => string) {
  return c.kind === 'birthday' ? t('coupons.birthday', { value: money(c.value) }) : t(`rewards.items.${c.rewardId}.name`);
}

function CouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const reward = coupon.rewardId ? rewardById(coupon.rewardId) : undefined;
  const isDonation = reward?.cat === 'donations';
  const balance = balanceOf(state.ledger, coupon.memberId);
  return (
    <Modal title={isDonation ? t('coupons.donationTitle') : t('coupons.title')} onClose={onClose} labelId="ly-coupon-title" size="sm">
      <div className="rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-700 p-4 text-center">
        <p className="text-xs uppercase tracking-widest text-secondary-500">{CLUB.club}</p>
        <p className="mt-1 font-semibold text-secondary-900 dark:text-white">{couponTitle(t, coupon, f.money)}</p>
        {!isDonation && (
          <>
            <div className="mt-3 bg-white rounded p-2 inline-block" aria-hidden="true">
              <div className="flex gap-px h-10">
                {barsFor(coupon.code, 34).map((w, i) => (
                  <div key={i} className="bg-secondary-900" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
            <p className="mt-2 font-mono text-lg tracking-widest text-secondary-900 dark:text-white" data-testid="ly-coupon-code">
              {coupon.code}
            </p>
          </>
        )}
        <p className="mt-2 text-xs text-secondary-500">
          {isDonation ? t('coupons.donationText', { value: f.money(reward?.value ?? 0) }) : coupon.value > 0 ? t('coupons.useVoucher') : t('coupons.useItem')}
        </p>
      </div>
      <p className="mt-3 text-sm text-secondary-700 dark:text-secondary-300">{t('coupons.balance', { balance: f.num(balance) })}</p>
      <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{t('coupons.note')}</p>
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>{t('common.done')}</Button>
      </div>
    </Modal>
  );
}

function MyCoupons({ member, onOpen }: { member: Member; onOpen: (c: Coupon) => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const list = state.coupons.filter((c) => c.memberId === member.id);
  return (
    <Card>
      <SectionTitle icon={TicketIcon} title={t('coupons.listTitle')} subtitle={t('coupons.listSubtitle')} />
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-secondary-500">{t('coupons.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => onOpen(c)}
                className="w-full text-left rounded-lg border border-secondary-200 dark:border-secondary-800 p-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-800"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-secondary-900 dark:text-white truncate">{couponTitle(t, c, f.money)}</span>
                  <Badge size="sm" variant={c.status === 'valid' ? 'success' : 'default'}>
                    {c.rewardId && rewardById(c.rewardId)?.cat === 'donations' ? t('coupons.status.donated') : t(`coupons.status.${c.status}`)}
                  </Badge>
                </span>
                <span className="block font-mono text-xs text-secondary-500 mt-0.5">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* -------------------------------- Misiones -------------------------------- */

const MISSION_ICON = { purchasesMonth: ShoppingBagIcon, appPurchases: DevicePhoneMobileIcon, referrals: UserGroupIcon, profile: UserCircleIcon } as const;

export function missionTitle(t: ReturnType<typeof useTranslations>, m: Mission) {
  return m.name || t(`missions.types.${m.type}`, { n: m.target });
}

function Missions({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, claimMission } = useLoyalty();
  const active = state.missions.filter((m) => m.active);
  return (
    <Card>
      <SectionTitle icon={BoltIcon} title={t('member.missions.title')} subtitle={t('member.missions.subtitle')} />
      {active.length === 0 ? (
        <p className="mt-4 text-sm text-secondary-500">{t('member.missions.none')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {active.map((m) => {
            const { current, done } = missionProgress(m, member, state.members, state.ledger);
            const claimed = state.claims.includes(claimKey(member.id, m.id));
            const Icon = MISSION_ICON[m.type];
            return (
              <div key={m.id} className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary-600 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">{missionTitle(t, m)}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">+{f.num(m.reward)} {t('common.pts')}</p>
                  </div>
                </div>
                <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div className={`h-full ${done ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${(current / m.target) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs gap-2">
                  <span className="text-secondary-500 dark:text-secondary-400">{t('member.missions.progress', { current, total: m.target })}</span>
                  {claimed ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">{t('member.missions.claimed')}</span>
                  ) : done ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="!py-1 text-xs"
                      onClick={() => {
                        const pts = claimMission(member.id, m.id, TODAY_ISO, nowTime());
                        if (pts) notify(t('member.missions.toast', { pts: f.num(pts) }));
                      }}
                    >
                      {t('member.missions.claim')}
                    </Button>
                  ) : (
                    <span className="text-secondary-400">{t(`member.missions.howTo.${m.type}`)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Movimientos ------------------------------ */

export function txLabel(t: ReturnType<typeof useTranslations>, tx: LedgerTx, money: (n: number) => string, missions: Mission[]) {
  switch (tx.kind) {
    case 'opening':
      return t('tx.opening');
    case 'earn':
      return t('tx.earn', { amount: money(tx.amount ?? 0), category: tx.category ? t(`categories.${tx.category}`) : '' });
    case 'summary':
      return t('tx.summary');
    case 'redeem':
      return tx.rewardId ? t('tx.redeem', { name: t(`rewards.items.${tx.rewardId}.name`) }) : t('tx.redeemSummary');
    case 'welcome':
      return t('tx.welcome');
    case 'referral':
      return t('tx.referral', { name: tx.label ?? '' });
    case 'mission': {
      const m = missions.find((x) => x.id === tx.missionId);
      return t('tx.mission', { name: m ? missionTitle(t, m) : tx.label ?? '' });
    }
    case 'reversal':
      return t('tx.reversal', { id: (tx.saleId ?? '').replace('-canje', '') });
    default:
      return '';
  }
}

function Movements({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const [all, setAll] = useState(false);
  // Más recientes primero: por fecha, hora y orden de registro.
  const txs = memberLedger(state.ledger, member.id)
    .map((tx, i) => ({ tx, i }))
    .sort((x, y) => y.tx.date.localeCompare(x.tx.date) || (y.tx.time ?? '').localeCompare(x.tx.time ?? '') || y.i - x.i)
    .map((x) => x.tx);
  const shown = all ? txs : txs.slice(0, 6);
  return (
    <Card>
      <SectionTitle icon={ListBulletIcon} title={t('member.movements.title')} subtitle={t('member.movements.subtitle')} />
      <ul className="mt-4 divide-y divide-secondary-100 dark:divide-secondary-800">
        {shown.map((tx) => (
          <li key={tx.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-secondary-900 dark:text-white truncate">
                {txLabel(t, tx, f.money, state.missions)}
                {tx.session && (
                  <Badge size="sm" variant="primary" className="ml-2">
                    {t('member.movements.new')}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-secondary-500">
                {f.date(tx.date)}
                {tx.time ? ` · ${tx.time}` : ''}
                {tx.channel ? ` · ${t(`channels.${tx.channel}`)}` : ''}
              </p>
            </div>
            <span className={`font-mono shrink-0 ${tx.points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{f.signed(tx.points)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-secondary-500">{t('member.movements.sum', { balance: f.num(balanceOf(state.ledger, member.id)) })}</p>
        {txs.length > 6 && (
          <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>
            {all ? t('member.movements.less') : t('member.movements.all', { n: txs.length })}
          </Button>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------- Wallet --------------------------------- */

function WalletPass({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const [flipped, setFlipped] = useState(false);
  const [preview, setPreview] = useState(false);
  const tier = tierFor(yearPoints(state.ledger, member.id), state.rules.thresholds);
  const theme = TIER_THEME[tier];
  const code = memberCode(member);
  const balance = balanceOf(state.ledger, member.id);

  return (
    <Card>
      <SectionTitle icon={CreditCardIcon} title={t('member.wallet.title')} subtitle={t('member.wallet.subtitle')} />
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={t('member.wallet.flip')}
        className={`mt-4 w-full aspect-[3/2] lg:aspect-[4/5] rounded-2xl bg-gradient-to-br ${theme.from} ${theme.to} text-white p-5 shadow-2xl ring-2 ${theme.ring} flex flex-col justify-between text-left transition-transform hover:scale-[1.02]`}
      >
        {!flipped ? (
          <>
            <span className="flex items-start justify-between gap-2">
              <SparklesIcon className="h-7 w-7" />
              <span className="text-xs uppercase tracking-widest opacity-90 text-right">{CLUB.club}</span>
            </span>
            <span>
              <span className="block text-xs uppercase tracking-wider opacity-80">{member.name}</span>
              <span className="block text-lg font-bold mt-1">{t('member.wallet.tierLine', { tier: t(`tiers.${tier}`) })}</span>
              <span className="block text-sm opacity-90">
                {f.num(balance)} {t('common.points')}
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="text-xs uppercase tracking-wider opacity-80">{t('member.wallet.memberCode')}</span>
            <span className="block space-y-3">
              <span className="block bg-white rounded p-2" aria-hidden="true">
                <span className="flex gap-px h-10">
                  {barsFor(code).map((w, i) => (
                    <span key={i} className="block bg-secondary-900" style={{ width: `${w}px` }} />
                  ))}
                </span>
              </span>
              <span className="block font-mono text-sm tracking-widest text-center">{code}</span>
            </span>
          </>
        )}
      </button>
      <p className="mt-2 text-[11px] text-center text-secondary-500">{t('member.wallet.tap')}</p>
      <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => setPreview(true)}>
        <DevicePhoneMobileIcon className="h-4 w-4 mr-1" /> {t('member.wallet.add')}
      </Button>
      {preview && (
        <Modal title={t('member.wallet.previewTitle')} onClose={() => setPreview(false)} labelId="ly-wallet-title" size="sm">
          <div className="mx-auto w-56 rounded-[2rem] border-8 border-secondary-900 bg-secondary-100 dark:bg-secondary-800 p-3">
            <div className={`rounded-xl bg-gradient-to-br ${theme.from} ${theme.to} text-white p-3`}>
              <p className="text-[10px] uppercase tracking-widest opacity-90">{CLUB.club}</p>
              <p className="mt-3 text-[10px] uppercase opacity-80">{t('member.wallet.balance')}</p>
              <p className="text-xl font-bold">{f.num(balance)}</p>
              <p className="mt-2 text-[10px] uppercase opacity-80">{t('member.wallet.level')}</p>
              <p className="text-sm font-semibold">{t(`tiers.${tier}`)}</p>
              <p className="mt-2 text-[10px] opacity-90 truncate">{member.name}</p>
              <div className="mt-3 bg-white rounded p-1.5" aria-hidden="true">
                <div className="flex gap-px h-6">
                  {barsFor(code, 30).map((w, i) => (
                    <div key={i} className="bg-secondary-900" style={{ width: `${w}px` }} />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-center font-mono text-[10px]">{code}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-secondary-600 dark:text-secondary-300">{t('member.wallet.previewNote')}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setPreview(false)}>{t('common.close')}</Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

/* -------------------------------- Referidos -------------------------------- */

function Referrals({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state } = useLoyalty();
  const [copied, setCopied] = useState(false);
  const slug = `${member.name.split(' ')[0]}-${member.phone.slice(-3)}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const link = `https://${CLUB.domain}/r/${slug}`;
  const message = t('member.referrals.message', { club: CLUB.club, points: f.num(state.rules.refereeReward), link });

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
    notify(ok ? t('member.referrals.copied') : t('member.referrals.copyFail'));
  };

  return (
    <Card>
      <SectionTitle icon={LinkIcon} title={t('member.referrals.title')} subtitle={t('member.referrals.subtitle', { you: f.num(state.rules.referrerReward), friend: f.num(state.rules.refereeReward) })} />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-center">
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">{referralsOf(member, state.members)}</p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('member.referrals.friends')}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950 text-center">
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">{f.num(referralPoints(state.ledger, member.id))}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400">{t('member.referrals.earned')}</p>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="ly-ref-link" className="text-xs text-secondary-500 dark:text-secondary-400 mb-1 block">
          {t('member.referrals.yourLink')}
        </label>
        <div className="flex gap-2">
          <input id="ly-ref-link" value={link} readOnly className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-xs font-mono text-secondary-800 dark:text-secondary-100" />
          <Button size="sm" variant="outline" onClick={copy} aria-label={t('member.referrals.copy')} title={t('member.referrals.copy')}>
            {copied ? <ClipboardDocumentCheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-3 mb-1">{t('member.referrals.share')}</p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-xs text-secondary-700 dark:text-secondary-200"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(t('member.referrals.subject', { club: CLUB.club }))}&body=${encodeURIComponent(message)}`}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-xs text-secondary-700 dark:text-secondary-200"
        >
          <EnvelopeIcon className="h-4 w-4" /> {t('member.referrals.email')}
        </a>
      </div>
      <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('member.referrals.note')}</p>
    </Card>
  );
}

/* --------------------------- Racha e insignias --------------------------- */

function StreakAndBadges({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const { state } = useLoyalty();
  const months = purchaseMonths(member, state.ledger);
  const streak = streakOf(months);
  const txs = memberLedger(state.ledger, member.id);
  const tier = tierFor(yearPoints(state.ledger, member.id), state.rules.thresholds);
  const badges = [
    { id: 'first', on: txs.some((x) => x.kind === 'earn' || x.kind === 'summary') },
    { id: 'streak3', on: streak >= 3 },
    { id: 'ambassador', on: referralsOf(member, state.members) > 0 },
    { id: 'solidarity', on: txs.some((x) => x.kind === 'redeem' && x.rewardId && rewardById(x.rewardId)?.cat === 'donations') },
    { id: 'gold', on: tierIndex(tier) >= tierIndex('gold') },
  ];
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <div className="flex items-center gap-3">
          <FireIcon className="h-10 w-10 shrink-0" />
          <div>
            <p className="text-3xl font-bold">{t('member.streak.months', { n: streak })}</p>
            <p className="text-sm opacity-90">{t('member.streak.title')}</p>
          </div>
        </div>
        <p className="text-xs opacity-90 mt-3">{months.has(DEMO_MONTH) ? t('member.streak.kept') : t('member.streak.keep')}</p>
        <div className="flex gap-1 mt-3" aria-label={t('member.streak.chart')}>
          {Array.from({ length: DEMO_MONTH }, (_, i) => i + 1).map((m) => (
            <div key={m} className="flex-1 text-center">
              <div className={`h-2 rounded-full ${months.has(m) ? 'bg-white' : 'bg-white/25'}`} title={t(`monthsLong.${m}`)} />
              <span className="block text-[9px] mt-1 opacity-80">{t(`months.${m}`).slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t('member.badges.title')}</p>
        <ul className="mt-3 grid grid-cols-1 gap-2">
          {badges.map((b) => (
            <li key={b.id} className={`flex items-center gap-2 text-xs ${b.on ? 'text-secondary-800 dark:text-secondary-100' : 'text-secondary-400 dark:text-secondary-600'}`}>
              <CheckBadgeIcon className={`h-5 w-5 shrink-0 ${b.on ? 'text-amber-500' : ''}`} />
              <span>
                <b>{t(`member.badges.items.${b.id}.name`)}</b> · {t(`member.badges.items.${b.id}.how`)}
              </span>
              <span className="sr-only">{b.on ? t('member.badges.earned') : t('member.badges.locked')}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* -------------------------------- Ranking -------------------------------- */

function Leaderboard({ member }: { member: Member }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  if (!state.rules.showLeaderboard) {
    return (
      <Card>
        <SectionTitle icon={TrophyIcon} title={t('member.leaderboard.title')} />
        <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('member.leaderboard.off')}</p>
      </Card>
    );
  }
  const mine = monthPoints(state.ledger, member.id);
  const [first, last] = member.name.split(' ');
  const rows = [...LEADERBOARD_SAMPLE.map((r) => ({ ...r, you: false })), { name: last ? `${first} ${last[0]}.` : first, pts: mine, you: true }]
    .sort((a, b) => b.pts - a.pts)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const top = rows.slice(0, 10);
  const me = rows.find((r) => r.you);
  return (
    <Card>
      <SectionTitle icon={TrophyIcon} title={t('member.leaderboard.title')} subtitle={t('member.leaderboard.subtitle', { month: t(`monthsLong.${DEMO_MONTH}`) })} />
      <ol className="mt-3 space-y-1">
        {top.map((r) => (
          <li key={r.rank} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${r.you ? 'bg-primary-50 dark:bg-primary-950 ring-1 ring-primary-300' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${r.rank <= 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'}`}>{r.rank}</span>
            <span className={`flex-1 truncate ${r.you ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-secondary-700 dark:text-secondary-300'}`}>
              {r.name}
              {r.you && (
                <Badge variant="primary" size="sm" className="ml-1">
                  {t('member.leaderboard.you')}
                </Badge>
              )}
            </span>
            <span className="font-mono text-xs text-secondary-600 dark:text-secondary-400">{f.num(r.pts)}</span>
          </li>
        ))}
      </ol>
      {me && me.rank > 10 && <p className="mt-2 text-xs text-secondary-500">{t('member.leaderboard.yourRank', { rank: me.rank, pts: f.num(me.pts) })}</p>}
    </Card>
  );
}

