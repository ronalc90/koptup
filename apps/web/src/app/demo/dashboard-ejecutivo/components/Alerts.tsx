'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellAlertIcon, ClipboardDocumentIcon, EnvelopeIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useDashboard } from '../lib/store';
import { useNarrative } from './narrative';
import { btn, card, Note, NS, SectionTitle, SeverityBadge, useFmt } from './ui';

export default function Alerts() {
  const t = useTranslations(`${NS}.alerts`);
  const tw = useTranslations(`${NS}.weekly`);
  const fmt = useFmt();
  const { alerts, setView, ctx, settings, notify, company } = useDashboard();
  const { alertTitle, alertText, weekly, recipientName } = useNarrative();
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const th = ctx.params.thresholds;

  const [pageUrl, setPageUrl] = useState('');
  useEffect(() => setPageUrl(`${window.location.origin}${window.location.pathname}`), []);
  const recipients = settings.recipients.filter((r) => r.channel === channel);
  const fullText = [...weekly, tw('link', { link: pageUrl })].join('\n');
  const waText = [`*${weekly[0]}*`, ...weekly.slice(1), tw('link', { link: pageUrl })].join('\n');
  // Sin número: WhatsApp deja elegir el contacto (así nunca se escribe a un número de ejemplo).
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const mailHref = `mailto:${recipients.map((r) => r.address).join(',')}?subject=${encodeURIComponent(tw('emailSubject', { company: company.name }))}&body=${encodeURIComponent(fullText)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channel === 'whatsapp' ? waText : fullText);
      notify(tw('copied'));
    } catch {
      notify(tw('copyError'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="alerts-title">
        <SectionTitle
          title={
            <span id="alerts-title" className="inline-flex items-center gap-2">
              <BellAlertIcon className="w-6 h-6 text-purple-600" aria-hidden="true" />
              {t('title')}
            </span>
          }
          subtitle={t('subtitle')}
          actions={
            <button type="button" className={btn.small} onClick={() => setView('configuracion')}>
              {t('editThresholds')}
            </button>
          }
        />
        {alerts.length ? (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <SeverityBadge severity={a.severity} />
                  <h4 className="font-semibold text-slate-900 dark:text-white">{alertTitle(a)}</h4>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{alertText(a)}</p>
                <button type="button" className={`${btn.link} mt-2`} onClick={() => setView(a.view)}>
                  {t(`goTo.${a.view}`)}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('empty')}</p>
        )}
        <div className="mt-4">
          <Note>
            {t('rules', {
              goalGap: fmt.num(th.goalGap, 1),
              marginDrop: fmt.num(th.marginDrop, 1),
              overdueGrowth: fmt.num(th.overdueGrowth, 1),
              cashFloor: fmt.moneyM(th.cashFloor * 1e6),
              riskDrop: fmt.num(th.riskDrop, 1),
            })}
          </Note>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="weekly-title">
        <SectionTitle title={<span id="weekly-title">{tw('previewTitle')}</span>} subtitle={tw('previewSubtitle')} />
        <div role="tablist" aria-label={tw('channel')} className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 mb-4">
          {(['whatsapp', 'email'] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={channel === c}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${channel === c ? 'bg-purple-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {c === 'whatsapp' ? <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" aria-hidden="true" /> : <EnvelopeIcon className="w-4 h-4" aria-hidden="true" />}
              {tw(`channels.${c}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {channel === 'whatsapp' ? (
            <div className="rounded-2xl bg-[#e5ddd5] dark:bg-slate-800 p-4">
              <div className="max-w-sm rounded-xl rounded-tl-none bg-white dark:bg-slate-700 p-3 shadow text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line">
                <p className="font-bold">{weekly[0]}</p>
                {weekly.slice(1).map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
                <p className="text-blue-700 dark:text-blue-300 underline">{tw('linkPlaceholder')}</p>
                <p className="text-right text-[10px] text-slate-500 dark:text-slate-400 mt-1">{tw('mondayTime')}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                <div>
                  <span className="font-semibold">{tw('emailTo')}</span> {recipients.length ? recipients.map(recipientName).join(', ') : tw('noRecipients')}
                </div>
                <div>
                  <span className="font-semibold">{tw('emailSubjectLabel')}</span> {tw('emailSubject', { company: company.name })}
                </div>
              </div>
              <div className="p-4 space-y-1 text-slate-800 dark:text-slate-100">
                <p className="font-semibold">{weekly[0]}</p>
                {weekly.slice(1).map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
                <p className="text-blue-700 dark:text-blue-300 underline">{tw('linkPlaceholder')}</p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{tw('recipients')}</h4>
              {recipients.length ? (
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {recipients.map((r) => (
                    <li key={r.id}>
                      {recipientName(r)} · <span className="text-slate-500">{r.address}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">{tw('noRecipients')}</p>
              )}
              <button type="button" className={`${btn.link} mt-1`} onClick={() => setView('configuracion')}>
                {tw('editRecipients')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.outline} onClick={copy}>
                <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
                {tw('copy')}
              </button>
              {channel === 'whatsapp' ? (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className={btn.primary}>
                  <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" aria-hidden="true" />
                  {tw('openWhatsapp')}
                </a>
              ) : (
                <a href={mailHref} className={btn.primary}>
                  <EnvelopeIcon className="w-4 h-4" aria-hidden="true" />
                  {tw('openEmail')}
                </a>
              )}
            </div>
            <Note tone="amber">{tw('simulated')}</Note>
          </div>
        </div>
      </section>
    </div>
  );
}
