'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  EyeIcon,
  PaperAirplaneIcon,
  SignalSlashIcon,
  WifiIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DEMO_TODAY, PREFIXES, RESOLUTION, type BillingDoc, type DocType, type HistoryEntry } from './data';
import { colombiaNow, cufeInput, docTotals, formatDate, nextNumber } from './docs';
import { draftForType, draftLines, draftParty, isNote, validateDraft } from './draft';
import { addDays, computeTotals, formatCOP, groupThousands, sha384Hex } from './fiscal';
import { BuyerForm, IssuesList, LinesEditor, NoteForm, PaymentFields, PosBuyer, TotalsSummary } from './EmissionForms';
import { QrSvg, SectionTitle, StatusBadge, useMonths } from './ui';
import { qrText } from './docs';
import type { BillingStore, EmissionTab } from './useBillingStore';
import { useDocActions } from './useDocActions';

const TABS: EmissionTab[] = ['factura', 'notaCredito', 'notaDebito', 'pos', 'contingencia'];
type Phase = 'xml' | 'sign' | 'transmit' | 'validate' | 'deliver';
const PHASES: Phase[] = ['xml', 'sign', 'transmit', 'validate', 'deliver'];
const PHASE_MS = 450;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function EmissionPanel({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const months = useMonths();
  const { state, draft, setDraft, tab, setTab, successId, setSuccessId, addDoc, updateDoc, markProgress, setDianDown, setDetailId } = store;
  const { downloadPdf, downloadXml } = useDocActions(store);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [failedAt, setFailedAt] = useState<Phase | null>(null);
  const [transmitting, setTransmitting] = useState<string | null>(null);

  const issuer = state.issuer;
  const docType: DocType = tab === 'contingencia' ? draft.type : tab;
  const ref = draft.refId ? state.docs.find((d) => d.id === draft.refId) : undefined;
  const conceptLabel = draft.concept
    ? t(`${docType === 'notaCredito' ? 'creditConcepts' : 'debitConcepts'}.${draft.concept}`).replace(/^\d+ · /, '')
    : '';
  const lines = useMemo(
    () => draftLines(draft, ref, t('note.adjustLine', { concept: conceptLabel, ref: ref?.id || '' })),
    [draft, ref, conceptLabel, t],
  );
  const party = draftParty(draft, ref);
  const totals = computeTotals(lines, party);
  const issues = validateDraft(draft, state.docs, ref, lines, issuer.prefix);
  const prefix = docType === 'factura' ? issuer.prefix : PREFIXES[docType];
  const next = nextNumber(state.docs, docType, prefix);
  const busy = phase !== null || transmitting !== null;
  const success = successId ? state.docs.find((d) => d.id === successId) : undefined;
  const queue = state.docs.filter((d) => d.status === 'contingency');

  const emit = async () => {
    if (busy || issues.length > 0 || tab === 'contingencia') return;
    setFailedAt(null);
    const id = `${prefix}${next}`;
    const { time } = colombiaNow();
    const hhmm = time.slice(0, 5);
    const doc: BillingDoc = {
      id,
      type: docType,
      prefix,
      number: next,
      issueDate: DEMO_TODAY,
      issueTime: `${time}-05:00`,
      client: party,
      lines: lines.map((l, i) => ({ ...l, id: `${id}-l${i + 1}` })),
      paymentForm: docType === 'pos' || isNote(docType) ? 'contado' : draft.paymentForm,
      paymentMethod: draft.paymentMethod,
      dueDate: docType === 'factura' && draft.paymentForm === 'credito' ? addDays(DEMO_TODAY, draft.creditDays) : undefined,
      status: 'accepted',
      cufe: '',
      refId: isNote(docType) ? ref?.id : undefined,
      concept: isNote(docType) ? draft.concept : undefined,
      note: isNote(docType) ? draft.note.trim() || conceptLabel : undefined,
      history: [],
    };
    try {
      doc.cufe = await sha384Hex(cufeInput(doc, issuer));
    } catch {
      toast.error(t('emission.cryptoError'));
      return;
    }
    const down = state.dianDown;
    const steps = down ? PHASES.slice(0, 3) : PHASES;
    for (const s of steps) {
      setPhase(s);
      await sleep(PHASE_MS);
    }
    const h = (key: HistoryEntry['key'], detail?: string): HistoryEntry => ({ date: DEMO_TODAY, time: hhmm, key, detail });
    if (down) {
      doc.status = 'contingency';
      doc.history = [h('xml'), h('signed'), h('queued')];
      setFailedAt('transmit');
    } else {
      doc.history = [h('xml'), h('signed'), h('transmitted'), h('accepted')];
      if (party.email) doc.history.push(h('delivered', party.email));
    }
    addDoc(doc);
    if (doc.refId) updateDoc(doc.refId, (d) => ({ ...d, history: [...d.history, h('noteIssued', doc.id)] }));
    if (docType === 'factura') markProgress('invoice');
    if (docType === 'notaCredito') markProgress('creditNote');
    setPhase(null);
    setSuccessId(id);
  };

  const another = () => {
    setSuccessId(null);
    setFailedAt(null);
    setDraft(() => draftForType(docType));
  };

  const transmitQueue = async () => {
    if (busy) return;
    setDianDown(false);
    const pending = queue.slice().reverse();
    for (const d of pending) {
      setTransmitting(d.id);
      await sleep(PHASE_MS * 2);
      const { time } = colombiaNow();
      const entry = (key: HistoryEntry['key'], detail?: string): HistoryEntry => ({ date: DEMO_TODAY, time: time.slice(0, 5), key, detail });
      updateDoc(d.id, (x) => ({
        ...x,
        status: 'accepted',
        history: [...x.history, entry('transmitted'), entry('accepted'), ...(x.client.email ? [entry('delivered', x.client.email)] : [])],
      }));
    }
    setTransmitting(null);
    if (pending.length) toast.success(t('contingency.done', { n: pending.length }));
    else toast.success(t('contingency.restored'));
  };

  const phaseIcon = (p: Phase) => {
    if (failedAt === p) return <XCircleIcon className="w-4 h-4 text-amber-600" />;
    const idx = PHASES.indexOf(p);
    const cur = phase ? PHASES.indexOf(phase) : success ? (failedAt ? PHASES.indexOf(failedAt) : PHASES.length) : -1;
    if (idx < cur) return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
    if (idx === cur && phase) return <ArrowPathIcon className="w-4 h-4 text-primary-600 animate-spin" />;
    return <ClockIcon className="w-4 h-4 text-secondary-400" />;
  };

  const phaseList = (
    <ol className="space-y-1.5 text-sm">
      {PHASES.map((p) => {
        const skipped = failedAt !== null && PHASES.indexOf(p) > PHASES.indexOf(failedAt);
        return (
          <li key={p} className={'flex items-center gap-2 ' + (skipped ? 'opacity-40' : '')}>
            {phaseIcon(p)}
            <span className="text-secondary-700 dark:text-secondary-200">{failedAt === p ? t('phases.failed') : t(`phases.${p}`)}</span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0" id="emision">
      <SectionTitle
        icon={<DocumentPlusIcon className="w-5 h-5" />}
        title={t('emission.title')}
        subtitle={t('emission.subtitle')}
      />
      <div role="tablist" aria-label={t('emission.title')} className="flex flex-wrap gap-2 mb-4">
        {TABS.map((k) => {
          const active = k === tab;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={busy}
              onClick={() => setTab(k)}
              className={
                'px-3 py-1.5 text-sm rounded-lg transition inline-flex items-center gap-1.5 disabled:opacity-50 ' +
                (active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700')
              }
            >
              {t(`emission.tabs.${k}`)}
              {k === 'contingencia' && queue.length > 0 && (
                <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5">{queue.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {state.dianDown && tab !== 'contingencia' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          <SignalSlashIcon className="w-5 h-5 flex-shrink-0" />
          <span>{t('emission.dianDownBanner')}</span>
        </div>
      )}

      {tab === 'contingencia' ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 p-4 text-sm text-secondary-700 dark:text-secondary-200">
            <p className="font-semibold text-secondary-900 dark:text-white">{t('contingency.title')}</p>
            <p className="mt-1">{t('contingency.text')}</p>
            <p className="mt-2 text-xs text-secondary-500">{t('contingency.tip')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {state.dianDown ? (
              <>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <SignalSlashIcon className="w-5 h-5" /> {t('contingency.active')}
                </span>
                <Button onClick={transmitQueue} isLoading={transmitting !== null} disabled={busy}>
                  <WifiIcon className="w-4 h-4 mr-2" />
                  {queue.length ? t('contingency.restore', { n: queue.length }) : t('contingency.restoreEmpty')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDianDown(true)} disabled={busy}>
                  <SignalSlashIcon className="w-4 h-4 mr-2" /> {t('contingency.toggleOn')}
                </Button>
                {queue.length > 0 && (
                  <Button onClick={transmitQueue} isLoading={transmitting !== null} disabled={busy}>
                    <WifiIcon className="w-4 h-4 mr-2" /> {t('contingency.transmitPending', { n: queue.length })}
                  </Button>
                )}
              </>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('contingency.queueTitle')}</p>
            {queue.length === 0 ? (
              <p className="text-sm text-secondary-500">{t('contingency.queueEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {queue.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 text-sm">
                    <span className="font-mono">{d.id}</span>
                    <span className="flex-1 min-w-0 truncate text-secondary-600 dark:text-secondary-300">{d.client.name}</span>
                    <span className="tabular-nums">{formatCOP(docTotals(d).total)}</span>
                    {transmitting === d.id ? (
                      <span className="inline-flex items-center gap-1 text-primary-600 text-xs">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" /> {t('contingency.transmitting')}
                      </span>
                    ) : (
                      <StatusBadge status={d.status} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {success.status === 'accepted' ? (
              <CheckCircleIcon className="w-10 h-10 text-green-600 flex-shrink-0" />
            ) : (
              <SignalSlashIcon className="w-10 h-10 text-amber-600 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                {success.status === 'accepted'
                  ? t('success.accepted', { doc: `${t(`docTypesShort.${success.type}`)} ${success.id}` })
                  : t('success.queued', { doc: `${t(`docTypesShort.${success.type}`)} ${success.id}` })}
              </h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {success.status === 'accepted'
                  ? success.client.email
                    ? t('success.acceptedSub', { email: success.client.email })
                    : t('success.acceptedNoEmail')
                  : t('success.queuedSub')}
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{formatCOP(docTotals(success).total)}</p>
            </div>
          </div>
          {phaseList}
          <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
            <QrSvg text={qrText(success, issuer)} size={120} label={t('preview.qrAlt', { id: success.id })} />
            <div className="min-w-0 text-xs">
              <p className="uppercase tracking-wide text-secondary-500">{success.type === 'factura' ? t('success.cufeLabel') : t('success.cudeLabel')}</p>
              <p className="font-mono break-all text-secondary-800 dark:text-secondary-100">{success.cufe}</p>
              <p className="mt-2 text-secondary-500 dark:text-secondary-400">{t('success.cufeNote')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadPdf(success)}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('success.pdf')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadXml(success)}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('success.xml')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDetailId(success.id)}>
              <EyeIcon className="w-4 h-4 mr-1" /> {t('success.view')}
            </Button>
            <Button size="sm" onClick={another}>
              {t('success.another')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {docType === 'factura' && <BuyerForm draft={draft} setDraft={setDraft} docs={state.docs} />}
          {docType === 'pos' && (
            <>
              <PosBuyer draft={draft} setDraft={setDraft} />
              {draft.posWithBuyer && <BuyerForm draft={draft} setDraft={setDraft} docs={state.docs} />}
            </>
          )}
          {isNote(docType) && <NoteForm draft={draft} setDraft={setDraft} docs={state.docs} />}
          {(docType === 'factura' || docType === 'pos') && (
            <LinesEditor draft={draft} setDraft={setDraft} showRete={docType === 'factura'} />
          )}
          {(docType === 'factura' || docType === 'pos') && (
            <PaymentFields draft={draft} setDraft={setDraft} allowCredit={docType === 'factura'} />
          )}
          {docType === 'factura' && draft.paymentForm === 'credito' && (
            <p className="-mt-3 text-xs text-secondary-500">
              {t('form.dueDate', { date: formatDate(addDays(DEMO_TODAY, draft.creditDays), months) })}
            </p>
          )}
          <TotalsSummary totals={totals} showRete={docType === 'factura'} />
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {docType === 'factura'
              ? t('emission.resolution', {
                  number: RESOLUTION.number,
                  date: formatDate(RESOLUTION.date, months),
                  prefix,
                  from: RESOLUTION.from,
                  to: RESOLUTION.to,
                  next: `${prefix}${next}`,
                  left: groupThousands(Math.max(0, RESOLUTION.to - next + 1)),
                })
              : t('emission.nextNumber', { next: `${prefix}${next}` })}
          </p>
          <IssuesList issues={issues} />
          {phase && phaseList}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={emit} isLoading={phase !== null} disabled={busy || issues.length > 0}>
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              {state.dianDown ? t('emission.emitContingency') : t(`emission.emit.${docType}`)}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setDraft(() => draftForType(docType))}
            >
              {t('emission.clear')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
