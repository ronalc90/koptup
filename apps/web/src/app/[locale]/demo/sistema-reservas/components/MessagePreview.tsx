'use client';

import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { firstName, locationOf, serviceOf, staffOf } from '../lib/engine';
import type { Booking, Business, MessageChannel, MessageKind, MessageLog } from '../lib/types';
import { useFmt } from './ui';

/** Texto del mensaje simulado (mismo texto en WhatsApp y en el correo). */
export function useMessageText(biz: Business) {
  const t = useTranslations('demoReservas.msg');
  const f = useFmt();
  return (kind: MessageKind, b: Booking) => {
    const loc = locationOf(biz, b.locationId);
    const svc = serviceOf(biz, b.serviceId);
    const staff = staffOf(biz, b.staffId);
    const params = {
      first: firstName(b.client.name),
      service: svc ? f.l(svc.name) : '',
      date: f.date(b.date, 'dayMonth'),
      time: f.time(b.start),
      business: biz.name,
      location: loc?.name ?? '',
      address: loc ? `${loc.address}, ${loc.city}` : '',
      staff: staff?.name ?? '',
      code: b.code,
      hours: biz.cancelHours,
    };
    return {
      body: t(`tpl.${kind}`, params),
      subject: t(`subject.${kind}`, params),
    };
  };
}

export function MessagePreview({
  biz,
  booking,
  kind,
  channel,
  log,
  onReply,
}: {
  biz: Business;
  booking: Booking;
  kind: MessageKind;
  channel: MessageChannel;
  log?: MessageLog;
  onReply?: (reply: 'confirmed' | 'reschedule') => void;
}) {
  const t = useTranslations('demoReservas.msg');
  const f = useFmt();
  const text = useMessageText(biz)(kind, booking);
  const withButtons = kind === 'reminder' && channel === 'whatsapp';

  if (channel === 'email') {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <EnvelopeIcon className="h-4 w-4" />
            {t('emailFrom', { business: biz.name })}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 break-all">{t('emailTo', { email: booking.client.email || '—' })}</div>
          <div className="font-semibold text-slate-900 dark:text-white">{text.subject}</div>
        </div>
        <p className="px-3 py-3 whitespace-pre-line text-slate-700 dark:text-slate-200">{text.body}</p>
        {log && <p className="px-3 pb-2 text-[11px] text-slate-400">{f.stamp(log.at)}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#e9e3d8] dark:bg-slate-800 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        {t('whatsappFrom', { business: biz.name })}
      </div>
      <div className="max-w-[95%] rounded-lg rounded-tl-none bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
        <p className="whitespace-pre-line text-sm text-slate-800 dark:text-slate-100">{text.body}</p>
        <p className="mt-1 text-right text-[10px] text-slate-400">{log ? f.stamp(log.at) : t('notSentYet')}</p>
      </div>
      {withButtons && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 max-w-[95%]">
          {log?.reply ? (
            <p className="col-span-2 rounded-lg bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {t(log.reply === 'confirmed' ? 'repliedConfirmed' : 'repliedReschedule')}
            </p>
          ) : onReply ? (
            <>
              <button
                type="button"
                onClick={() => onReply('confirmed')}
                className="rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                {t('btnConfirm')}
              </button>
              <button
                type="button"
                onClick={() => onReply('reschedule')}
                className="rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                {t('btnReschedule')}
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
