'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { InboxArrowDownIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CLAIM_REASONS, type ClaimReason, type IncomingInvoice, type RadianCode } from './data';
import { claimDeadline, formatDate, incomingIva, incomingStage, incomingTotal, isAddressedTo, isPendingStage, type IncomingStage } from './docs';
import { colombiaNow, formatCOP, formatNit, nitDv } from './fiscal';
import { inputCls, Pill, SectionTitle, useMonths } from './ui';
import type { BillingStore } from './useBillingStore';

const STAGE_VARIANT: Record<IncomingStage, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  new: 'warning',
  acknowledged: 'info',
  received: 'info',
  accepted: 'success',
  tacit: 'success',
  claimed: 'danger',
  returned: 'default',
};

export function ReceptionPanel({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, today, addRadianEvent, returnIncoming } = store;
  const [claiming, setClaiming] = useState<string | null>(null);
  const [reason, setReason] = useState<ClaimReason>('01');
  // Tras registrar un evento, el botón pulsado desaparece: el foco pasa a la siguiente
  // acción de la misma factura (o a la factura) para no perder el lugar con el teclado.
  const focusAfter = useRef<string | null>(null);
  useEffect(() => {
    const id = focusAfter.current;
    if (!id) return;
    focusAfter.current = null;
    const card = document.getElementById(`fe-in-${id}`);
    const next = card?.querySelector<HTMLButtonElement>('[data-radian-action]:not([disabled])');
    (next || card)?.focus();
  }, [state.incoming]);

  const stages = state.incoming.map((i) => incomingStage(i, today));
  const pending = stages.filter(isPendingStage).length;
  const accepted = stages.filter((s) => s === 'accepted' || s === 'tacit').length;
  const closedOther = stages.filter((s) => s === 'claimed' || s === 'returned').length;

  const register = (inv: IncomingInvoice, code: RadianCode, why?: ClaimReason) => {
    focusAfter.current = inv.id;
    addRadianEvent(inv.id, { code, date: colombiaNow().date, reason: why });
    toast.success(t('reception.eventDone', { code, name: t(`reception.events.${code}`), number: inv.number }));
    setClaiming(null);
  };

  const giveBack = (inv: IncomingInvoice) => {
    focusAfter.current = inv.id;
    returnIncoming(inv.id, colombiaNow().date);
    toast.success(t('reception.returnDone', { number: inv.number, supplier: inv.supplier.name }));
  };

  return (
    <Card variant="bordered" padding="md" id="recepcion" className="scroll-mt-24">
      <SectionTitle
        icon={<InboxArrowDownIcon className="w-5 h-5" />}
        title={t('reception.title')}
        subtitle={t('reception.subtitle')}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: t('reception.stats.pending'), value: pending, cls: 'text-amber-600 dark:text-amber-400' },
          { label: t('reception.stats.accepted'), value: accepted, cls: 'text-green-600 dark:text-green-400' },
          { label: t('reception.stats.claimed'), value: closedOther, cls: 'text-red-600 dark:text-red-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-3 bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{s.label}</p>
            <p className={'text-2xl font-bold tabular-nums ' + s.cls}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {state.incoming.map((inv, idx) => {
          const stage = stages[idx];
          const addressed = isAddressedTo(inv, state.issuer.nit);
          const nitOk = nitDv(inv.supplier.nit) === inv.supplier.dv;
          const cufeOk = /^[0-9a-f]{96}$/.test(inv.cufe);
          const duplicate = state.incoming.some((o) => o.id !== inv.id && o.number === inv.number && o.supplier.nit === inv.supplier.nit);
          const deadline = claimDeadline(inv, today);
          const has = (c: RadianCode) => inv.events.some((e) => e.code === c);
          return (
            <div
              key={inv.id}
              id={`fe-in-${inv.id}`}
              tabIndex={-1}
              aria-label={`${inv.supplier.name} · ${t('reception.invoice', { number: inv.number })}`}
              className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-secondary-900 dark:text-white">{inv.supplier.name}</p>
                    <span className="text-xs text-secondary-500">NIT {formatNit(inv.supplier.nit, inv.supplier.dv)}</span>
                    <Badge variant={STAGE_VARIANT[stage]} size="sm">
                      {t(`reception.stage.${stage}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-700 dark:text-secondary-200 mt-0.5">
                    {t('reception.invoice', { number: inv.number })} · {inv.concept}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {t('reception.dates', { issued: formatDate(inv.issueDate, months), received: formatDate(inv.receivedDate, months) })} ·{' '}
                    {t('reception.amounts', { base: formatCOP(inv.base), iva: formatCOP(incomingIva(inv)), total: formatCOP(incomingTotal(inv)) })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill ok={cufeOk}>{t('reception.checks.cufe')}</Pill>
                    <Pill ok={nitOk}>{t('reception.checks.nit')}</Pill>
                    <Pill ok={addressed}>
                      {addressed ? t('reception.checks.addressed') : t('reception.checks.notAddressed', { nit: formatNit(inv.buyerNit) })}
                    </Pill>
                    <Pill ok={!duplicate}>{t('reception.checks.notDuplicate')}</Pill>
                  </div>
                  {inv.events.length > 0 && (
                    <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-secondary-600 dark:text-secondary-300">
                      {inv.events.map((e) => (
                        <li key={e.code}>
                          ✓ {e.code} {t(`reception.events.${e.code}`)} · {formatDate(e.date, months)}
                          {e.reason ? ` · ${t(`reception.claimReasons.${e.reason}`)}` : ''}
                        </li>
                      ))}
                    </ol>
                  )}
                  {stage === 'received' && deadline && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {deadline.daysLeft > 0
                        ? t('reception.deadline', { date: formatDate(deadline.deadline, months), n: deadline.daysLeft })
                        : t('reception.deadlineToday', { date: formatDate(deadline.deadline, months) })}
                    </p>
                  )}
                  {stage === 'tacit' && deadline && !has('034') && (
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      {t('reception.tacitNote', { date: formatDate(deadline.deadline, months) })}
                    </p>
                  )}
                  {!addressed && stage !== 'returned' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t('reception.notAddressedHelp')}</p>}
                  {stage === 'returned' && inv.returnedDate && (
                    <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('reception.returnedNote', { date: formatDate(inv.returnedDate, months) })}</p>
                  )}
                  {inv.cufe && <p className="mt-1 text-[10px] font-mono text-secondary-400 break-all">CUFE {inv.cufe}</p>}
                </div>
                <div className="flex flex-wrap md:flex-col gap-2 md:items-end md:w-56 flex-shrink-0">
                  {!addressed && stage !== 'returned' && (
                    <Button data-radian-action size="sm" variant="outline" onClick={() => giveBack(inv)}>
                      {t('reception.actions.giveBack')}
                    </Button>
                  )}
                  {addressed && !has('030') && (
                    <Button data-radian-action size="sm" variant="outline" onClick={() => register(inv, '030')}>
                      {t('reception.actions.ack')}
                    </Button>
                  )}
                  {addressed && has('030') && !has('032') && stage !== 'claimed' && (
                    <Button data-radian-action size="sm" variant="outline" onClick={() => register(inv, '032')}>
                      {t('reception.actions.receive')}
                    </Button>
                  )}
                  {addressed && stage === 'received' && (
                    <>
                      <Button data-radian-action size="sm" onClick={() => register(inv, '033')}>
                        {t('reception.actions.accept')}
                      </Button>
                      <Button size="sm" variant="danger" aria-expanded={claiming === inv.id} onClick={() => setClaiming(claiming === inv.id ? null : inv.id)}>
                        {t('reception.actions.claim')}
                      </Button>
                    </>
                  )}
                  {(stage === 'accepted' || stage === 'tacit' || stage === 'claimed' || stage === 'returned') && (
                    <p className="text-xs text-secondary-500 md:text-right">{t('reception.closed')}</p>
                  )}
                </div>
              </div>
              {claiming === inv.id && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                  <div className="flex-1">
                    <label htmlFor={`claim-${inv.id}`} className="block text-xs font-medium text-secondary-700 dark:text-secondary-200 mb-1">
                      {t('reception.claimReason')}
                    </label>
                    <select id={`claim-${inv.id}`} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value as ClaimReason)}>
                      {CLAIM_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {t(`reception.claimReasons.${r}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setClaiming(null)}>
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => register(inv, '031', reason)}>
                      {t('reception.claimConfirm')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-secondary-500 dark:text-secondary-400">{t('reception.note')}</p>
    </Card>
  );
}
