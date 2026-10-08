'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { DEMO_BANKS, DEMO_PERIOD, PLANS, VENDOR } from '../lib/data';
import { addDays } from '../lib/format';
import {
  canCharge, checkPlanChange, dunningDate, expiryOk, isEmail, luhnOk, mobileOk, paidCurrentPeriod, trialDaysLeft, usage, withIva, DUNNING_DAYS,
  type PlanChangeCheck,
} from '../lib/logic';
import { useFmt } from '../lib/useFmt';
import type { PayMethod, PlanId, Tenant } from '../lib/types';
import { PAY_METHODS, PLAN_IDS } from '../lib/types';
import InvoiceModal from './InvoiceModal';
import { FieldError, Panel, ProgressBar, ScreenHeader, SimNote, StatusBadge, TenantSelect, inputCls, selectCls } from './ui';

type Phase = 'form' | 'processing' | 'bank' | 'push' | 'approved' | 'rejected';

export default function Billing() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, select } = useDemo();
  const tenant = s.tenants.find((x) => x.id === s.selected.billing && x.status !== 'cancelado') ?? s.tenants.find((x) => x.status !== 'cancelado');
  const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);

  if (!tenant) return null;
  const tenantInvoices = s.invoices.filter((i) => i.tenantId === tenant.id).slice().reverse();

  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.billing.title')} subtitle={t('screens.billing.subtitle')} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-900">
        <TenantSelect id="billing-tenant" label={t('common.tenant')} value={tenant.id} onChange={(id) => select('billing', id)} />
        <StatusBadge status={tenant.status} />
        {tenant.status === 'prueba' && <span className="text-xs text-secondary-500">{t('dashboard.trialLeft', { days: trialDaysLeft(tenant) })}</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Checkout key={tenant.id} tenant={tenant} onOpenInvoice={setInvoiceOpen} />
        <div className="space-y-5">
          <PlanChanger tenant={tenant} />
          <Panel title={t('billing.usageTitle')} subtitle={t('billing.usageSubtitle', { plan: t(`plans.${tenant.plan}.name`) })}>
            <div className="space-y-3">
              {usage(s, tenant).map((u) => (
                <div key={u.key}>
                  <div className="mb-1 flex justify-between text-xs text-secondary-600 dark:text-secondary-300">
                    <span>{t(`usage.${u.key}`)}</span>
                    <span className="font-mono">{f.num(u.value, u.key === 'storage' ? 1 : 0)}{u.unit} / {f.num(u.max)}{u.unit}</span>
                  </div>
                  <ProgressBar value={u.value} max={u.max} />
                  {u.value / u.max >= 0.75 && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">{t('billing.nearLimit')}</p>}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title={t('billing.invoicesTitle', { tenant: tenant.name })}>
        {tenantInvoices.length === 0 ? (
          <p className="text-sm text-secondary-500">{t('billing.noInvoices')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 text-left text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-700">
                  <th className="py-2 pr-3 font-semibold">{t('invoice.number')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('invoice.period')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('billing.concept')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('invoice.method')}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{t('invoice.total')}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {tenantInvoices.map((i) => (
                  <tr key={i.id} className="border-b border-secondary-100 last:border-0 dark:border-secondary-800">
                    <td className="py-2 pr-3 font-mono text-xs text-secondary-900 dark:text-white">{i.number}</td>
                    <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300">{f.period(i.period)}</td>
                    <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300">{t(`billing.concepts.${i.concept}`)}</td>
                    <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300">{t(`methods.${i.method}`)}</td>
                    <td className="py-2 pr-3 text-right font-medium text-secondary-900 dark:text-white">{f.money(i.total)}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => setInvoiceOpen(i.id)} className="text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">
                        {t('billing.viewInvoice')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dunning />
      <InvoiceModal invoiceId={invoiceOpen} onClose={() => setInvoiceOpen(null)} />
    </div>
  );
}

function Checkout({ tenant, onOpenInvoice }: { tenant: Tenant; onOpenInvoice: (id: string) => void }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, pay, logRejected } = useDemo();
  const [method, setMethod] = useState<PayMethod>('pse');
  const [phase, setPhase] = useState<Phase>('form');
  const [showErrors, setShowErrors] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', holder: '' });
  const [pse, setPse] = useState({ person: 'juridica', bank: '', email: tenant.email });
  const [phone, setPhone] = useState('');
  const [paidId, setPaidId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const ref = timer;
    return () => {
      if (ref.current) window.clearTimeout(ref.current);
    };
  }, []);

  const gross = PLANS[tenant.plan].price;
  const discount = Math.min(gross, tenant.credit ?? 0);
  const amounts = withIva(gross - discount);
  const alreadyPaid = paidCurrentPeriod(s, tenant.id);
  const lastPaid = [...s.invoices].reverse().find((i) => i.tenantId === tenant.id && i.period === DEMO_PERIOD && i.concept === 'subscription');

  const errors = {
    number: method === 'tarjeta' && !luhnOk(card.number) ? t('billing.errors.card') : null,
    expiry: method === 'tarjeta' && !expiryOk(card.expiry) ? t('billing.errors.expiry') : null,
    cvc: method === 'tarjeta' && !/^\d{3,4}$/.test(card.cvc) ? t('billing.errors.cvc') : null,
    holder: method === 'tarjeta' && card.holder.trim().length < 3 ? t('billing.errors.holder') : null,
    bank: method === 'pse' && !pse.bank ? t('billing.errors.bank') : null,
    pseEmail: method === 'pse' && !isEmail(pse.email) ? t('billing.errors.email') : null,
    phone: method === 'nequi' && !mobileOk(phone) ? t('billing.errors.phone') : null,
  };
  const valid = Object.values(errors).every((e) => !e);

  const settle = () => {
    const id = pay(tenant.id, method);
    setPaidId(id);
    setPhase(id ? 'approved' : 'form');
  };
  const approve = () => {
    setPhase('processing');
    timer.current = window.setTimeout(settle, 900);
  };
  const reject = () => {
    logRejected(tenant.id, method);
    setPhase('rejected');
  };

  const submit = () => {
    if (!valid) return setShowErrors(true);
    setShowErrors(false);
    if (method === 'tarjeta') {
      setPhase('processing');
      timer.current = window.setTimeout(() => {
        if (card.number.replace(/\D/g, '').endsWith('0002')) {
          logRejected(tenant.id, 'tarjeta');
          setPhase('rejected');
        } else {
          settle();
        }
      }, 900);
    } else if (method === 'pse') setPhase('bank');
    else setPhase('push');
  };

  const methodLabel = t(`methods.${method}`);

  return (
    <Panel title={t('billing.checkoutTitle')} subtitle={t('billing.checkoutSubtitle', { period: f.period(DEMO_PERIOD) })}>
      {!canCharge(s, tenant) && alreadyPaid && phase !== 'approved' ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          <div className="font-semibold">{t('billing.upToDate')}</div>
          <p className="mt-0.5 text-xs">{t('billing.upToDateText', { number: lastPaid?.number ?? '', next: f.date(addDays(`${DEMO_PERIOD}-01`, 31)) })}</p>
          {lastPaid && (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => onOpenInvoice(lastPaid.id)}>{t('billing.viewInvoice')}</Button>
          )}
        </div>
      ) : phase === 'approved' && paidId ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-600" />
            <div className="min-w-0 text-sm text-emerald-900 dark:text-emerald-100">
              <div className="font-semibold">{t('billing.approved')}</div>
              <p className="mt-0.5 break-words text-xs">{t('billing.approvedText', { number: s.invoices.find((i) => i.id === paidId)?.number ?? '', email: tenant.email })}</p>
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={() => onOpenInvoice(paidId)}>{t('billing.viewInvoice')}</Button>
        </div>
      ) : (
        <>
          <dl className="mb-4 space-y-1 rounded-lg bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
            <div className="flex justify-between gap-2"><dt className="text-secondary-600 dark:text-secondary-300">{t('billing.planLine', { plan: t(`plans.${tenant.plan}.name`) })}</dt><dd>{f.money(gross)}</dd></div>
            {discount > 0 && <div className="flex justify-between gap-2"><dt className="text-secondary-600 dark:text-secondary-300">{t('invoice.discount')}</dt><dd>-{f.money(discount)}</dd></div>}
            <div className="flex justify-between gap-2"><dt className="text-secondary-600 dark:text-secondary-300">{t('invoice.iva')}</dt><dd>{f.money(amounts.iva)}</dd></div>
            <div className="flex justify-between gap-2 border-t border-secondary-200 pt-1 font-semibold text-secondary-900 dark:border-secondary-700 dark:text-white"><dt>{t('invoice.total')}</dt><dd>{f.money(amounts.total)}</dd></div>
          </dl>

          {phase === 'form' || phase === 'processing' ? (
            <>
              <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-secondary-100 p-1 dark:bg-secondary-800" role="tablist" aria-label={t('billing.methodLabel')}>
                {PAY_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={method === m}
                    onClick={() => { setMethod(m); setShowErrors(false); }}
                    className={`rounded-md px-2 py-1.5 text-sm font-medium ${method === m ? 'bg-white text-secondary-900 shadow-sm dark:bg-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}
                  >
                    {t(`methods.${m}`)}
                  </button>
                ))}
              </div>

              {method === 'tarjeta' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="co-card" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.card.number')}</label>
                    <input id="co-card" inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 23) })} placeholder="4242 4242 4242 4242" className={inputCls} />
                    <p className="mt-1 text-[11px] text-secondary-500">{t('billing.card.hint')}</p>
                    <FieldError msg={showErrors ? errors.number : null} />
                  </div>
                  <div>
                    <label htmlFor="co-exp" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.card.expiry')}</label>
                    <input id="co-exp" autoComplete="off" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 7) })} placeholder="MM/AA" className={inputCls} />
                    <FieldError msg={showErrors ? errors.expiry : null} />
                  </div>
                  <div>
                    <label htmlFor="co-cvc" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">CVC</label>
                    <input id="co-cvc" inputMode="numeric" autoComplete="off" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" className={inputCls} />
                    <FieldError msg={showErrors ? errors.cvc : null} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="co-holder" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.card.holder')}</label>
                    <input id="co-holder" autoComplete="off" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value.slice(0, 60) })} className={inputCls} />
                    <FieldError msg={showErrors ? errors.holder : null} />
                  </div>
                </div>
              )}

              {method === 'pse' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="co-person" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.pse.person')}</label>
                    <select id="co-person" value={pse.person} onChange={(e) => setPse({ ...pse, person: e.target.value })} className={`${selectCls} w-full`}>
                      <option value="juridica">{t('billing.pse.juridica')}</option>
                      <option value="natural">{t('billing.pse.natural')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="co-bank" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.pse.bank')}</label>
                    <select id="co-bank" value={pse.bank} onChange={(e) => setPse({ ...pse, bank: e.target.value })} className={`${selectCls} w-full`}>
                      <option value="">{t('billing.pse.chooseBank')}</option>
                      {DEMO_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <FieldError msg={showErrors ? errors.bank : null} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="co-pse-email" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.pse.email')}</label>
                    <input id="co-pse-email" type="email" value={pse.email} onChange={(e) => setPse({ ...pse, email: e.target.value })} className={inputCls} />
                    <FieldError msg={showErrors ? errors.pseEmail : null} />
                  </div>
                </div>
              )}

              {method === 'nequi' && (
                <div>
                  <label htmlFor="co-phone" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('billing.nequi.phone')}</label>
                  <input id="co-phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))} placeholder="300 123 4567" className={inputCls} />
                  <FieldError msg={showErrors ? errors.phone : null} />
                </div>
              )}

              <Button className="mt-4" fullWidth onClick={submit} isLoading={phase === 'processing'} disabled={phase === 'processing'}>
                {phase === 'processing' ? t('billing.processing') : t('billing.pay', { amount: f.money(amounts.total), method: methodLabel })}
              </Button>
            </>
          ) : phase === 'bank' ? (
            <div className="rounded-lg border-2 border-dashed border-secondary-300 p-4 text-sm dark:border-secondary-600">
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('billing.pse.bankScreen')}</div>
              <p className="mt-1 text-secondary-800 dark:text-secondary-100">{t('billing.pse.bankText', { bank: pse.bank, amount: f.money(amounts.total), vendor: VENDOR.name })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={approve}>{t('billing.pse.approve')}</Button>
                <Button size="sm" variant="outline" onClick={reject}>{t('billing.pse.reject')}</Button>
              </div>
            </div>
          ) : phase === 'push' ? (
            <div className="rounded-lg border-2 border-dashed border-secondary-300 p-4 text-sm dark:border-secondary-600">
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('billing.nequi.pushTitle')}</div>
              <p className="mt-1 text-secondary-800 dark:text-secondary-100">{t('billing.nequi.pushText', { phone: phone.replace(/\D/g, ''), amount: f.money(amounts.total) })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={approve}>{t('billing.nequi.accept')}</Button>
                <Button size="sm" variant="outline" onClick={reject}>{t('billing.nequi.reject')}</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100">
              <div className="flex items-center gap-2 font-semibold"><ExclamationTriangleIcon className="h-5 w-5" />{t('billing.rejected')}</div>
              <p className="mt-0.5 text-xs">{t('billing.rejectedText')}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setPhase('form')}>{t('billing.tryAgain')}</Button>
            </div>
          )}
        </>
      )}
      <SimNote>{t('billing.simNote')}</SimNote>
    </Panel>
  );
}

function PlanChanger({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, changePlan } = useDemo();
  const [target, setTarget] = useState<PlanId | null>(null);
  const check: PlanChangeCheck | null = target ? checkPlanChange(s, tenant, target) : null;

  return (
    <Panel title={t('billing.plansTitle')} subtitle={t('billing.plansSubtitle')}>
      <div className="grid gap-2 sm:grid-cols-3">
        {PLAN_IDS.map((p) => {
          const current = tenant.plan === p;
          return (
            <div key={p} className={`rounded-lg border p-3 ${current ? 'border-primary-500 ring-1 ring-primary-500' : 'border-secondary-200 dark:border-secondary-700'}`}>
              <div className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`plans.${p}.name`)}</div>
              <div className="text-sm font-bold text-secondary-900 dark:text-white">{f.money(PLANS[p].price)}</div>
              <div className="text-[11px] text-secondary-500">{t('common.plusIvaMonth')}</div>
              <div className="mt-1 text-[11px] text-secondary-600 dark:text-secondary-400">{t('plans.limits', { units: f.num(PLANS[p].maxUnits), staff: PLANS[p].maxStaff, storage: PLANS[p].storageGb })}</div>
              <div className="mt-1 text-[11px] text-secondary-600 dark:text-secondary-400">{PLANS[p].modules.map((m) => t(`modules.${m}.name`)).join(' · ')}</div>
              {current ? (
                <span className="mt-2 inline-block text-xs font-semibold text-primary-700 dark:text-primary-300">{t('billing.currentPlan')}</span>
              ) : (
                <button type="button" onClick={() => setTarget(p)} className="mt-2 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">
                  {t('billing.switchTo')}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {target && check && (
        <div className="mt-3 rounded-lg bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
          {check.ok ? (
            <>
              <p className="text-secondary-800 dark:text-secondary-100">
                {check.kind === 'trial'
                  ? t('billing.change.trial', { plan: t(`plans.${target}.name`) })
                  : check.kind === 'upgrade'
                    ? t('billing.change.upgrade', { plan: t(`plans.${target}.name`), days: check.days, amount: f.money(check.amount), total: f.money(withIva(check.amount).total) })
                    : t('billing.change.downgrade', { plan: t(`plans.${target}.name`), days: check.days, amount: f.money(check.amount) })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { changePlan(tenant.id, target); setTarget(null); }}>{t('billing.change.confirm')}</Button>
                <Button size="sm" variant="ghost" onClick={() => setTarget(null)}>{t('common.cancel')}</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-red-700 dark:text-red-300">{t(`billing.change.errors.${check.reason}`)}</p>
              <Button size="sm" variant="ghost" onClick={() => setTarget(null)}>{t('common.close')}</Button>
            </div>
          )}
        </div>
      )}
      {(tenant.credit ?? 0) > 0 && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{t('billing.creditNote', { amount: f.money(tenant.credit ?? 0) })}</p>}
    </Panel>
  );
}

function Dunning() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, advanceDunning, simulateFailure, select } = useDemo();
  const [openMsg, setOpenMsg] = useState<string | null>(null);
  const trials = s.tenants.filter((x) => x.status === 'prueba');
  const [trialPick, setTrialPick] = useState('');
  const pick = trials.find((x) => x.id === trialPick)?.id ?? trials[0]?.id ?? '';

  return (
    <Panel title={t('billing.dunning.title')} subtitle={t('billing.dunning.subtitle')}>
      {s.dunning.length === 0 && <p className="mb-3 text-sm text-secondary-500">{t('billing.dunning.empty')}</p>}
      <div className="space-y-4">
        {s.dunning.map((d) => {
          const tn = s.tenants.find((x) => x.id === d.tenantId);
          if (!tn) return null;
          const amount = withIva(PLANS[tn.plan].price).total;
          return (
            <div key={d.tenantId} className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-secondary-900 dark:text-white">{tn.name}</div>
                  <div className="text-xs text-secondary-500">{t('billing.dunning.amount', { amount: f.money(amount), period: f.period(d.period) })}</div>
                </div>
                <StatusBadge status={tn.status} />
              </div>
              <ol className="mt-3 grid gap-2 sm:grid-cols-4">
                {DUNNING_DAYS.map((day, i) => {
                  const reached = i <= d.stage;
                  const key = `${d.tenantId}-${i}`;
                  return (
                    <li key={i} className={`rounded-md border p-2 text-xs ${reached ? (i === 3 ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30') : 'border-secondary-200 dark:border-secondary-700'}`}>
                      <div className="font-semibold text-secondary-900 dark:text-white">{t('billing.dunning.day', { day })} · {f.date(dunningDate(d.startedAt, i))}</div>
                      <div className="text-secondary-600 dark:text-secondary-300">{t(`billing.dunning.steps.${i}`)}</div>
                      <div className="mt-1 text-[11px] text-secondary-500">{reached ? t('billing.dunning.sent') : t('billing.dunning.scheduled')}</div>
                      {i < 3 && (
                        <button type="button" aria-expanded={openMsg === key} onClick={() => setOpenMsg(openMsg === key ? null : key)} className="mt-1 text-[11px] font-medium text-primary-700 hover:underline dark:text-primary-300">
                          {openMsg === key ? t('billing.dunning.hideMsg') : t('billing.dunning.showMsg')}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
              {DUNNING_DAYS.slice(0, 3).map((_, i) =>
                openMsg === `${d.tenantId}-${i}` ? (
                  <div key={i} className="mt-2 grid gap-2 md:grid-cols-2">
                    <div className="rounded-md bg-secondary-50 p-2 text-xs dark:bg-secondary-800/60">
                      <div className="mb-1 flex items-center gap-1 font-semibold text-secondary-700 dark:text-secondary-200"><EnvelopeIcon className="h-4 w-4" />{t('billing.dunning.emailTo', { email: tn.email })}</div>
                      <p className="whitespace-pre-line text-secondary-700 dark:text-secondary-300">{t(`billing.dunning.msgs.${i}`, { tenant: tn.name, amount: f.money(amount), vendor: VENDOR.product, date: f.date(dunningDate(d.startedAt, 3)) })}</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-2 text-xs dark:bg-emerald-950/30">
                      <div className="mb-1 flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-200"><ChatBubbleLeftRightIcon className="h-4 w-4" />{t('billing.dunning.whatsapp')}</div>
                      <p className="text-emerald-900 dark:text-emerald-100">{t(`billing.dunning.wa.${i}`, { tenant: tn.name, amount: f.money(amount), vendor: VENDOR.product })}</p>
                    </div>
                  </div>
                ) : null,
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {d.stage < 3 && (
                  <Button size="sm" variant="outline" onClick={() => advanceDunning(d.tenantId)}>{t('billing.dunning.advance')}</Button>
                )}
                <Button size="sm" onClick={() => { select('billing', d.tenantId); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('billing.dunning.collect')}</Button>
              </div>
            </div>
          );
        })}
      </div>
      {trials.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-secondary-200 pt-3 dark:border-secondary-700 sm:flex-row sm:items-center">
          <label htmlFor="fail-pick" className="text-xs text-secondary-600 dark:text-secondary-300">{t('billing.dunning.simulateLabel')}</label>
          <select id="fail-pick" value={pick} onChange={(e) => setTrialPick(e.target.value)} className={`${selectCls} min-w-0`}>
            {trials.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => pick && simulateFailure(pick)}>{t('billing.dunning.simulate')}</Button>
        </div>
      )}
      <SimNote>{t('billing.dunning.simNote')}</SimNote>
    </Panel>
  );
}
