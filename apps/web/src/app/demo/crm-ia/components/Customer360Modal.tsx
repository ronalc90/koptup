'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  LightBulbIcon,
  PencilSquareIcon,
  PhoneIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ALL_STAGES,
  ActivityEvent,
  Deal,
  EventType,
  REF_DATE,
  StageId,
  addDays,
  daysSince,
  initials,
  isOpen,
  probabilityOf,
  recommendationsFor,
  scoreFactors,
  scoreOf,
  stageIndex,
  temperatureOf,
  timelineFor,
} from './crm';
import { TEMP_VARIANT } from './ContactsView';
import { Avatar, Modal, inputCls, labelCls } from './ui';
import { CrmText, useCrmText } from './useCrmText';

const EVENT_META: Record<EventType, { icon: typeof EnvelopeIcon; color: string }> = {
  created: { icon: BriefcaseIcon, color: 'text-primary-700 bg-primary-100 dark:bg-primary-950 dark:text-primary-300' },
  meeting: { icon: UserGroupIcon, color: 'text-purple-700 bg-purple-100 dark:bg-purple-950 dark:text-purple-300' },
  proposal: { icon: DocumentTextIcon, color: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300' },
  whatsapp: { icon: ChatBubbleLeftRightIcon, color: 'text-green-700 bg-green-100 dark:bg-green-950 dark:text-green-300' },
  email: { icon: EnvelopeIcon, color: 'text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300' },
  call: { icon: PhoneIcon, color: 'text-teal-700 bg-teal-100 dark:bg-teal-950 dark:text-teal-300' },
  note: { icon: PencilSquareIcon, color: 'text-secondary-700 bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-300' },
  won: { icon: CheckBadgeIcon, color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' },
  lost: { icon: XCircleIcon, color: 'text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300' },
  stage: { icon: ArrowsRightLeftIcon, color: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300' },
  sequence: { icon: BoltIcon, color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300' },
};

const LOG_TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting'] as const;
type LogType = (typeof LOG_TYPES)[number];

/** Cotización de ejemplo en PDF, generada en el navegador con los datos del negocio. */
async function downloadQuotePdf(tx: CrmText, d: Deal) {
  const { t } = tx;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const m = 18;
  let y = 18;
  const line = (text: string, size = 10, bold = false, gap = 6) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const parts = doc.splitTextToSize(text, 180) as string[];
    doc.text(parts, m, y);
    y += gap * parts.length;
  };
  doc.setTextColor(185, 28, 28);
  line(t('pdf.sample'), 9, true, 9);
  doc.setTextColor(17, 24, 39);
  line(t('data.seller'), 15, true, 7);
  line(t('pdf.sellerLine'), 9, false, 10);
  line(t('pdf.title', { number: `COT-2026-${d.id.toUpperCase()}` }), 12, true, 8);
  line(t('pdf.date', { date: tx.date(REF_DATE), valid: tx.date(addDays(REF_DATE, 30)) }), 10, false, 9);
  line(t('pdf.client'), 10, true);
  line(`${d.company}${d.nit ? ` · NIT ${d.nit}` : ''}`, 10);
  line(`${d.contactName}${tx.role(d) ? ` · ${tx.role(d)}` : ''} · ${d.city}`, 10, false, 9);
  line(t('pdf.scope'), 10, true);
  line(tx.title(d), 10, false, 9);
  line(t('pdf.total', { value: tx.money(d.value) }), 12, true, 8);
  line(t('pdf.payment', { advance: tx.money(d.value * 0.3), balance: tx.money(d.value * 0.7) }), 10, false, 9);
  line(t('pdf.taxes'), 9, false, 9);
  line(t('pdf.owner', { owner: tx.ownerName(d) }), 10);
  doc.save(`${t('pdf.fileName', { id: d.id.toUpperCase() })}.pdf`);
}

interface Props {
  deal: Deal;
  events: ActivityEvent[];
  onClose: () => void;
  onMove: (id: string, stage: StageId) => void;
  onLog: (id: string, type: EventType, text: string) => void;
  onUpdate: (id: string, patch: { nextAction?: string }) => void;
  onDelete: (id: string) => void;
  onDraft: (id: string) => void;
  notify: (msg: string) => void;
}

export default function Customer360Modal({ deal, events, onClose, onMove, onLog, onUpdate, onDelete, onDraft, notify }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [tab, setTab] = useState<'history' | 'deal' | 'files'>('history');
  const [logType, setLogType] = useState<LogType>('note');
  const [logText, setLogText] = useState('');
  const [nextAction, setNextAction] = useState(tx.nextAction(deal));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const score = scoreOf(deal);
  const temp = temperatureOf(score);
  const factors = scoreFactors(deal);
  const recs = recommendationsFor(deal);
  const timeline = timelineFor(deal, events);
  const hasQuote = stageIndex(deal.stage) >= stageIndex('proposal') && deal.stage !== 'lost';

  const submitLog = (e: FormEvent) => {
    e.preventDefault();
    const text = logText.trim();
    if (!text) return;
    onLog(deal.id, logType, `${t(`customer360.logTypes.${logType}`)}: ${text}`);
    setLogText('');
    notify(t('customer360.logged'));
  };

  const saveNext = () => {
    onUpdate(deal.id, { nextAction: nextAction.trim() });
    notify(t('customer360.nextActionSaved'));
  };

  const pdf = async () => {
    setPdfBusy(true);
    try {
      await downloadQuotePdf(tx, deal);
      notify(t('customer360.files.downloaded'));
    } finally {
      setPdfBusy(false);
    }
  };

  const stats = [
    {
      label: t('customer360.score'),
      value: (
        <span className="flex items-center gap-2">
          {score}
          <Badge variant={TEMP_VARIANT[temp]} size="sm">
            {t(`temperature.${temp}`)}
          </Badge>
        </span>
      ),
    },
    { label: t('customer360.value'), value: tx.moneyShort(deal.value) },
    { label: t('customer360.probability'), value: tx.pct(probabilityOf(deal)) },
    { label: t('customer360.lastContact'), value: tx.ago(deal.lastContact) },
  ];

  return (
    <Modal
      labelId="crm-360-title"
      size="lg"
      onClose={onClose}
      closeLabel={t('common.close')}
      title={
        <div className="flex items-center gap-3 min-w-0">
          <Avatar text={initials(deal.contactName)} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white truncate">{deal.contactName}</h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
              {[tx.role(deal), deal.company].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      }
      subtitle={
        <p className="text-xs text-secondary-500 break-words">
          {[deal.nit ? `NIT ${deal.nit}` : '', deal.city, deal.email, deal.phone].filter(Boolean).join(' · ')}
        </p>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onDraft(deal.id)} className="gap-1.5">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            {t('customer360.draftMessage')}
          </Button>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">{s.label}</p>
            <div className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 p-4">
          <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-0.5">{t('customer360.whyScore')}</h3>
          <p className="text-xs text-secondary-500 mb-3">{t('customer360.whyScoreHint')}</p>
          <ul className="space-y-2">
            {factors.map((f) => (
              <li key={f.id}>
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-secondary-700 dark:text-secondary-300">{tx.factorLabel(deal, f)}</span>
                  <span className="font-semibold text-secondary-900 dark:text-white whitespace-nowrap">
                    {f.points}/{f.max}
                  </span>
                </div>
                <div className="h-1.5 mt-1 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${(f.points / f.max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-secondary-900 p-4">
          <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-0.5 flex items-center gap-1.5">
            <LightBulbIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            {t('customer360.recommendations')}
          </h3>
          <p className="text-xs text-secondary-500 mb-3">{t('customer360.recommendationsHint')}</p>
          <ul className="space-y-1.5">
            {recs.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                <span className="text-primary-600 dark:text-primary-400" aria-hidden="true">•</span>
                <span>{tx.recText(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-b border-secondary-200 dark:border-secondary-800 mb-4">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto" role="tablist">
          {(['history', 'deal', 'files'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
              }`}
            >
              {t(`customer360.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'history' && (
        <div>
          <form onSubmit={submitLog} className="rounded-xl border border-secondary-200 dark:border-secondary-800 p-3 mb-4">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('customer360.logTitle')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="crm-log-type" className="sr-only">
                {t('customer360.logType')}
              </label>
              <select id="crm-log-type" value={logType} onChange={(e) => setLogType(e.target.value as LogType)} className={`${inputCls} sm:w-40`}>
                {LOG_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {t(`customer360.logTypes.${lt}`)}
                  </option>
                ))}
              </select>
              <label htmlFor="crm-log-text" className="sr-only">
                {t('customer360.logText')}
              </label>
              <input
                id="crm-log-text"
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                maxLength={200}
                placeholder={t('customer360.logPlaceholder')}
                className={inputCls}
              />
              <Button type="submit" size="sm" disabled={!logText.trim()} className="whitespace-nowrap">
                {t('customer360.logSubmit')}
              </Button>
            </div>
            <p className="text-[11px] text-secondary-500 mt-1.5">{t('customer360.logHint', { date: tx.date(REF_DATE) })}</p>
          </form>
          <ol className="space-y-1">
            {timeline.map((ev) => {
              const meta = EVENT_META[ev.type] ?? EVENT_META.note;
              const Icon = meta.icon;
              return (
                <li key={ev.id} className="flex gap-3 p-2 rounded-lg">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-secondary-500">{tx.date(ev.date)}</p>
                    <p className="text-sm text-secondary-800 dark:text-secondary-200 break-words">{tx.eventText(ev)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {tab === 'deal' && (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {(
              [
                ['title', tx.title(deal)],
                ['owner', tx.ownerName(deal)],
                ['value', tx.money(deal.value)],
                [
                  'closeDate',
                  isOpen(deal) && deal.closeDate < REF_DATE
                    ? `${tx.date(deal.closeDate)} · ${t('dates.overdue', { days: daysSince(deal.closeDate) })}`
                    : tx.date(deal.closeDate),
                ],
                ['created', tx.date(deal.createdAt)],
                ['source', t(`sources.${deal.source}`)],
                ['channel', t(`channels.${deal.channel}`)],
                ['size', t(`sizes.${deal.size}`)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-secondary-500">{t(`customer360.dealFields.${k}`)}</dt>
                <dd className="text-secondary-900 dark:text-white break-words">{v}</dd>
              </div>
            ))}
            {deal.stage === 'lost' && deal.lostReason && (
              <div>
                <dt className="text-xs text-secondary-500">{t('customer360.dealFields.lostReason')}</dt>
                <dd className="text-secondary-900 dark:text-white">{t(`lostReasons.${deal.lostReason}`)}</dd>
              </div>
            )}
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="crm-360-stage" className={labelCls}>
                {t('customer360.dealFields.stage')}
              </label>
              <select
                id="crm-360-stage"
                value={deal.stage}
                onChange={(e) => onMove(deal.id, e.target.value as StageId)}
                className={inputCls}
              >
                {ALL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(`stages.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="crm-360-next" className={labelCls}>
                {t('customer360.dealFields.nextAction')}
              </label>
              <div className="flex gap-2">
                <input
                  id="crm-360-next"
                  value={nextAction}
                  maxLength={120}
                  onChange={(e) => setNextAction(e.target.value)}
                  className={inputCls}
                />
                <Button size="sm" variant="outline" onClick={saveNext} disabled={!nextAction.trim() || nextAction.trim() === tx.nextAction(deal)}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-secondary-200 dark:border-secondary-800">
            {!confirmDelete ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="gap-1.5 text-red-700 dark:text-red-400">
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                {t('customer360.delete')}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2" role="alert">
                <span className="text-sm text-secondary-800 dark:text-secondary-200">{t('customer360.deleteConfirm')}</span>
                <Button size="sm" variant="danger" onClick={() => onDelete(deal.id)}>
                  {t('customer360.deleteYes')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div>
          {hasQuote ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-start gap-3 min-w-0">
                <DocumentTextIcon className="h-8 w-8 text-red-600 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-secondary-900 dark:text-white break-words">
                    {t('customer360.files.quote', { id: `COT-2026-${deal.id.toUpperCase()}` })}
                  </p>
                  <p className="text-xs text-secondary-500">{t('customer360.files.quoteHint')}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={pdf} isLoading={pdfBusy} className="gap-1.5 whitespace-nowrap">
                {!pdfBusy && <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />}
                {t('customer360.files.download')}
              </Button>
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-secondary-500">
              {deal.stage === 'lost' ? t('customer360.files.lost') : t('customer360.files.noQuote')}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
