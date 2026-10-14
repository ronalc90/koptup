'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { fmtDate } from '../lib/dates';
import { diffWords, summarize } from '../lib/diff';
import { useDocs } from '../lib/store';
import type { DocItem } from '../lib/types';
import { Modal, Note, inputCls, labelCls } from './ui';

export default function VersionsModal({ doc, onClose }: { doc: DocItem | null; onClose: () => void }) {
  const t = useTranslations('demoDocs');
  const { loc } = useDocs();
  const versions = doc?.versions || [];
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const left = versions[Math.min(a, versions.length - 1)];
  const right = versions[Math.min(b, versions.length - 1)];
  const parts = useMemo(() => (left && right ? diffWords(left.text, right.text) : []), [left, right]);
  const s = summarize(parts);

  return (
    <Modal open={Boolean(doc && versions.length > 1)} onClose={onClose} size="xl" title={t('versions.title')} subtitle={doc?.name} icon={<DocumentDuplicateIcon className="h-6 w-6" />}>
      {doc && left && right && (
        <div className="space-y-4">
          <Note tone="blue">{t('versions.note')}</Note>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{t('versions.history')}</h3>
            <ol className="space-y-1 text-sm">
              {versions.map((v) => (
                <li key={v.label} className="flex flex-wrap gap-x-2 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">{v.label}</span>
                  <span>{fmtDate(v.createdAt, loc)}</span>
                  <span>· {v.author}</span>
                  <span>· {v.note}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="v-from" className={labelCls}>{t('versions.from')}</label>
              <select id="v-from" value={a} onChange={(e) => setA(Number(e.target.value))} className={inputCls}>
                {versions.map((v, i) => (
                  <option key={v.label} value={i}>{`${v.label} · ${fmtDate(v.createdAt, loc)}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="v-to" className={labelCls}>{t('versions.to')}</label>
              <select id="v-to" value={b} onChange={(e) => setB(Number(e.target.value))} className={inputCls}>
                {versions.map((v, i) => (
                  <option key={v.label} value={i}>{`${v.label} · ${fmtDate(v.createdAt, loc)}`}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200" aria-live="polite">
            {a === b ? t('versions.same') : t('versions.summary', { changes: s.changes, additions: s.additions, deletions: s.deletions, added: s.addedWords, removed: s.removedWords })}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{left.label} · {left.note}</p>
              <p className="whitespace-pre-wrap">
                {parts.map((p, i) =>
                  p.op === 'add' ? null : p.op === 'del' ? (
                    <del key={i} className="rounded bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100">{p.text}</del>
                  ) : (
                    <span key={i}>{p.before ?? p.text}</span>
                  ),
                )}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{right.label} · {right.note}</p>
              <p className="whitespace-pre-wrap">
                {parts.map((p, i) =>
                  p.op === 'del' ? null : p.op === 'add' ? (
                    <ins key={i} className="rounded bg-emerald-200 text-emerald-900 no-underline dark:bg-emerald-900/60 dark:text-emerald-100">{p.text}</ins>
                  ) : (
                    <span key={i}>{p.text}</span>
                  ),
                )}
              </p>
            </div>
          </div>
          <p className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span><del className="rounded bg-red-200 px-1 text-red-900 dark:bg-red-900/60 dark:text-red-100">{t('versions.legendDel')}</del></span>
            <span><ins className="rounded bg-emerald-200 px-1 text-emerald-900 no-underline dark:bg-emerald-900/60 dark:text-emerald-100">{t('versions.legendAdd')}</ins></span>
          </p>
        </div>
      )}
    </Modal>
  );
}
