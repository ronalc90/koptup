'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellAlertIcon, ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { capitalize } from '../lib/dates';
import { nextDayWithBookings, serviceOf } from '../lib/engine';
import { useReservas } from '../lib/store';
import type { MessageChannel } from '../lib/types';
import { MessagePreview } from './MessagePreview';
import { SimNote, Segmented, btnPrimary, btnSmall, useFmt, useToast } from './ui';

const PAGE = 12;

export default function MessagesView({ viewAs, onOpen, onReschedule }: { viewAs: string; onOpen: (id: string) => void; onReschedule: (id: string) => void }) {
  const t = useTranslations('demoReservas.messages');
  const tk = useTranslations('demoReservas.msg.kind');
  const { biz, data, now, act } = useReservas();
  const f = useFmt();
  const notify = useToast();
  const [channel, setChannel] = useState<'all' | MessageChannel>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const mine = data.bookings.filter((b) => viewAs === 'all' || b.staffId === viewAs);
  const target = nextDayWithBookings(mine, now.date);
  const due = target ? mine.filter((b) => b.date === target && (b.status === 'pending' || b.status === 'confirmed')) : [];
  const pendingReminders = due.filter((b) => (b.remind.whatsapp || (b.remind.email && b.client.email)) && !data.messages.some((m) => m.bookingId === b.id && m.kind === 'reminder'));
  const byId = new Map(data.bookings.map((b) => [b.id, b]));
  const log = data.messages
    .filter((m) => (channel === 'all' || m.channel === channel) && byId.has(m.bookingId) && (viewAs === 'all' || byId.get(m.bookingId)?.staffId === viewAs))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const sendAll = () => {
    act({ type: 'send', bookingIds: pendingReminders.map((b) => b.id), kind: 'reminder', channels: ['whatsapp', 'email'] });
    notify(t('sent', { n: pendingReminders.length }));
  };

  return (
    <div className="space-y-5">
      <SimNote>{t('simNote')}</SimNote>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BellAlertIcon className="h-5 w-5 text-orange-600" />
              {target ? t('dueTitle', { date: capitalize(f.date(target, 'dayMonth')) }) : t('dueNone')}
            </h3>
            {target && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dueDetail', { n: due.length, pending: pendingReminders.length })}</p>}
          </div>
          <button type="button" className={btnPrimary} disabled={!pendingReminders.length} onClick={sendAll}>
            {pendingReminders.length ? t('sendAll', { n: pendingReminders.length }) : t('allSent')}
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('logTitle', { n: log.length })}</h3>
        <Segmented
          size="sm"
          label={t('channelLabel')}
          value={channel}
          onChange={(c) => {
            setChannel(c);
            setLimit(PAGE);
          }}
          options={[
            { id: 'all', label: t('all') },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'email', label: t('email') },
          ]}
        />
      </div>

      {log.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
          {log.slice(0, limit).map((m) => {
            const b = byId.get(m.bookingId);
            if (!b) return null;
            const svc = serviceOf(biz, b.serviceId);
            const open = openId === m.id;
            const Icon = m.channel === 'whatsapp' ? ChatBubbleLeftRightIcon : EnvelopeIcon;
            return (
              <li key={m.id} className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{tk(m.kind)}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
                    {b.client.name} · {svc ? f.l(svc.name) : ''} · {b.code}
                  </span>
                  {m.kind === 'reminder' && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.reply ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {m.reply ? t(`reply.${m.reply}`) : t('reply.none')}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">{f.stamp(m.at)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={btnSmall} aria-expanded={open} onClick={() => setOpenId(open ? null : m.id)}>
                    {open ? t('hide') : t('preview')}
                  </button>
                  <button type="button" className={btnSmall} onClick={() => onOpen(b.id)}>
                    {t('openBooking')}
                  </button>
                </div>
                {open && (
                  <div className="mt-3 max-w-md">
                    <MessagePreview
                      biz={biz}
                      booking={b}
                      kind={m.kind}
                      channel={m.channel}
                      log={m}
                      onReply={(reply) => {
                        act({ type: 'reply', messageId: m.id, reply });
                        if (reply === 'reschedule') onReschedule(b.id);
                        else notify(t('replyConfirmed', { name: b.client.name }));
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {log.length > limit && (
        <div className="text-center">
          <button type="button" className={btnSmall} onClick={() => setLimit((l) => l + PAGE)}>
            {t('more', { n: log.length - limit })}
          </button>
        </div>
      )}
    </div>
  );
}
