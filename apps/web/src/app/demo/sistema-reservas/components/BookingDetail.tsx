'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellAlertIcon, CalendarDaysIcon, EnvelopeIcon, PhoneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { capitalize } from '../lib/dates';
import { balanceOf, freeCancellation, locationOf, serviceOf, staffOf } from '../lib/engine';
import { useReservas } from '../lib/store';
import type { HistoryItem, Status } from '../lib/types';
import { Modal, StatusBadge, btnSecondary, btnSmall, inputCls, useFmt, useKind, useToast } from './ui';

export default function BookingDetail({ bookingId, onClose, onReschedule }: { bookingId: string; onClose: () => void; onReschedule: (id: string) => void }) {
  const t = useTranslations('demoReservas.detail');
  const ts = useTranslations('demoReservas.status');
  const tc = useTranslations('demoReservas.channel');
  const tm = useTranslations('demoReservas.method');
  const tk = useTranslations('demoReservas.msg.kind');
  const { biz, data, now, act } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const notify = useToast();
  const b = data.bookings.find((x) => x.id === bookingId);
  const [notes, setNotes] = useState(b?.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!b) return null;

  const svc = serviceOf(biz, b.serviceId);
  const loc = locationOf(biz, b.locationId);
  const staff = staffOf(biz, b.staffId);
  const past = b.date < now.date || (b.date === now.date && b.start <= now.minutes);
  const future = !past;
  const open = b.status === 'pending' || b.status === 'confirmed';
  // Se puede marcar asistencia desde una hora antes de la cita.
  const started = b.date < now.date || (b.date === now.date && b.start <= now.minutes + 60);
  const balance = balanceOf(biz, b);

  const setStatus = (s: Status) => {
    act({ type: 'status', id: b.id, status: s });
    notify(t('statusDone', { code: b.code, status: ts(s) }));
  };

  const historyText = (h: HistoryItem) => {
    switch (h.kind) {
      case 'created':
        return t('history.created', { channel: tc(h.detail as never) });
      case 'status':
        return t('history.status', { status: ts(h.detail as never) });
      case 'rescheduled': {
        const [d, time] = h.detail.split(' ');
        const [hh, mm] = time.split(':').map(Number);
        return t('history.rescheduled', { from: `${f.date(d, 'short')} ${f.time(hh * 60 + mm)}` });
      }
      case 'note':
        return t('history.note');
      case 'message':
        return t('history.message', { kind: tk(h.detail as never) });
      case 'reply':
        return t(h.detail === 'confirmed' ? 'history.replyConfirmed' : 'history.replyReschedule');
      default:
        return '';
    }
  };

  return (
    <Modal
      labelId="booking-detail-title"
      size="lg"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {b.client.name} <StatusBadge status={b.status} />
        </span>
      }
      subtitle={`${b.code} · ${t('createdVia', { channel: tc(b.channel) })}`}
      onClose={onClose}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
            <p className="flex items-start gap-2 font-semibold text-slate-900 dark:text-white">
              <CalendarDaysIcon className="h-5 w-5 shrink-0 text-orange-600" />
              <span>
                {capitalize(f.date(b.date, 'long'))}
                <span className="block font-normal text-slate-600 dark:text-slate-300">
                  {f.time(b.start)}–{f.time(b.end)} · {svc ? f.l(svc.name) : ''}
                </span>
              </span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {kind.one}: <span className="font-medium text-slate-900 dark:text-white">{staff?.name}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {loc?.name} · {loc?.address}
            </p>
          </div>
          <div className="space-y-1.5">
            <a href={`tel:${b.client.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-orange-700">
              <PhoneIcon className="h-4 w-4 text-slate-400" />
              {b.client.phone}
            </a>
            {b.client.email && (
              <a href={`mailto:${b.client.email}`} className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-orange-700 break-all">
                <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                {b.client.email}
              </a>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-1">
            <p className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t('price')}</span>
              <span className="font-medium">{f.money(svc?.price ?? 0)}</span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t('paidOnline')}</span>
              <span className="font-medium">{b.payment.kind === 'none' ? '—' : `${f.money(b.payment.amount)} · ${tm(b.payment.method)}`}</span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">{t('balance')}</span>
              <span className="font-semibold">{f.money(balance)}</span>
            </p>
            {b.payment.ref && <p className="text-[11px] text-slate-400">{t('ref', { ref: b.payment.ref })}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t('actions')}</p>
            <div className="flex flex-wrap gap-2">
              {b.status === 'pending' && (
                <button type="button" className={btnSmall} onClick={() => setStatus('confirmed')}>
                  {t('confirm')}
                </button>
              )}
              {open && started && (
                <>
                  <button type="button" className={`${btnSmall} !border-emerald-300 !text-emerald-700 dark:!text-emerald-300`} onClick={() => setStatus('attended')}>
                    {t('attended')}
                  </button>
                  <button type="button" className={`${btnSmall} !border-red-300 !text-red-700 dark:!text-red-300`} onClick={() => setStatus('noshow')}>
                    {t('noshow')}
                  </button>
                </>
              )}
              {b.status === 'attended' && (
                <button type="button" className={`${btnSmall} !border-red-300 !text-red-700 dark:!text-red-300`} onClick={() => setStatus('noshow')}>
                  {t('toNoshow')}
                </button>
              )}
              {b.status === 'noshow' && (
                <button type="button" className={`${btnSmall} !border-emerald-300 !text-emerald-700 dark:!text-emerald-300`} onClick={() => setStatus('attended')}>
                  {t('toAttended')}
                </button>
              )}
              {b.status !== 'attended' && (
                <button type="button" className={btnSmall} onClick={() => onReschedule(b.id)}>
                  {t('reschedule')}
                </button>
              )}
              {open && (
                <button type="button" className={btnSmall} onClick={() => setStatus('cancelled')}>
                  {t('cancel')}
                </button>
              )}
              {open && future && (
                <button
                  type="button"
                  className={btnSmall}
                  onClick={() => {
                    const ch = b.remind.whatsapp ? 'whatsapp' : 'email';
                    act({ type: 'send', bookingIds: [b.id], kind: 'reminder', channels: [ch] });
                    notify(t('reminderSent'));
                  }}
                  disabled={!b.remind.whatsapp && !(b.remind.email && b.client.email)}
                >
                  <BellAlertIcon className="h-4 w-4" />
                  {t('sendReminder')}
                </button>
              )}
            </div>
            {open && future && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {freeCancellation(biz, b, now) ? t('policyFree', { hours: biz.cancelHours }) : t('policyLate', { hours: biz.cancelHours })}
              </p>
            )}
            {open && !started && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('markHint')}</p>}
          </div>

          <div>
            <label htmlFor="bd-notes" className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('notes')}
            </label>
            <textarea id="bd-notes" rows={3} className={`${inputCls} mt-2 resize-none`} placeholder={t('notesPh')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button
              type="button"
              className={`${btnSmall} mt-2`}
              disabled={notes === b.notes}
              onClick={() => {
                act({ type: 'note', id: b.id, notes });
                notify(t('notesSaved'));
              }}
            >
              {t('saveNotes')}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t('historyTitle')}</p>
            <ol className="max-h-40 overflow-y-auto space-y-1.5 text-xs">
              {[...b.history].reverse().map((h, i) => (
                <li key={`${h.at}${i}`} className="flex gap-2">
                  <span className="shrink-0 text-slate-400">{f.stamp(h.at)}</span>
                  <span className="text-slate-700 dark:text-slate-200">{historyText(h)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-red-700 dark:text-red-300">{t('deleteConfirm')}</span>
            <button
              type="button"
              className={`${btnSmall} !bg-red-600 !text-white !border-red-600`}
              onClick={() => {
                act({ type: 'delete', id: b.id });
                notify(t('deleted', { code: b.code }));
                onClose();
              }}
            >
              {t('deleteYes')}
            </button>
            <button type="button" className={btnSmall} onClick={() => setConfirmDelete(false)}>
              {t('deleteNo')}
            </button>
          </div>
        ) : (
          <button type="button" className={`${btnSmall} !text-red-700 dark:!text-red-300`} onClick={() => setConfirmDelete(true)}>
            <TrashIcon className="h-4 w-4" />
            {t('delete')}
          </button>
        )}
        <button type="button" className={btnSecondary} onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </Modal>
  );
}
