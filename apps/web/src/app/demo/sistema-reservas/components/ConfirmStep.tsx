'use client';

import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, BellAlertIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { capitalize } from '../lib/dates';
import { balanceOf, locationOf, serviceOf, staffOf } from '../lib/engine';
import { buildIcs, download, googleCalendarUrl, type EventText } from '../lib/files';
import { useReservas } from '../lib/store';
import type { Booking, Business } from '../lib/types';
import { MessagePreview } from './MessagePreview';
import { SimNote, StatusBadge, btnPrimary, btnSecondary, useFmt, useToast } from './ui';

/** Texto del evento de calendario de una reserva. */
export function useEventText(biz: Business) {
  const t = useTranslations('demoReservas.calendar');
  const f = useFmt();
  return (b: Booking): EventText => {
    const svc = serviceOf(biz, b.serviceId);
    const loc = locationOf(biz, b.locationId);
    const staff = staffOf(biz, b.staffId);
    return {
      title: t('title', { service: svc ? f.l(svc.name) : '', business: biz.name }),
      description: t('description', { code: b.code, staff: staff?.name ?? '', phone: biz.phone, hours: biz.cancelHours }),
      location: loc ? `${biz.name} ${loc.name}, ${loc.address}, ${loc.city}` : biz.name,
    };
  };
}

export default function ConfirmStep({
  bookingId,
  onAgenda,
  onAnother,
  onReschedule,
}: {
  bookingId: string;
  onAgenda: (id: string) => void;
  onAnother: () => void;
  onReschedule: (id: string) => void;
}) {
  const t = useTranslations('demoReservas.confirm');
  const { biz, data, now, act } = useReservas();
  const f = useFmt();
  const notify = useToast();
  const eventText = useEventText(biz);
  const b = data.bookings.find((x) => x.id === bookingId);
  if (!b) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">{t('gone')}</p>
        <button type="button" className={`${btnPrimary} mt-4`} onClick={onAnother}>
          {t('another')}
        </button>
      </div>
    );
  }
  const svc = serviceOf(biz, b.serviceId);
  const loc = locationOf(biz, b.locationId);
  const staff = staffOf(biz, b.staffId);
  const messages = data.messages.filter((m) => m.bookingId === b.id);
  const confirmation = messages.filter((m) => m.kind === 'confirmation');
  const reminderChannel = b.remind.whatsapp ? 'whatsapp' : b.remind.email && b.client.email ? 'email' : null;
  const reminder = messages.find((m) => m.kind === 'reminder' && m.channel === reminderChannel);
  const text = eventText(b);
  const balance = balanceOf(biz, b);

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
          <CheckCircleIcon className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{b.status === 'pending' ? t('titlePending') : t('title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">{t('code', { code: b.code })}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <dl className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarDaysIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('when')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {capitalize(f.date(b.date, 'long'))} · {f.time(b.start)}–{f.time(b.end)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('service')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {svc ? f.l(svc.name) : ''} · {svc ? f.duration(svc.duration) : ''}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('with')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{staff?.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('where')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {biz.name} · {loc?.name}
                </dd>
                <dd className="text-slate-600 dark:text-slate-300">
                  {loc?.address}, {loc?.city}
                </dd>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                {b.payment.kind === 'none'
                  ? t('payOnsite', { amount: f.money(svc?.price ?? 0) })
                  : t('paid', { amount: f.money(b.payment.amount), method: t(`method.${b.payment.method}`), ref: b.payment.ref ?? '' })}
                {b.payment.kind === 'deposit' && balance > 0 ? ` ${t('balance', { amount: f.money(balance) })}` : ''}
              </span>
              <StatusBadge status={b.status} />
            </div>
          </dl>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                download(`${b.code}.ics`, buildIcs([{ booking: b, text }], now.stamp, t('icsReminder')), 'text/calendar;charset=utf-8');
                notify(t('icsDone'));
              }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('ics')}
            </button>
            <a className={btnSecondary} href={googleCalendarUrl(b, text)} target="_blank" rel="noopener noreferrer">
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              {t('google')}
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('calendarNote')}</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" className={btnPrimary} onClick={() => onAgenda(b.id)}>
              {t('seeAgenda')}
            </button>
            <button type="button" className={btnSecondary} onClick={() => onReschedule(b.id)} disabled={b.status === 'cancelled'}>
              {t('reschedule')}
            </button>
            <button type="button" className={btnSecondary} onClick={onAnother}>
              {t('another')}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('messagesTitle')}</h3>
          {confirmation.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('noMessages')}</p>}
          {confirmation.map((m) => (
            <MessagePreview key={m.id} biz={biz} booking={b} kind="confirmation" channel={m.channel} log={m} />
          ))}
          {b.status !== 'cancelled' && !reminderChannel && <p className="text-sm text-slate-500 dark:text-slate-400">{t('noReminders')}</p>}
          {b.status !== 'cancelled' &&
            reminderChannel &&
            (reminder ? (
              <MessagePreview
                biz={biz}
                booking={b}
                kind="reminder"
                channel={reminderChannel}
                log={reminder}
                onReply={(reply) => {
                  act({ type: 'reply', messageId: reminder.id, reply });
                  if (reply === 'reschedule') onReschedule(b.id);
                  else notify(t('replyConfirmed'));
                }}
              />
            ) : (
              <button
                type="button"
                className={`${btnSecondary} w-full`}
                onClick={() => {
                  act({ type: 'send', bookingIds: [b.id], kind: 'reminder', channels: [reminderChannel] });
                  notify(t('reminderSent'));
                }}
              >
                <BellAlertIcon className="h-4 w-4" />
                {t('simulateReminder', { hours: 24 })}
              </button>
            ))}
          <SimNote>{t('simNote')}</SimNote>
        </div>
      </div>
    </div>
  );
}
