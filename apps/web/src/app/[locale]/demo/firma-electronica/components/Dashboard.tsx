'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownTrayIcon,
  BellAlertIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { fmtDate, fmtDuration } from '../lib/dates';
import { downloadCsv } from '../lib/files';
import { acts, computeMetrics, whoIsNext } from '../lib/logic';
import { useFirma } from '../lib/store';
import { ENV_STATUSES, type EnvStatus, type Envelope } from '../lib/types';
import { Modal, Panel, SimNote, StatusBadge, focusRing, inputCls, selectCls, smallBtn } from './ui';
import { EvidenceView } from './Evidence';
import { downloadSignedPdf } from './pdfSpecs';

export default function Dashboard() {
  const t = useTranslations('demoSign');
  const store = useFirma();
  const { s, now, loc, go, envTitle, highlight, startDraft, editEnvelope, remindEnv, voidEnv, deleteDraftEnvelope, toast } = store;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | EnvStatus>('all');
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const m = computeMetrics(s.envelopes, now);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...s.envelopes]
      .filter((e) => status === 'all' || e.status === status)
      .filter((e) => !needle || envTitle(e).toLowerCase().includes(needle) || e.id.toLowerCase().includes(needle) || e.signers.some((x) => x.name.toLowerCase().includes(needle)))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [s.envelopes, q, status, envTitle]);

  const byId = (id: string | null) => s.envelopes.find((e) => e.id === id) ?? null;
  const evidenceEnv = byId(evidenceId);
  const voidEnvTarget = byId(voidId);
  const deleteTarget = byId(deleteId);

  const exportCsv = () => {
    const sep = loc === 'en' ? ',' : ';';
    downloadCsv(
      t('home.csvName'),
      (t.raw('home.csvHeaders') as string[]),
      list.map((e) => [
        e.id,
        envTitle(e),
        t(`status.${e.status}`),
        e.signers.map((x) => `${x.name} (${t(`roles.${x.role}`)})`).join(' | '),
        `${e.signers.filter((x) => acts(x) && x.state === 'signed').length}/${e.signers.filter(acts).length}`,
        e.createdAt.replace('T', ' '),
        e.sentAt?.replace('T', ' ') ?? '',
        e.completedAt?.replace('T', ' ') ?? '',
        e.status === 'sent' || e.status === 'partial' ? (e.expiresAt?.replace('T', ' ') ?? '') : '',
        e.doc.hash,
      ]),
      sep,
    );
    toast(t('home.csvDone', { n: list.length }));
  };

  const cards = [
    { key: 'pending', value: String(m.pending), hint: t('home.metrics.pendingHint', { n: m.drafts }), icon: ClockIcon, color: 'from-amber-500 to-orange-600' },
    { key: 'signedMonth', value: String(m.signedMonth), hint: t('home.metrics.signedMonthHint', { n: m.completed }), icon: CheckBadgeIcon, color: 'from-emerald-500 to-green-700' },
    {
      key: 'rate',
      value: m.rate === null ? '—' : `${m.rate} %`,
      hint: t('home.metrics.rateHint', { done: m.completed, closed: m.closed }),
      icon: ShieldCheckIcon,
      color: 'from-sky-500 to-indigo-600',
    },
    { key: 'avg', value: m.avgMinutes === null ? '—' : fmtDuration(m.avgMinutes, loc), hint: t('home.metrics.avgHint'), icon: BellAlertIcon, color: 'from-lime-600 to-lime-800' },
  ];

  const actions = (e: Envelope) => {
    const btn = `${smallBtn} border border-secondary-200 text-secondary-700 hover:bg-secondary-100 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800`;
    const out = [];
    if (e.status === 'draft') {
      out.push(
        <button key="edit" type="button" className={btn} onClick={() => { editEnvelope(e.id); go('create'); }}>
          <PencilSquareIcon className="h-3.5 w-3.5" /> {t('home.actions.continue')}
        </button>,
        <button key="del" type="button" className={`${btn} text-red-700 dark:text-red-300`} onClick={() => setDeleteId(e.id)}>
          <TrashIcon className="h-3.5 w-3.5" /> {t('home.actions.delete')}
        </button>,
      );
      return out;
    }
    if (e.status === 'sent' || e.status === 'partial') {
      const next = whoIsNext(e)[0];
      out.push(
        <button key="sign" type="button" className={btn} onClick={() => go('signer', { envId: e.id, signerId: next?.id ?? '' })}>
          <PencilSquareIcon className="h-3.5 w-3.5" /> {t('home.actions.sign')}
        </button>,
        <button
          key="remind"
          type="button"
          className={btn}
          onClick={() => {
            remindEnv(e.id);
            toast(t('home.remindDone', { names: whoIsNext(e).map((x) => x.name).join(', ') }), 'info');
          }}
        >
          <BellAlertIcon className="h-3.5 w-3.5" /> {t('home.actions.remind')}
        </button>,
      );
    }
    out.push(
      <button key="evidence" type="button" className={btn} onClick={() => setEvidenceId(e.id)}>
        <ShieldCheckIcon className="h-3.5 w-3.5" /> {t('home.actions.evidence')}
      </button>,
    );
    if (e.status === 'completed') {
      out.push(
        <button key="pdf" type="button" className={btn} onClick={() => downloadSignedPdf(e, store, t).then(() => toast(t('pdf.signedDone')))}>
          <ArrowDownTrayIcon className="h-3.5 w-3.5" /> {t('home.actions.signedPdf')}
        </button>,
      );
    }
    if (e.status === 'sent' || e.status === 'partial') {
      out.push(
        <button key="void" type="button" className={`${btn} text-red-700 dark:text-red-300`} onClick={() => setVoidId(e.id)}>
          <NoSymbolIcon className="h-3.5 w-3.5" /> {t('home.actions.void')}
        </button>,
      );
    }
    if (e.status === 'expired' || e.status === 'voided') {
      out.push(
        <button key="dup" type="button" className={btn} onClick={() => { editEnvelope(e.id, true); go('create'); toast(t('home.duplicated'), 'info'); }}>
          <DocumentDuplicateIcon className="h-3.5 w-3.5" /> {t('home.actions.duplicate')}
        </button>,
      );
    }
    return out;
  };

  const progress = (e: Envelope) => {
    const acting = e.signers.filter(acts);
    return `${acting.filter((x) => x.state === 'signed').length}/${acting.length}`;
  };

  const detailLine = (e: Envelope) => {
    if (e.status === 'sent' || e.status === 'partial') {
      const next = whoIsNext(e);
      const names = next.map((x) => x.name).join(', ');
      return `${t(e.mode === 'sequential' ? 'home.nextTurn' : 'home.pendingOf', { names })} · ${t('home.expires', { date: fmtDate(e.expiresAt ?? now, loc) })}`;
    }
    if (e.status === 'completed' && e.completedAt) return t('home.completedOn', { date: fmtDate(e.completedAt, loc) });
    if (e.status === 'expired' && e.expiresAt) return t('home.expiredOn', { date: fmtDate(e.expiresAt, loc) });
    if (e.status === 'draft') return t('home.draftHint');
    return t('home.voidedHint');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ key, value, hint, icon: Icon, color }) => (
          <div key={key} data-metric={key} className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t(`home.metrics.${key}`)}</p>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p data-value className="mt-1 text-2xl font-bold sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{hint}</p>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('home.metrics.note')}</p>

      <Panel
        title={t('home.listTitle')}
        subtitle={t('home.listSubtitle')}
        actions={
          <>
            <Button size="sm" onClick={() => { startDraft(); go('create'); }}>
              <PlusIcon className="mr-1 h-4 w-4" /> {t('home.new')}
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={list.length === 0}>
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('home.exportCsv')}
            </Button>
          </>
        }
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">{t('home.search')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input className={`${inputCls} pl-9`} placeholder={t('home.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="block">
            <span className="sr-only">{t('home.statusFilter')}</span>
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as 'all' | EnvStatus)}>
              <option value="all">{t('home.allStatuses', { n: s.envelopes.length })}</option>
              {ENV_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`status.${st}`)} ({s.envelopes.filter((e) => e.status === st).length})
                </option>
              ))}
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-secondary-300 p-6 text-center text-sm text-secondary-500 dark:border-secondary-700">{t('home.empty')}</p>
        ) : (
          <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {list.map((e) => (
              <li
                key={e.id}
                className={`grid gap-2 py-3 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1.5fr)_minmax(0,1.6fr)] lg:items-center lg:gap-4 ${highlight === e.id ? 'rounded-lg bg-lime-50 px-2 dark:bg-lime-950/40' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <DocumentTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" />
                    <div className="min-w-0">
                      <p className="break-words font-medium text-secondary-900 dark:text-white">{envTitle(e)}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {e.id} · {t('home.updated', { date: fmtDate(e.updatedAt, loc) })}
                        {e.origin === 'bulk' ? ` · ${t('home.fromBulk')}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0 pl-6 lg:pl-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.status} />
                    {e.status !== 'draft' && <span className="text-xs text-secondary-600 dark:text-secondary-300">{t('home.signatures', { p: progress(e) })}</span>}
                  </div>
                  <p className="mt-1 break-words text-xs text-secondary-500 dark:text-secondary-400">{detailLine(e)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6 lg:justify-end lg:pl-0">{actions(e)}</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t('home.types.title')} subtitle={t('home.types.subtitle')}>
        <div className="grid gap-3 md:grid-cols-3">
          {(['electronic', 'digital', 'timestamp'] as const).map((k) => (
            <div key={k} className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <p className="font-semibold text-secondary-900 dark:text-white">{t(`home.types.${k}.name`)}</p>
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">{t(`home.types.${k}.what`)}</p>
              <p className="mt-2 text-xs font-medium text-lime-800 dark:text-lime-300">{t(`home.types.${k}.demo`)}</p>
            </div>
          ))}
        </div>
        <SimNote className="mt-3">{t('home.types.note')}</SimNote>
      </Panel>

      <Modal open={!!evidenceEnv} onClose={() => setEvidenceId(null)} title={evidenceEnv ? t('evidence.modalTitle', { id: evidenceEnv.id }) : ''} wide>
        {evidenceEnv && <EvidenceView env={evidenceEnv} />}
      </Modal>

      <Modal open={!!voidEnvTarget} onClose={() => setVoidId(null)} title={t('home.voidTitle')}>
        {voidEnvTarget && (
          <div className="space-y-4 text-sm">
            <p>{t('home.voidText', { title: envTitle(voidEnvTarget) })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setVoidId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  voidEnv(voidEnvTarget.id);
                  setVoidId(null);
                  toast(t('home.voidDone', { id: voidEnvTarget.id }), 'info');
                }}
              >
                {t('home.voidYes')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteId(null)} title={t('home.deleteTitle')}>
        {deleteTarget && (
          <div className="space-y-4 text-sm">
            <p>{t('home.deleteText', { title: envTitle(deleteTarget) })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className={focusRing}
                onClick={() => {
                  deleteDraftEnvelope(deleteTarget.id);
                  setDeleteId(null);
                  toast(t('home.deleteDone'), 'info');
                }}
              >
                {t('home.deleteYes')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
