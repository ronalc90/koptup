'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import { useHr } from '../lib/store';
import { vacationBalance } from '../lib/selectors';
import type { Leave } from '../lib/types';
import { Field, Modal, btn, inputCls, useFmt, usePos } from './ui';

const REASONS = ['peak', 'overlap', 'balance', 'other'] as const;

export function statusVariant(s: Leave['status']): 'warning' | 'success' | 'danger' {
  return s === 'pending' ? 'warning' : s === 'approved' ? 'success' : 'danger';
}

/** Una solicitud de ausencia con sus acciones de aprobar o rechazar (con motivo). */
export default function LeaveItem({ leave, compact = false }: { leave: Leave; compact?: boolean }) {
  const t = useTranslations('demoHrms.leaves');
  const tt = useTranslations('demoHrms.leaveTypes');
  const tr = useTranslations('demoHrms.rejectReasons');
  const pos = usePos();
  const { state, dispatch, openProfile } = useHr();
  const f = useFmt();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('peak');
  const emp = state.employees.find((e) => e.id === leave.employeeId);
  if (!emp) return null;
  const bal = leave.type === 'vacation' ? vacationBalance(state, emp) : null;

  const approve = () => {
    if (bal && bal.balance - leave.days < 0) {
      toast.error(t('insufficient', { n: f.num(bal.balance) }));
      return;
    }
    dispatch({ type: 'leave.decide', id: leave.id, status: 'approved' });
    toast.success(
      leave.type === 'vacation' && bal
        ? t('approvedVacation', { name: emp.name, n: f.num(bal.balance - leave.days) })
        : t('approved', { name: emp.name }),
    );
  };

  return (
    <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <button type="button" onClick={() => openProfile(emp.id)} className="text-sm font-semibold text-secondary-900 dark:text-white hover:underline text-left">
            {emp.name}
          </button>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{pos(emp)}</p>
        </div>
        <Badge variant={leave.status === 'pending' ? 'info' : statusVariant(leave.status)} size="sm">
          {tt(leave.type)} · {leave.type === 'vacation' ? t('businessDays', { n: leave.days }) : t('calendarDays', { n: leave.days })}
        </Badge>
      </div>
      <p className="text-xs text-secondary-600 dark:text-secondary-300">
        {f.date(leave.from)} → {f.date(leave.to)}
        {leave.source === 'app' && <span className="ml-1 text-violet-700 dark:text-violet-300">· {t('fromApp')}</span>}
      </p>
      {bal && leave.status === 'pending' && !compact && (
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-0.5">{t('balanceAfter', { now: f.num(bal.balance), after: f.num(bal.balance - leave.days) })}</p>
      )}
      {leave.status === 'rejected' && leave.rejectReason && (
        <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">{t('rejectedBecause', { reason: tr(leave.rejectReason as (typeof REASONS)[number]) })}</p>
      )}
      {leave.status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={approve} className={btn.approve}>
            {t('approve')}
          </button>
          <button type="button" onClick={() => setRejecting(true)} className={btn.reject}>
            {t('reject')}
          </button>
        </div>
      )}
      {rejecting && (
        <Modal title={t('rejectTitle')} subtitle={`${emp.name} · ${f.date(leave.from)} → ${f.date(leave.to)}`} onClose={() => setRejecting(false)} size="sm" labelId={`reject-${leave.id}`}>
          <Field label={t('reason')} htmlFor={`reason-${leave.id}`}>
            <select id={`reason-${leave.id}`} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">{t('rejectNote')}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className={btn.outline} onClick={() => setRejecting(false)}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                dispatch({ type: 'leave.decide', id: leave.id, status: 'rejected', reason });
                setRejecting(false);
                toast(t('rejected', { name: emp.name }), { icon: '✕' });
              }}
            >
              {t('confirmReject')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
