'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { dayOf, fmtDate } from '../lib/dates';
import { queryTerms, rank } from '../lib/search';
import { useDocs } from '../lib/store';
import type { DocItem } from '../lib/types';
import { downloadBlob, keepUntil, ruleFor, toCsv } from '../lib/util';
import { indexDocs } from '../lib/view';
import { Modal, Note, btnPrimary, btnSecondary, inputCls, labelCls } from './ui';

export const INVENTORY_COLS = ['name', 'folder', 'type', 'size', 'date', 'state', 'tags', 'keepUntil', 'hold'] as const;
type InventoryCol = (typeof INVENTORY_COLS)[number];

/** Fila del inventario (CSV del listado y del paquete para auditoría). */
export function useInventoryRow() {
  const t = useTranslations('demoDocs');
  const { folderLabel, retention } = useDocs();
  const header = INVENTORY_COLS.map((h) => t(`audit.cols.${h}`));
  const row = (d: DocItem): Record<InventoryCol, string | number> => {
    const rule = ruleFor(retention, d.folder);
    const keep = keepUntil(d.createdAt, rule.policy);
    return {
      name: d.name,
      folder: folderLabel(d.folder),
      type: t(`toolbar.types.${d.kind}`),
      size: d.sizeBytes,
      date: dayOf(d.createdAt),
      state: d.deleted ? t('audit.stateTrash') : t('audit.stateActive'),
      tags: d.tags.join('; '),
      keepUntil: keep === 'perm' ? t('retention.policies.perm') : keep || '',
      hold: rule.hold ? t('audit.yes') : t('audit.no'),
    };
  };
  const csv = (docs: DocItem[]) => toCsv([header, ...docs.map((d) => INVENTORY_COLS.map((h) => row(d)[h]))]);
  return { row, csv };
}

export default function AuditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoDocs');
  const { docs, folders, folderLabel, loc, now, mode, toast } = useDocs();
  const { row, csv } = useInventoryRow();
  const [keywords, setKeywords] = useState('');
  const [folder, setFolder] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeTrash, setIncludeTrash] = useState(false);

  const matches = useMemo(() => {
    let list = docs.filter((d) => (includeTrash ? true : !d.deleted));
    if (folder) list = list.filter((d) => d.folder === folder);
    if (from) list = list.filter((d) => dayOf(d.createdAt) >= from);
    if (to) list = list.filter((d) => dayOf(d.createdAt) <= to);
    if (keywords.trim()) {
      const ids = new Set(rank(indexDocs(list), queryTerms(keywords, false)).map((r) => r.id));
      list = list.filter((d) => ids.has(d.id));
    }
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [docs, includeTrash, folder, from, to, keywords]);

  const stamp = now.slice(0, 10);

  const downloadCsv = () => {
    downloadBlob(csv(matches), `paquete-auditoria-${stamp}.csv`, 'text/csv;charset=utf-8');
    toast('success', t('toasts.auditReady', { count: matches.length }));
  };

  const downloadJson = () => {
    const payload = {
      generatedAt: now,
      source: mode === 'sample' ? 'sample-data' : 'account',
      criteria: { keywords, folder: folder ? folderLabel(folder) : null, from: from || null, to: to || null, includeTrash },
      documents: matches.map((d) => ({ ...row(d), text: d.text ?? null, summary: d.summary ?? null })),
    };
    downloadBlob(JSON.stringify(payload, null, 2), `paquete-auditoria-${stamp}.json`, 'application/json');
    toast('success', t('toasts.auditReady', { count: matches.length }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('audit.title')}
      icon={<ScaleIcon className="h-6 w-6" />}
      footer={
        <>
          <button type="button" onClick={downloadJson} disabled={!matches.length} className={btnSecondary}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('audit.downloadJson')}
          </button>
          <button type="button" onClick={downloadCsv} disabled={!matches.length} className={btnPrimary}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('audit.downloadCsv')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Note tone="blue">{mode === 'sample' ? t('audit.noteSample') : t('audit.noteServer')}</Note>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="a-kw" className={labelCls}>{t('audit.keywords')}</label>
            <input id="a-kw" type="text" value={keywords} maxLength={100} onChange={(e) => setKeywords(e.target.value)} placeholder={t('audit.keywordsHint')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-folder" className={labelCls}>{t('audit.folder')}</label>
            <select id="a-folder" value={folder} onChange={(e) => setFolder(e.target.value)} className={inputCls}>
              <option value="">{t('audit.folderAll')}</option>
              {folders.map((f) => (
                <option key={f} value={f}>{folderLabel(f)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a-from" className={labelCls}>{t('audit.from')}</label>
            <input id="a-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="a-to" className={labelCls}>{t('audit.to')}</label>
            <input id="a-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={includeTrash} onChange={(e) => setIncludeTrash(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {t('audit.includeTrash')}
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200" aria-live="polite">{t('audit.matches', { count: matches.length })}</p>
          {matches.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800">
              {matches.map((d) => (
                <li key={d.id} className="flex flex-wrap justify-between gap-2 text-slate-700 dark:text-slate-300">
                  <span className="min-w-0 break-words">{d.name}</span>
                  <span className="shrink-0 text-slate-500">{fmtDate(d.createdAt, loc)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
