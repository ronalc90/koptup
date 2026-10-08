'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { addDays, endOfBusinessDays, nextBusinessDay, type ISODate } from '../lib/dates';
import { useHr } from '../lib/store';
import { active, vacationBalance } from '../lib/selectors';
import type { LeaveType } from '../lib/types';
import { Field, btn, inputCls, useFmt } from './ui';

const TYPES: LeaveType[] = ['vacation', 'permit', 'unpaid', 'sick'];

/**
 * Registro de una ausencia. Las vacaciones se cuentan en días hábiles (lunes a
 * viernes sin festivos) y se validan contra el saldo; las incapacidades quedan
 * registradas de inmediato y el resto pasa a aprobación del jefe.
 */
export default function LeaveForm({
  employeeId,
  onDone,
  appMode = false,
  idPrefix,
}: {
  employeeId?: string;
  onDone: () => void;
  appMode?: boolean;
  idPrefix: string;
}) {
  const t = useTranslations('demoHrms.leaveForm');
  const tt = useTranslations('demoHrms.leaveTypes');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const people = useMemo(() => [...active(state)].sort((a, b) => a.name.localeCompare(b.name, 'es')), [state]);
  const [who, setWho] = useState(employeeId ?? '');
  const [type, setType] = useState<LeaveType>('vacation');
  const [from, setFrom] = useState<ISODate>(nextBusinessDay(addDays(state.baseDate, 14)));
  const [days, setDays] = useState(5);
  const [note, setNote] = useState('');
  const emp = people.find((p) => p.id === who);
  const bal = emp ? vacationBalance(state, emp) : null;
  const available = bal ? Math.floor((bal.balance - bal.pending) * 10) / 10 : 0;
  const to = type === 'vacation' ? endOfBusinessDays(from, Math.max(1, days)) : addDays(from, Math.max(1, days) - 1);
  const ret = type === 'vacation' ? nextBusinessDay(to) : addDays(to, 1);

  let error = '';
  if (!emp) error = t('errors.employee');
  else if (!from || from < state.baseDate) error = t('errors.past');
  else if (!Number.isFinite(days) || days < 1 || days > 30) error = t('errors.days');
  else if (type === 'vacation' && emp.contract === 'apprentice') error = t('errors.apprentice');
  else if (type === 'vacation' && days > available) error = t('errors.balance', { n: f.num(available) });

  const submit = () => {
    if (error || !emp) return;
    dispatch({
      type: 'leave.create',
      leave: {
        employeeId: emp.id,
        type,
        from,
        to,
        days,
        status: type === 'sick' ? 'approved' : 'pending',
        note: note.trim() || undefined,
        source: appMode ? 'app' : 'hr',
      },
    });
    toast.success(type === 'sick' ? t('doneSick', { name: emp.name }) : t('done', { name: emp.name }));
    onDone();
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {!appMode && !employeeId && (
        <Field label={t('employee')} htmlFor={`${idPrefix}-who`}>
          <select id={`${idPrefix}-who`} className={inputCls} value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">{t('choose')}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {!appMode && (
        <Field label={t('type')} htmlFor={`${idPrefix}-type`}>
          <select id={`${idPrefix}-type`} className={inputCls} value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {tt(x)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('from')} htmlFor={`${idPrefix}-from`}>
          <input id={`${idPrefix}-from`} type="date" className={inputCls} value={from} min={state.baseDate} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={type === 'vacation' ? t('businessDays') : t('calendarDays')} htmlFor={`${idPrefix}-days`}>
          <input id={`${idPrefix}-days`} type="number" min={1} max={30} className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </Field>
      </div>
      {emp && type === 'vacation' && (
        <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('available', { n: f.num(available) })}</p>
      )}
      {from && days > 0 && (
        <p className="text-xs text-secondary-600 dark:text-secondary-300">
          {t('range', { from: f.date(from), to: f.date(to), back: f.date(ret) })}
        </p>
      )}
      {!appMode && (
        <Field label={t('note')} htmlFor={`${idPrefix}-note`}>
          <input id={`${idPrefix}-note`} className={inputCls} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
        </Field>
      )}
      {error && emp && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" className={`${btn.primary} ${appMode ? 'w-full' : ''}`} disabled={!!error}>
          {type === 'sick' ? t('submitSick') : t('submit')}
        </button>
      </div>
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{type === 'vacation' ? t('ruleVacation') : t('ruleOther')}</p>
    </form>
  );
}
