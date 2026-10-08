'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import {
  ANALYTICS,
  CATEGORIES,
  CHANNELS,
  DEMO_WEEK,
  DRAW_PARTICIPANTS,
  MISSION_TYPES,
  TIERS,
  type CategoryKey,
  type ChannelKey,
  type MissionType,
  type Rules,
  type TierKey,
} from './data';
import { programCost, quoteSale, returnPct, thresholdsValid, tierCounts, weekdayOf, wouldDowngrade, yearPoints } from './engine';
import { missionTitle } from './MemberView';
import { useLoyalty } from './store';
import { Field, KpiBox, SampleTag, SectionTitle, TIER_THEME, Toggle, inputCls, selectCls, useFmt, useToast } from './ui';

const digits = (s: string) => s.replace(/\D/g, '');

/** Puntos del año de los miembros inscritos durante la demo (se suman a la base de ejemplo). */
export function useSessionYearPoints() {
  const { state } = useLoyalty();
  return useMemo(() => state.members.filter((m) => m.session).map((m) => yearPoints(state.ledger, m.id)), [state.members, state.ledger]);
}

/* --------------------------------- Puntos --------------------------------- */

export function PointsConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, setRules, resetRules } = useLoyalty();
  const r = state.rules;

  const [simAmount, setSimAmount] = useState(185000);
  const [simCat, setSimCat] = useState<CategoryKey>('personalCare');
  const [simChannel, setSimChannel] = useState<ChannelKey>('store');
  const [simDay, setSimDay] = useState('2026-10-06');
  const [sales, setSales] = useState(ANALYTICS.monthlyMemberSales);
  const [expired, setExpired] = useState(ANALYTICS.expiredPct);

  const sim = quoteSale([{ category: simCat, amount: simAmount }], 0, simChannel, simDay, r);
  const cost = programCost(sales, r, expired);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <Card className="xl:col-span-3">
        <SectionTitle
          icon={CurrencyDollarIcon}
          title={t('config.points.title')}
          subtitle={t('config.points.subtitle')}
          right={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                resetRules();
                notify(t('config.points.resetDone'));
              }}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" /> {t('config.points.reset')}
            </Button>
          }
        />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('config.points.base')} htmlFor="cf-base">
            <select id="cf-base" value={r.baseAmount} onChange={(e) => setRules({ baseAmount: Number(e.target.value) })} className={selectCls}>
              {[500, 1000, 2000, 5000].map((v) => (
                <option key={v} value={v}>
                  {t('config.points.baseOption', { amount: f.money(v) })}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('config.points.value')} htmlFor="cf-value">
            <select id="cf-value" value={r.pointValue} onChange={(e) => setRules({ pointValue: Number(e.target.value) })} className={selectCls}>
              {[5, 10, 20].map((v) => (
                <option key={v} value={v}>
                  {t('config.points.valueOption', { amount: f.money(v) })}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-sm text-secondary-700 dark:text-secondary-300">{t('config.points.returnPct', { pct: f.dec(returnPct(r)) })}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('config.points.byCategory')}</p>
            <div className="space-y-2">
              {CATEGORIES.map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <label htmlFor={`cf-cat-${k}`} className="text-xs text-secondary-600 dark:text-secondary-300 w-32 shrink-0">
                    {t(`categories.${k}`)}
                  </label>
                  <input
                    id={`cf-cat-${k}`}
                    type="range"
                    min={0}
                    max={3}
                    step={0.5}
                    value={r.categoryMult[k]}
                    onChange={(e) => setRules({ categoryMult: { ...r.categoryMult, [k]: parseFloat(e.target.value) } })}
                    className="flex-1 min-w-0 accent-primary-600"
                  />
                  <span className="text-xs font-mono w-10 text-right text-secondary-900 dark:text-white">×{f.dec(r.categoryMult[k])}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-secondary-500">{t('config.points.rxNote')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('config.points.byChannel')}</p>
            <div className="space-y-2">
              {CHANNELS.map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <label htmlFor={`cf-ch-${k}`} className="text-xs text-secondary-600 dark:text-secondary-300 w-32 shrink-0">
                    {t(`channels.${k}`)}
                  </label>
                  <input
                    id={`cf-ch-${k}`}
                    type="range"
                    min={1}
                    max={3}
                    step={0.25}
                    value={r.channelMult[k]}
                    onChange={(e) => setRules({ channelMult: { ...r.channelMult, [k]: parseFloat(e.target.value) } })}
                    className="flex-1 min-w-0 accent-primary-600"
                  />
                  <span className="text-xs font-mono w-10 text-right text-secondary-900 dark:text-white">×{f.dec(r.channelMult[k])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-secondary-900 dark:text-white">{t('config.points.dayRule')}</p>
            <Toggle checked={r.dayRule.enabled} onChange={(v) => setRules({ dayRule: { ...r.dayRule, enabled: v } })} label={t('config.points.dayRule')} />
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={t('config.points.dayCategory')} htmlFor="cf-day-cat">
              <select id="cf-day-cat" value={r.dayRule.category} disabled={!r.dayRule.enabled} onChange={(e) => setRules({ dayRule: { ...r.dayRule, category: e.target.value as CategoryKey } })} className={selectCls}>
                {CATEGORIES.filter((c) => c !== 'rx').map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('config.points.dayWeekday')} htmlFor="cf-day-wd">
              <select id="cf-day-wd" value={r.dayRule.weekday} disabled={!r.dayRule.enabled} onChange={(e) => setRules({ dayRule: { ...r.dayRule, weekday: Number(e.target.value) } })} className={selectCls}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <option key={d} value={d}>
                    {f.weekday(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('config.points.dayMult')} htmlFor="cf-day-mult">
              <select id="cf-day-mult" value={r.dayRule.mult} disabled={!r.dayRule.enabled} onChange={(e) => setRules({ dayRule: { ...r.dayRule, mult: Number(e.target.value) } })} className={selectCls}>
                {[1.5, 2, 3].map((m) => (
                  <option key={m} value={m}>
                    ×{f.dec(m)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
            {r.dayRule.enabled
              ? t('config.points.dayRuleText', { mult: f.dec(r.dayRule.mult), category: t(`categories.${r.dayRule.category}`), day: f.weekdayPlural(r.dayRule.weekday) })
              : t('config.points.dayRuleOff')}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('config.points.welcome')} htmlFor="cf-welcome">
            <input
              id="cf-welcome"
              inputMode="numeric"
              value={r.welcomeBonus}
              onChange={(e) => setRules({ welcomeBonus: Math.min(5000, Number(digits(e.target.value) || 0)) })}
              className={inputCls}
            />
          </Field>
          <Field label={t('config.points.expiry')} htmlFor="cf-expiry">
            <select id="cf-expiry" value={r.expiryMonths} onChange={(e) => setRules({ expiryMonths: Number(e.target.value) })} className={selectCls}>
              {[6, 12, 18, 24].map((m) => (
                <option key={m} value={m}>
                  {t('config.points.expiryOption', { months: m })}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.points.liveNote')}</p>
      </Card>

      <div className="xl:col-span-2 space-y-6">
        <Card>
          <SectionTitle icon={CalculatorIcon} title={t('config.points.simTitle')} subtitle={t('config.points.simSubtitle')} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('config.points.simAmount')} htmlFor="sim-amount">
              <input id="sim-amount" inputMode="numeric" value={f.num(simAmount)} onChange={(e) => setSimAmount(Math.min(99_999_999, Number(digits(e.target.value) || 0)))} className={`${inputCls} font-mono text-right`} />
            </Field>
            <Field label={t('config.points.simCategory')} htmlFor="sim-cat">
              <select id="sim-cat" value={simCat} onChange={(e) => setSimCat(e.target.value as CategoryKey)} className={selectCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('config.points.simChannel')} htmlFor="sim-ch">
              <select id="sim-ch" value={simChannel} onChange={(e) => setSimChannel(e.target.value as ChannelKey)} className={selectCls}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {t(`channels.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('config.points.simDay')} htmlFor="sim-day">
              <select id="sim-day" value={simDay} onChange={(e) => setSimDay(e.target.value)} className={selectCls}>
                {DEMO_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {f.weekday(weekdayOf(d))}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4 rounded-xl bg-primary-50 dark:bg-primary-950/50 p-4" aria-live="polite">
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300" data-testid="ly-sim-points">
              {f.num(sim.points)} {t('common.points')}
            </p>
            <p className="text-sm text-secondary-700 dark:text-secondary-300 mt-1">
              {t('config.points.simResult', {
                base: f.num(sim.lines[0]?.base ?? 0),
                mult: f.dec(sim.lines[0]?.mult ?? 0),
                value: f.money(sim.points * r.pointValue),
                pct: f.dec(simAmount > 0 ? ((sim.points * r.pointValue) / simAmount) * 100 : 0),
              })}
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={CalculatorIcon} title={t('config.points.costTitle')} subtitle={t('config.points.costSubtitle')} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('config.points.costSales')} htmlFor="cost-sales">
              <input id="cost-sales" inputMode="numeric" value={f.num(sales)} onChange={(e) => setSales(Math.min(999_999_999_999, Number(digits(e.target.value) || 0)))} className={`${inputCls} font-mono text-right`} />
            </Field>
            <Field label={t('config.points.costExpired')} htmlFor="cost-exp">
              <input id="cost-exp" inputMode="numeric" value={expired} onChange={(e) => setExpired(Math.min(90, Number(digits(e.target.value) || 0)))} className={`${inputCls} font-mono text-right`} />
            </Field>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-secondary-500">{t('config.points.costIssued')}</dt>
            <dd className="text-right font-mono">{f.num(cost.issued)}</dd>
            <dt className="text-secondary-500">{t('config.points.costGross')}</dt>
            <dd className="text-right font-mono">{f.money(cost.gross)}</dd>
            <dt className="font-semibold text-secondary-900 dark:text-white">{t('config.points.costNet')}</dt>
            <dd className="text-right font-mono font-semibold text-secondary-900 dark:text-white" data-testid="ly-cost-net">
              {f.money(cost.net)}
            </dd>
          </dl>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.points.costNote')}</p>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- Niveles --------------------------------- */

export function TiersConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, setThresholds, setRules } = useLoyalty();
  const extra = useSessionYearPoints();
  const [draft, setDraft] = useState<Rules['thresholds']>(state.rules.thresholds);
  const valid = thresholdsValid(draft);
  const changed = TIERS.some((k) => draft[k] !== state.rules.thresholds[k]);
  const current = tierCounts(state.rules.thresholds, extra);
  const next = valid ? tierCounts(draft, extra) : current;

  return (
    <Card>
      <SectionTitle icon={TicketIcon} title={t('config.tiers.title')} subtitle={t('config.tiers.subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {TIERS.map((k) => {
          const theme = TIER_THEME[k];
          const diff = next[k] - current[k];
          return (
            <div key={k} className={`rounded-lg p-4 bg-gradient-to-br ${theme.from} ${theme.to} text-white`}>
              <p className="font-semibold">{t(`tiers.${k}`)}</p>
              <label htmlFor={`th-${k}`} className="block text-xs opacity-90 mt-2">
                {t('config.tiers.from')}
              </label>
              <input
                id={`th-${k}`}
                inputMode="numeric"
                disabled={k === 'classic'}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: Number(digits(e.target.value) || 0) })}
                className="mt-1 w-full rounded-md bg-white/90 text-secondary-900 px-2 py-1.5 text-sm font-mono disabled:opacity-70"
              />
              <p className="mt-2 text-xs opacity-95">
                {t('config.tiers.members', { n: f.num(next[k]) })}
                {changed && valid && diff !== 0 && <span className="ml-1 font-semibold">({diff > 0 ? '+' : '−'}{f.num(Math.abs(diff))})</span>}
              </p>
            </div>
          );
        })}
      </div>
      {!valid && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <ExclamationTriangleIcon className="h-4 w-4" /> {t('config.tiers.invalid')}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!valid || !changed}
          onClick={() => {
            if (setThresholds(draft)) notify(t('config.tiers.saved'));
          }}
        >
          {t('config.tiers.save')}
        </Button>
        <Button size="sm" variant="ghost" disabled={!changed} onClick={() => setDraft(state.rules.thresholds)}>
          {t('config.tiers.discard')}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.tiers.note')}</p>

      <div className="mt-5 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <ArrowTrendingDownIcon className="h-5 w-5 text-secondary-500 shrink-0" />
          <label htmlFor="th-down" className="text-sm text-secondary-700 dark:text-secondary-300 flex-1">
            {t('config.tiers.downgrade', { months: state.rules.downgradeMonths })}
          </label>
          <input
            id="th-down"
            type="range"
            min={3}
            max={24}
            value={state.rules.downgradeMonths}
            onChange={(e) => setRules({ downgradeMonths: parseInt(e.target.value, 10) })}
            className="w-full sm:w-40 accent-primary-600"
          />
        </div>
        <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
          {t('config.tiers.downgradeEffect', { n: f.num(wouldDowngrade(state.rules.downgradeMonths)) })} <SampleTag />
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------- Misiones -------------------------------- */

export function MissionsConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, toggleMission, setMissionReward, addMission, setRules } = useLoyalty();
  const [name, setName] = useState('');
  const [type, setType] = useState<MissionType>('purchasesMonth');
  const [target, setTarget] = useState(3);
  const [reward, setReward] = useState(400);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (target < 1 || reward < 1) return;
    addMission({ name: name.trim() || undefined, type, target: type === 'profile' ? 1 : target, reward });
    notify(t('config.missions.created'));
    setName('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title={t('config.missions.title')} subtitle={t('config.missions.subtitle')} />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.missions.map((m) => (
            <div key={m.id} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-secondary-900 dark:text-white text-sm">{missionTitle(t, m)}</p>
                  <Badge size="sm" variant={m.active ? 'success' : 'default'} className="mt-1">
                    {m.active ? t('config.missions.active') : t('config.missions.paused')}
                  </Badge>
                </div>
                <Toggle checked={m.active} onChange={() => toggleMission(m.id)} label={t('config.missions.toggle', { name: missionTitle(t, m) })} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label htmlFor={`mr-${m.id}`} className="text-xs text-secondary-600 dark:text-secondary-300">
                  {t('config.missions.reward')}
                </label>
                <input
                  id={`mr-${m.id}`}
                  inputMode="numeric"
                  value={m.reward}
                  onChange={(e) => setMissionReward(m.id, Math.min(10000, Number(digits(e.target.value) || 0)))}
                  className={`${inputCls} !w-24 font-mono`}
                />
                <span className="text-xs text-secondary-500">{t('common.pts')}</span>
              </div>
              {m.stats ? (
                <p className="mt-3 text-xs text-secondary-600 dark:text-secondary-400 flex flex-wrap items-center gap-1">
                  {t('config.missions.stats', { completion: m.stats.completion, lift: m.stats.lift })} <SampleTag />
                </p>
              ) : (
                <p className="mt-3 text-xs text-secondary-500">{t('config.missions.noStats')}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle icon={PlusIcon} title={t('config.missions.newTitle')} subtitle={t('config.missions.newSubtitle')} />
          <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label={t('config.missions.name')} htmlFor="nm-name" hint={t('config.missions.nameHint')}>
                <input id="nm-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label={t('config.missions.type')} htmlFor="nm-type">
              <select id="nm-type" value={type} onChange={(e) => setType(e.target.value as MissionType)} className={selectCls}>
                {MISSION_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {t(`config.missions.types.${mt}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('config.missions.target')} htmlFor="nm-target">
              <input id="nm-target" inputMode="numeric" disabled={type === 'profile'} value={type === 'profile' ? 1 : target} onChange={(e) => setTarget(Math.min(20, Number(digits(e.target.value) || 0)))} className={inputCls} />
            </Field>
            <Field label={t('config.missions.reward')} htmlFor="nm-reward">
              <input id="nm-reward" inputMode="numeric" value={reward} onChange={(e) => setReward(Math.min(10000, Number(digits(e.target.value) || 0)))} className={inputCls} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" size="sm" disabled={target < 1 || reward < 1}>
                <PlusIcon className="h-4 w-4 mr-1" /> {t('config.missions.create')}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <SectionTitle title={t('config.missions.leaderboardTitle')} subtitle={t('config.missions.leaderboardSubtitle')} />
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-secondary-200 dark:border-secondary-800 p-3">
            <span className="text-sm text-secondary-800 dark:text-secondary-200">{t('config.missions.leaderboardToggle')}</span>
            <Toggle
              checked={state.rules.showLeaderboard}
              onChange={(v) => {
                setRules({ showLeaderboard: v });
                notify(v ? t('config.missions.leaderboardOn') : t('config.missions.leaderboardOff'));
              }}
              label={t('config.missions.leaderboardToggle')}
            />
          </div>
          <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('config.missions.leaderboardNote')}</p>
          <p className="mt-3 text-xs text-secondary-600 dark:text-secondary-300">
            {t('config.missions.claimsCount', { n: f.num(state.claims.length) })}
          </p>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------- Referidos -------------------------------- */

export function ReferralsConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state, setRules } = useLoyalty();
  const sessionReferrals = state.members.filter((m) => m.session && m.referredBy).length;
  return (
    <Card>
      <SectionTitle title={t('config.referrals.title')} subtitle={t('config.referrals.subtitle')} />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <Field label={t('config.referrals.referrer')} htmlFor="rf-a">
          <input id="rf-a" inputMode="numeric" value={state.rules.referrerReward} onChange={(e) => setRules({ referrerReward: Math.min(10000, Number(digits(e.target.value) || 0)) })} className={inputCls} />
        </Field>
        <Field label={t('config.referrals.referee')} htmlFor="rf-b">
          <input id="rf-b" inputMode="numeric" value={state.rules.refereeReward} onChange={(e) => setRules({ refereeReward: Math.min(10000, Number(digits(e.target.value) || 0)) })} className={inputCls} />
        </Field>
      </div>
      <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
        {t('config.referrals.cost', { value: f.money((state.rules.referrerReward + state.rules.refereeReward) * state.rules.pointValue) })}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <KpiBox label={t('config.referrals.total')} value={f.num(4218 + sessionReferrals)} sub={<SampleTag />} />
        <KpiBox label={t('config.referrals.conversion')} value="34 %" tone="success" sub={<SampleTag />} />
        <KpiBox label={t('config.referrals.blocked')} value="57" sub={<SampleTag />} />
        <KpiBox label={t('config.referrals.session')} value={f.num(sessionReferrals)} sub={t('config.referrals.sessionSub')} />
      </div>
      <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.referrals.howTo')}</p>
    </Card>
  );
}

/* -------------------------------- Cashback -------------------------------- */

export function CashbackConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state, setRules } = useLoyalty();
  const [amount, setAmount] = useState(185000);
  const [tier, setTier] = useState<TierKey>('gold');
  const pct = state.rules.cashback[tier];
  return (
    <Card>
      <SectionTitle title={t('config.cashback.title')} subtitle={t('config.cashback.subtitle')} />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {TIERS.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <label htmlFor={`cb-${k}`} className="text-sm text-secondary-700 dark:text-secondary-300 w-24 shrink-0">
                {t(`tiers.${k}`)}
              </label>
              <input
                id={`cb-${k}`}
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={state.rules.cashback[k]}
                onChange={(e) => setRules({ cashback: { ...state.rules.cashback, [k]: parseFloat(e.target.value) } })}
                className="flex-1 min-w-0 accent-primary-600"
              />
              <span className="text-sm font-mono w-12 text-right">{f.dec(state.rules.cashback[k])} %</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-secondary-50 dark:bg-secondary-800/60 p-4">
          <p className="text-sm font-medium text-secondary-900 dark:text-white">{t('config.cashback.sim')}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('config.points.simAmount')} htmlFor="cb-amount">
              <input id="cb-amount" inputMode="numeric" value={f.num(amount)} onChange={(e) => setAmount(Math.min(99_999_999, Number(digits(e.target.value) || 0)))} className={`${inputCls} font-mono text-right`} />
            </Field>
            <Field label={t('config.cashback.tier')} htmlFor="cb-tier">
              <select id="cb-tier" value={tier} onChange={(e) => setTier(e.target.value as TierKey)} className={selectCls}>
                {TIERS.map((k) => (
                  <option key={k} value={k}>
                    {t(`tiers.${k}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-3 text-2xl font-bold text-primary-700 dark:text-primary-300" data-testid="ly-cashback">
            {f.money((amount * pct) / 100)}
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('config.cashback.result', { pct: f.dec(pct), points: f.dec(returnPct(state.rules)) })}</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.cashback.note')}</p>
    </Card>
  );
}

/* --------------------------------- Sorteos --------------------------------- */

export function SweepstakesConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, addDraw, runDraw } = useLoyalty();
  const [name, setName] = useState('');
  const [prize, setPrize] = useState('');
  const [date, setDate] = useState('2026-11-27');
  const [cost, setCost] = useState(200);

  const drawName = (d: (typeof state.draws)[number]) => (d.key ? t(`config.sweepstakes.items.${d.key}.name`) : d.name ?? '');
  const drawPrize = (d: (typeof state.draws)[number]) => (d.key ? t(`config.sweepstakes.items.${d.key}.prize`) : d.prize ?? '');

  return (
    <div className="space-y-6">
      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-100 flex gap-2">
        <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
        <span>{t('config.sweepstakes.legal')}</span>
      </div>
      <Card>
        <SectionTitle title={t('config.sweepstakes.title')} subtitle={t('config.sweepstakes.subtitle')} />
        <ul className="mt-4 space-y-3">
          {state.draws.map((d) => (
            <li key={d.id} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary-900 dark:text-white">{drawName(d)}</p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {t('config.sweepstakes.line', { prize: drawPrize(d), date: f.date(d.date), cost: f.num(d.ticketCost), n: f.num(d.participants) })}
                </p>
                {d.winner && <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{t('config.sweepstakes.winner', { name: d.winner })}</p>}
              </div>
              {d.status === 'done' ? (
                <Badge variant="success" size="sm">
                  {t('config.sweepstakes.done')}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const winner = DRAW_PARTICIPANTS[Math.floor(Math.random() * DRAW_PARTICIPANTS.length)];
                    runDraw(d.id, winner);
                    notify(t('config.sweepstakes.drawn', { name: winner }));
                  }}
                >
                  {t('config.sweepstakes.run')}
                </Button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.sweepstakes.note')}</p>
      </Card>
      <Card>
        <SectionTitle icon={PlusIcon} title={t('config.sweepstakes.newTitle')} />
        <form
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !prize.trim()) return;
            addDraw({ name: name.trim(), prize: prize.trim(), date, ticketCost: cost });
            setName('');
            setPrize('');
            notify(t('config.sweepstakes.created'));
          }}
        >
          <Field label={t('config.sweepstakes.name')} htmlFor="sw-name">
            <input id="sw-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t('config.sweepstakes.namePh')} />
          </Field>
          <Field label={t('config.sweepstakes.prize')} htmlFor="sw-prize">
            <input id="sw-prize" value={prize} maxLength={60} onChange={(e) => setPrize(e.target.value)} className={inputCls} placeholder={t('config.sweepstakes.prizePh')} />
          </Field>
          <Field label={t('config.sweepstakes.date')} htmlFor="sw-date">
            <select id="sw-date" value={date} onChange={(e) => setDate(e.target.value)} className={selectCls}>
              {['2026-10-30', '2026-11-27', '2026-12-18'].map((d) => (
                <option key={d} value={d}>
                  {f.date(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('config.sweepstakes.cost')} htmlFor="sw-cost">
            <input id="sw-cost" inputMode="numeric" value={cost} onChange={(e) => setCost(Math.min(5000, Number(digits(e.target.value) || 0)))} className={inputCls} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm" disabled={!name.trim() || !prize.trim() || cost < 1}>
              <PlusIcon className="h-4 w-4 mr-1" /> {t('config.sweepstakes.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
