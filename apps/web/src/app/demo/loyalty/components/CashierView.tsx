'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowUturnLeftIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
  UserPlusIcon,
  UserIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CATEGORIES, CHANNELS, CLUB, DEMO_TODAY, DEMO_WEEK, REWARDS, SEDES, type CategoryKey, type ChannelKey, type Member, type SedeKey } from './data';
import { balanceOf, cedulaLabel, phoneLabel, quoteSale, tierFor, weekdayOf, yearPoints, type SaleLine } from './engine';
import { isFrozen, nowTime, useLoyalty, type EnrollError, type Redeem, type Sale } from './store';
import { Field, Modal, SectionTitle, TIER_THEME, inputCls, selectCls, useFmt, useToast } from './ui';

const digits = (s: string) => s.replace(/\D/g, '');

export default function CashierView({ onOpenMember }: { onOpenMember: () => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const store = useLoyalty();
  const { state, activeMember } = store;

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [sede, setSede] = useState<SedeKey>('chapinero');
  const [date, setDate] = useState(DEMO_TODAY);
  const [channel, setChannel] = useState<ChannelKey>('store');
  const [lines, setLines] = useState<SaleLine[]>([{ category: 'personalCare', amount: 185000 }]);
  const [redeemSel, setRedeemSel] = useState('');
  const [lastSale, setLastSale] = useState<{ sale: Sale; alerts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReverse, setConfirmReverse] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (searched === null) return [];
    const q = digits(searched);
    if (q.length < 3) return [];
    return state.members.filter((m) => m.phone.includes(q) || m.cedula.includes(q));
  }, [searched, state.members]);

  const balance = balanceOf(state.ledger, activeMember.id);
  const tier = tierFor(yearPoints(state.ledger, activeMember.id), state.rules.thresholds);
  const coupons = state.coupons.filter((c) => c.memberId === activeMember.id && c.status === 'valid');
  const frozen = isFrozen(state, activeMember.id);

  const redeem: Redeem = redeemSel.startsWith('reward:')
    ? { type: 'reward', rewardId: redeemSel.slice(7) }
    : redeemSel.startsWith('coupon:')
      ? { type: 'coupon', code: redeemSel.slice(7) }
      : null;
  const redeemReward = redeem?.type === 'reward' ? REWARDS.find((r) => r.id === redeem.rewardId) : undefined;
  const redeemCoupon = redeem?.type === 'coupon' ? coupons.find((c) => c.code === redeem.code) : undefined;
  const discount = redeemReward ? redeemReward.value : redeemCoupon ? redeemCoupon.value : 0;
  const quote = quoteSale(lines, discount, channel, date, state.rules);
  const balanceAfter = balance - (redeemReward?.pts ?? 0) + quote.points;
  const weekday = weekdayOf(date);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setSearched(query);
  };

  const selectMember = (m: Member) => {
    store.setActiveMember(m.id);
    setRedeemSel('');
    setLastSale(null);
    notify(t('cashier.search.selected', { name: m.name }));
  };

  const submitSale = () => {
    setError(null);
    const res = store.registerSale({ memberId: activeMember.id, sede, channel, date, time: nowTime(), lines, redeem });
    if (!res.ok) {
      setError(t(`cashier.sale.errors.${res.error}`));
      return;
    }
    setLastSale({ sale: res.sale, alerts: res.alerts.length });
    setRedeemSel('');
    notify(t('cashier.sale.toast', { id: res.sale.id, points: f.num(res.sale.points) }));
  };

  const setLine = (i: number, patch: Partial<SaleLine>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const sessionSales = state.sales;
  const memberName = (id: string) => state.members.find((m) => m.id === id)?.name ?? '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cliente */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <SectionTitle icon={MagnifyingGlassIcon} title={t('cashier.search.title')} subtitle={t('cashier.search.subtitle')} />
            <form onSubmit={search} className="mt-4 flex gap-2">
              <label htmlFor="ly-search" className="sr-only">
                {t('cashier.search.label')}
              </label>
              <input
                id="ly-search"
                inputMode="numeric"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('cashier.search.placeholder')}
                className={inputCls}
              />
              <Button type="submit" size="sm" className="shrink-0">
                {t('cashier.search.button')}
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('cashier.search.hint')}</p>

            {searched !== null && (
              <div className="mt-3 space-y-2" aria-live="polite">
                {digits(searched).length < 3 ? (
                  <p className="text-xs text-secondary-500">{t('cashier.search.tooShort')}</p>
                ) : matches.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-secondary-300 dark:border-secondary-700 p-3 text-sm">
                    <p className="text-secondary-700 dark:text-secondary-300">{t('cashier.search.none', { q: searched })}</p>
                    <Button size="sm" className="mt-2" onClick={() => setEnrollOpen(true)}>
                      <UserPlusIcon className="h-4 w-4 mr-1" /> {t('cashier.search.enrollNew')}
                    </Button>
                  </div>
                ) : (
                  matches.map((m) => {
                    const mt = tierFor(yearPoints(state.ledger, m.id), state.rules.thresholds);
                    const active = m.id === activeMember.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMember(m)}
                        aria-pressed={active}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          active ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40' : 'border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-secondary-900 dark:text-white truncate">{m.name}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full text-white ${TIER_THEME[mt].dot}`}>{t(`tiers.${mt}`)}</span>
                        </span>
                        <span className="block text-xs text-secondary-500 mt-0.5">
                          {phoneLabel(m.phone)} · C.C. {cedulaLabel(m.cedula)} · {f.num(balanceOf(state.ledger, m.id))} {t('common.pts')}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800">
              <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
                <UserPlusIcon className="h-4 w-4 mr-1" /> {t('cashier.enroll.open')}
              </Button>
            </div>
          </Card>

          <Card className={`bg-gradient-to-br ${TIER_THEME[tier].from} ${TIER_THEME[tier].to} text-white`}>
            <p className={`text-xs uppercase tracking-wider ${TIER_THEME[tier].text}`}>{t('cashier.member.title')}</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold truncate">{activeMember.name}</p>
                <p className="text-xs opacity-90">
                  {phoneLabel(activeMember.phone)} · C.C. {cedulaLabel(activeMember.cedula)}
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-0 shrink-0" size="sm">
                {t(`tiers.${tier}`)}
              </Badge>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {f.num(balance)} <span className="text-base font-normal opacity-90">{t('common.points')}</span>
            </p>
            <p className="text-xs opacity-90">{t('cashier.member.worth', { value: f.money(balance * state.rules.pointValue) })}</p>
            <p className="mt-3 text-xs flex items-center gap-1.5">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              {activeMember.whatsappOptIn ? t('cashier.member.whatsappYes') : t('cashier.member.whatsappNo')}
            </p>
            {coupons.length > 0 && <p className="mt-1 text-xs">{t('cashier.member.coupons', { n: coupons.length })}</p>}
            {frozen && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-medium">
                <ExclamationTriangleIcon className="h-4 w-4" /> {t('cashier.member.frozen')}
              </p>
            )}
          </Card>
        </div>

        {/* Compra */}
        <Card className="lg:col-span-3">
          <SectionTitle icon={ShoppingCartIcon} title={t('cashier.sale.title')} subtitle={t('cashier.sale.subtitle', { club: CLUB.club })} />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('cashier.sale.sede')} htmlFor="ly-sede">
              <select id="ly-sede" value={sede} onChange={(e) => setSede(e.target.value as SedeKey)} className={selectCls}>
                {SEDES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('cashier.sale.day')} htmlFor="ly-day" hint={t('cashier.sale.dayHint')}>
              <select id="ly-day" value={date} onChange={(e) => setDate(e.target.value)} className={selectCls}>
                {DEMO_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {f.dayLabel(d, weekdayOf(d))}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">{t('cashier.sale.channel')}</p>
            <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-secondary-100 dark:bg-secondary-800 w-fit" role="group" aria-label={t('cashier.sale.channel')}>
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={channel === c}
                  onClick={() => setChannel(c)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                    channel === c ? 'bg-white dark:bg-secondary-900 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-secondary-600 dark:text-secondary-400'
                  }`}
                >
                  {t(`channels.${c}`)} · ×{f.dec(state.rules.channelMult[c])}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('cashier.sale.lines')}</p>
            {lines.map((l, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <label htmlFor={`ly-cat-${i}`} className="sr-only">
                  {t('cashier.sale.category')}
                </label>
                <select id={`ly-cat-${i}`} value={l.category} onChange={(e) => setLine(i, { category: e.target.value as CategoryKey })} className={`${selectCls} sm:flex-1`}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`categories.${c}`)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 sm:w-56">
                  <label htmlFor={`ly-amount-${i}`} className="sr-only">
                    {t('cashier.sale.amount')}
                  </label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary-500">$</span>
                    <input
                      id={`ly-amount-${i}`}
                      inputMode="numeric"
                      value={l.amount ? f.num(l.amount) : ''}
                      placeholder="0"
                      onChange={(e) => setLine(i, { amount: Math.min(99_999_999, Number(digits(e.target.value) || 0)) })}
                      className={`${inputCls} pl-7 text-right font-mono`}
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                      aria-label={t('cashier.sale.removeLine')}
                      title={t('cashier.sale.removeLine')}
                      className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 text-secondary-500 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {lines.length < 5 && (
              <Button size="sm" variant="ghost" onClick={() => setLines((ls) => [...ls, { category: 'otc', amount: 0 }])}>
                <PlusIcon className="h-4 w-4 mr-1" /> {t('cashier.sale.addLine')}
              </Button>
            )}
          </div>

          <div className="mt-3">
            <Field label={t('cashier.sale.redeem')} htmlFor="ly-redeem" hint={t('cashier.sale.redeemHint')}>
              <select id="ly-redeem" value={redeemSel} disabled={frozen} onChange={(e) => setRedeemSel(e.target.value)} className={selectCls}>
                <option value="">{t('cashier.sale.noRedeem')}</option>
                {REWARDS.filter((r) => r.cat === 'vouchers').map((r) => (
                  <option key={r.id} value={`reward:${r.id}`} disabled={balance < r.pts}>
                    {t('cashier.sale.redeemReward', { name: t(`rewards.items.${r.id}.name`), pts: f.num(r.pts) })}
                    {balance < r.pts ? ` — ${t('cashier.sale.notEnough')}` : ''}
                  </option>
                ))}
                {coupons
                  .filter((c) => c.value > 0)
                  .map((c) => (
                    <option key={c.code} value={`coupon:${c.code}`}>
                      {t('cashier.sale.redeemCoupon', { code: c.code, value: f.money(c.value) })}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          {/* Cálculo en vivo */}
          <div className="mt-4 rounded-xl bg-secondary-50 dark:bg-secondary-800/60 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 mb-2">{t('cashier.sale.calc')}</p>
            <ul className="space-y-1">
              {quote.lines.map((l, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-x-3 text-secondary-700 dark:text-secondary-300">
                  <span>
                    {t(`categories.${l.category}`)} · {f.money(l.net)}
                  </span>
                  <span className="font-mono text-xs sm:text-sm">
                    {l.mult === 0
                      ? t('cashier.sale.noPoints')
                      : t('cashier.sale.lineCalc', { base: f.num(l.base), mult: f.dec(l.mult), points: f.num(l.points) })}
                    {l.dayApplied && <span className="ml-1 text-emerald-600 dark:text-emerald-400">({t('cashier.sale.dayRuleApplied', { day: f.weekday(weekday), days: f.weekdayPlural(weekday) })})</span>}
                  </span>
                </li>
              ))}
              {quote.lines.length === 0 && <li className="text-secondary-500">{t('cashier.sale.empty')}</li>}
            </ul>
            <dl className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-2 gap-y-1">
              <dt className="text-secondary-500">{t('cashier.sale.subtotal')}</dt>
              <dd className="text-right font-mono">{f.money(quote.gross)}</dd>
              {quote.discount > 0 && (
                <>
                  <dt className="text-secondary-500">{t('cashier.sale.discount')}</dt>
                  <dd className="text-right font-mono text-emerald-600">−{f.money(quote.discount)}</dd>
                </>
              )}
              <dt className="font-semibold text-secondary-900 dark:text-white">{t('cashier.sale.total')}</dt>
              <dd className="text-right font-mono font-semibold text-secondary-900 dark:text-white">{f.money(quote.paid)}</dd>
              <dt className="text-secondary-500">{t('cashier.sale.earns')}</dt>
              <dd className="text-right font-mono text-primary-700 dark:text-primary-300">+{f.num(quote.points)}</dd>
              {redeemReward && (
                <>
                  <dt className="text-secondary-500">{t('cashier.sale.uses')}</dt>
                  <dd className="text-right font-mono text-red-600">−{f.num(redeemReward.pts)}</dd>
                </>
              )}
              <dt className="text-secondary-500">{t('cashier.sale.balanceAfter')}</dt>
              <dd className="text-right font-mono">{f.num(balanceAfter)}</dd>
            </dl>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={submitSale} disabled={quote.gross <= 0}>
              <ShoppingCartIcon className="h-5 w-5 mr-1" /> {t('cashier.sale.submit', { name: activeMember.name.split(' ')[0] })}
            </Button>
            <span className="text-xs text-secondary-500">{t('cashier.sale.rule', { base: f.money(state.rules.baseAmount) })}</span>
          </div>

          {lastSale && <SaleResult sale={lastSale.sale} alerts={lastSale.alerts} onOpenMember={onOpenMember} />}
        </Card>
      </div>

      {/* Ventas de la sesión */}
      <Card>
        <SectionTitle title={t('cashier.history.title')} subtitle={t('cashier.history.subtitle')} />
        {sessionSales.length === 0 ? (
          <p className="mt-4 text-sm text-secondary-500">{t('cashier.history.empty')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs uppercase text-secondary-500 border-b border-secondary-200 dark:border-secondary-800">
                  <th className="text-left py-2 pr-2">{t('cashier.history.sale')}</th>
                  <th className="text-left py-2 pr-2">{t('cashier.history.when')}</th>
                  <th className="text-left py-2 pr-2">{t('cashier.history.member')}</th>
                  <th className="text-right py-2 pr-2">{t('cashier.history.paid')}</th>
                  <th className="text-right py-2 pr-2">{t('cashier.history.points')}</th>
                  <th className="text-right py-2">{t('cashier.history.action')}</th>
                </tr>
              </thead>
              <tbody>
                {sessionSales.map((s) => (
                  <tr key={s.id} className="border-b border-secondary-100 dark:border-secondary-800/50">
                    <td className="py-2 pr-2 font-mono text-xs">{s.id}</td>
                    <td className="py-2 pr-2 text-xs text-secondary-600 dark:text-secondary-300">
                      {f.date(s.date)} {s.time} · {SEDES.find((x) => x.id === s.sede)?.name.split(' · ')[0]}
                    </td>
                    <td className="py-2 pr-2">{memberName(s.memberId)}</td>
                    <td className="py-2 pr-2 text-right font-mono">{f.money(s.paid)}</td>
                    <td className={`py-2 pr-2 text-right font-mono ${s.reversed ? 'line-through text-secondary-400' : 'text-primary-700 dark:text-primary-300'}`}>
                      +{f.num(s.points)}
                      {s.redeemedPoints > 0 && <span className="text-red-600"> / −{f.num(s.redeemedPoints)}</span>}
                    </td>
                    <td className="py-2 text-right">
                      {s.reversed ? (
                        <Badge variant="default" size="sm">
                          {t('cashier.history.reversed')}
                        </Badge>
                      ) : confirmReverse === s.id ? (
                        <span className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              store.reverseSale(s.id, s.date, nowTime());
                              setConfirmReverse(null);
                              notify(t('cashier.history.reversedToast', { id: s.id }));
                            }}
                          >
                            {t('cashier.history.confirm')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmReverse(null)}>
                            {t('common.cancel')}
                          </Button>
                        </span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setConfirmReverse(s.id)}>
                          <ArrowUturnLeftIcon className="h-4 w-4 mr-1" /> {t('cashier.history.reverse')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {enrollOpen && (
        <EnrollModal
          initial={digits(query)}
          sede={sede}
          date={date}
          onClose={() => setEnrollOpen(false)}
          onDone={(m) => {
            setEnrollOpen(false);
            setSearched(null);
            setQuery('');
            setLastSale(null);
            notify(t('cashier.enroll.toast', { name: m.name, points: f.num(state.rules.welcomeBonus) }));
          }}
        />
      )}
    </div>
  );
}

function SaleResult({ sale, alerts, onOpenMember }: { sale: Sale; alerts: number; onOpenMember: () => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const { state } = useLoyalty();
  const member = state.members.find((m) => m.id === sale.memberId);
  const first = member?.name.split(' ')[0] ?? '';
  const sedeName = SEDES.find((s) => s.id === sale.sede)?.name ?? '';
  const upgraded = sale.tierAfter !== sale.tierBefore;
  return (
    <div className="mt-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4" role="status">
      <p className="font-semibold text-emerald-800 dark:text-emerald-200">
        {t('cashier.result.title', { id: sale.id, points: f.num(sale.points) })}
      </p>
      <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
        {f.date(sale.date)} {sale.time} · {sedeName} · {t(`channels.${sale.channel}`)} · {t('cashier.result.paid', { amount: f.money(sale.paid) })}
      </p>
      {upgraded && (
        <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
          {t('cashier.result.upgraded', { name: first, tier: t(`tiers.${sale.tierAfter}`) })}
        </p>
      )}
      {alerts > 0 && (
        <p className="mt-2 text-sm text-red-700 dark:text-red-300 flex items-start gap-1.5">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" /> {t('cashier.result.fraud')}
        </p>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">{t('cashier.result.whatsappTitle')}</p>
        {sale.whatsapp ? (
          <div className="max-w-sm rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/60 text-secondary-900 dark:text-emerald-50 px-3 py-2 text-sm shadow-sm">
            {t('cashier.result.whatsapp', {
              name: first,
              points: f.num(sale.points),
              club: CLUB.club,
              amount: f.money(sale.paid),
              balance: f.num(sale.balanceAfter),
            })}
            <span className="block text-right text-[10px] opacity-60 mt-1">{sale.time}</span>
          </div>
        ) : (
          <p className="text-xs text-secondary-600 dark:text-secondary-400">{t('cashier.result.noWhatsapp')}</p>
        )}
        <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('cashier.result.whatsappNote')}</p>
      </div>
      <Button size="sm" variant="outline" className="mt-3" onClick={onOpenMember}>
        <UserIcon className="h-4 w-4 mr-1" /> {t('cashier.result.openApp', { name: first })} <ArrowRightIcon className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

function EnrollModal({ initial, sede, date, onClose, onDone }: { initial: string; sede: SedeKey; date: string; onClose: () => void; onDone: (m: Member) => void }) {
  const t = useTranslations('demoLoyalty');
  const { enroll } = useLoyalty();
  const isPhone = /^3\d{9}$/.test(initial);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState(isPhone ? '' : initial);
  const [phone, setPhone] = useState(isPhone ? initial : '');
  const [email, setEmail] = useState('');
  const [birthMonth, setBirthMonth] = useState(0);
  const [referrer, setReferrer] = useState('');
  const [sedeSel, setSedeSel] = useState<SedeKey>(sede);
  const [consent, setConsent] = useState(false);
  const [optIn, setOptIn] = useState(true);
  const [errors, setErrors] = useState<EnrollError[]>([]);

  const err = (k: EnrollError) => (errors.includes(k) ? t(`cashier.enroll.errors.${k}`) : undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = enroll({ name, cedula, phone, email, birthMonth, referrerPhone: referrer, whatsappOptIn: optIn, consent, sede: sedeSel, date, time: nowTime() });
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    onDone(res.member);
  };

  return (
    <Modal title={t('cashier.enroll.title')} subtitle={t('cashier.enroll.subtitle', { club: CLUB.club })} onClose={onClose} labelId="ly-enroll-title" size="lg">
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('cashier.enroll.name')} htmlFor="en-name" error={err('name')}>
            <input id="en-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="off" placeholder={t('cashier.enroll.namePh')} />
          </Field>
          <Field label={t('cashier.enroll.cedula')} htmlFor="en-cedula" error={err('cedula') ?? err('duplicateCedula')}>
            <input id="en-cedula" inputMode="numeric" value={cedula} onChange={(e) => setCedula(digits(e.target.value).slice(0, 10))} className={inputCls} placeholder="1023456789" />
          </Field>
          <Field label={t('cashier.enroll.phone')} htmlFor="en-phone" error={err('phone') ?? err('duplicatePhone')}>
            <input id="en-phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(digits(e.target.value).slice(0, 10))} className={inputCls} placeholder="3005550100" />
          </Field>
          <Field label={t('cashier.enroll.email')} htmlFor="en-email" error={err('email')}>
            <input id="en-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={t('cashier.enroll.emailPh')} />
          </Field>
          <Field label={t('cashier.enroll.birthMonth')} htmlFor="en-birth">
            <select id="en-birth" value={birthMonth} onChange={(e) => setBirthMonth(Number(e.target.value))} className={selectCls}>
              <option value={0}>{t('cashier.enroll.noBirth')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {t(`monthsLong.${m}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('cashier.enroll.sede')} htmlFor="en-sede">
            <select id="en-sede" value={sedeSel} onChange={(e) => setSedeSel(e.target.value as SedeKey)} className={selectCls}>
              {SEDES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('cashier.enroll.referrer')} htmlFor="en-ref" error={err('referrerNotFound')} hint={t('cashier.enroll.referrerHint')}>
              <input id="en-ref" inputMode="numeric" value={referrer} onChange={(e) => setReferrer(digits(e.target.value).slice(0, 10))} className={inputCls} placeholder="3005550142" />
            </Field>
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${errors.includes('consent') ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-secondary-200 dark:border-secondary-700'}`}>
          <label className="flex items-start gap-2 text-sm text-secondary-800 dark:text-secondary-200">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary-600" />
            <span>{t('cashier.enroll.consent', { brand: CLUB.brand })}</span>
          </label>
          {errors.includes('consent') && <p className="mt-1 text-xs text-red-600">{t('cashier.enroll.errors.consent')}</p>}
          <label className="mt-2 flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1 h-4 w-4 accent-primary-600" />
            <span>{t('cashier.enroll.optIn')}</span>
          </label>
        </div>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('cashier.enroll.legalNote')}</p>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            <UserPlusIcon className="h-4 w-4 mr-1" /> {t('cashier.enroll.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
