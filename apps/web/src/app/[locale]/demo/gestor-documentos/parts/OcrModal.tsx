'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fmtCop } from '../lib/dates';
import { invoiceTotals } from '../lib/sample';
import { useDocs } from '../lib/store';
import type { DocItem, OcrField } from '../lib/types';
import { downloadBlob, isValidNit, safeFileName, toCsv } from '../lib/util';
import { InvoiceScan } from './Preview';
import { Modal, Note, btnSecondary } from './ui';

function parseCop(v: string): number {
  return Number(v.replace(/[^\d]/g, '')) || 0;
}

export default function OcrModal({ doc, onClose }: { doc: DocItem | null; onClose: () => void }) {
  const t = useTranslations('demoDocs');
  const { toast } = useDocs();
  const [highlight, setHighlight] = useState(true);
  const ocr = doc?.ocr;

  const get = (k: OcrField['key']) => ocr?.fields.find((f) => f.key === k)?.value ?? '';
  const totals = ocr ? invoiceTotals(ocr.lines) : { subtotal: 0, iva: 0, total: 0 };
  const checks = ocr
    ? [
        { key: 'nit', ok: isValidNit(get('nit')) },
        { key: 'lines', ok: totals.subtotal === parseCop(get('subtotal')) },
        { key: 'total', ok: parseCop(get('subtotal')) + parseCop(get('iva')) === parseCop(get('total')) },
      ]
    : [];

  const download = () => {
    if (!doc || !ocr) return;
    const rows: (string | number)[][] = [[t('ocr.csvField'), t('ocr.csvValue'), t('ocr.csvConfidence')]];
    ocr.fields.forEach((f) => rows.push([t(`ocr.fields.${f.key}`), f.value, Math.round(f.confidence * 100)]));
    rows.push([]);
    rows.push([t('ocr.headers.concept'), t('ocr.headers.qty'), t('ocr.headers.unit'), t('ocr.headers.total')]);
    ocr.lines.forEach((l) => rows.push([l.concept, l.qty, l.unit, l.qty * l.unit]));
    downloadBlob(toCsv(rows), `ocr-${safeFileName(doc.name.replace(/\.[a-z]+$/i, ''))}.csv`, 'text/csv;charset=utf-8');
    toast('success', t('toasts.downloaded'));
  };

  return (
    <Modal
      open={Boolean(doc && ocr)}
      onClose={onClose}
      size="xl"
      title={t('ocr.title')}
      subtitle={doc?.name}
      icon={<DocumentMagnifyingGlassIcon className="h-6 w-6" />}
      footer={
        <button type="button" onClick={download} className={btnSecondary}>
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t('ocr.download')}
        </button>
      }
    >
      {doc && ocr && (
        <div className="space-y-4">
          <Note>{t('ocr.note')}</Note>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('ocr.image')}</h3>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  {t('ocr.highlight')}
                </label>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700">
                <InvoiceScan doc={doc} highlight={highlight} />
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{t('ocr.fieldsTitle')}</h3>
                <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
                  {ocr.fields.map((f) => {
                    const low = f.confidence < 0.9;
                    return (
                      <div key={f.key} className="grid grid-cols-[110px_1fr] gap-2 px-3 py-2 sm:grid-cols-[140px_1fr]">
                        <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t(`ocr.fields.${f.key}`)}</dt>
                        <dd className="min-w-0">
                          <span className={`break-all text-slate-900 dark:text-white ${f.key === 'cufe' ? 'font-mono text-[11px]' : ''}`}>{f.value}</span>
                          <span className={`ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${low ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>
                            {low && <ExclamationTriangleIcon className="h-3 w-3" />}
                            {t('ocr.confidence', { pct: Math.round(f.confidence * 100) })}
                            {low && ` · ${t('ocr.review')}`}
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{t('ocr.checksTitle')}</h3>
                <ul className="space-y-1 text-sm">
                  {checks.map((c) => (
                    <li key={c.key} className={`flex items-start gap-2 ${c.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                      {c.ok ? <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />}
                      {t(`ocr.checks.${c.key}${c.ok ? 'Ok' : 'Bad'}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{t('ocr.linesTitle')}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t('ocr.headers.concept')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.qty')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.unit')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {ocr.lines.map((l) => (
                    <tr key={l.concept}>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{l.concept}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{l.qty}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{fmtCop(l.unit)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{fmtCop(l.qty * l.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('ocr.totalsLine', { subtotal: fmtCop(totals.subtotal), iva: fmtCop(totals.iva), total: fmtCop(totals.total) })}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
