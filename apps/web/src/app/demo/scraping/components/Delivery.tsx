'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import {
  ArrowDownTrayIcon, BellAlertIcon, ChartBarIcon, ClipboardDocumentIcon, CodeBracketIcon, TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useDemo } from '../lib/store';
import type { SourceId } from '../lib/types';
import { displayData } from '../lib/view';
import { csvName } from './Overview';
import { Panel, Section, btn, buildCsv, buildJson, colLabel, copyText, downloadText, exportCell, formatCell } from './ui';

type Open = 'sheets' | 'bi' | 'api' | null;

export default function Delivery({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { s, loc, markTour, setTab } = useDemo();
  const [open, setOpen] = useState<Open>(null);
  const r = s.results[sourceId];
  const { columns, rows } = useMemo(() => displayData(sourceId, s), [sourceId, s]);

  const payload = useMemo(() => {
    if (!r) return '';
    const pick = (row: Record<string, unknown>) => Object.fromEntries(columns.map((c) => [c.key, exportCell(c, row[c.key] as never, t)]));
    return JSON.stringify(
      {
        evento: 'ejecucion.completada',
        fuente: sourceId,
        ejecucion: r.at,
        registros: rows.length,
        calidad: r.quality,
        cambios: r.changes.slice(0, 3).map((ch) => ({ tipo: ch.kind, clave: ch.key, titulo: ch.title, campos: ch.diffs.map((d) => ({ campo: d.label ?? d.field, antes: d.before, despues: d.after })) })),
        ejemplo_registro: rows[0] ? pick(rows[0]) : null,
      },
      null,
      2,
    );
  }, [r, rows, columns, sourceId, t]);

  if (!r) return null;

  const csv = () => {
    const name = csvName(sourceId, 'csv');
    downloadText(name, buildCsv(columns, rows, t, loc), 'text/csv;charset=utf-8');
    markTour('download');
    notify.success(t('delivery.downloaded', { file: name }));
  };
  const json = () => {
    const name = csvName(sourceId, 'json');
    downloadText(name, buildJson(columns, rows, t), 'application/json');
    notify.success(t('delivery.downloaded', { file: name }));
  };

  const projectBadge = <span className="rounded-full bg-secondary-800 px-2 py-0.5 text-[10px] text-secondary-300">{t('delivery.inProject')}</span>;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <Section
      id="scraping-delivery" title={t('delivery.title')} subtitle={t('delivery.subtitle')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5 text-emerald-300" />
              <h3 className="text-sm font-semibold text-white">{t('delivery.files.title')}</h3>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">{t('delivery.inDemo')}</span>
          </div>
          <p className="mt-2 text-xs text-secondary-400">{t('delivery.files.text', { count: rows.length, source: t(`sources.${sourceId}.name`) })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={csv}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('actions.downloadCsv')}
            </button>
            <button type="button" className={btn.secondary} onClick={json}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('actions.downloadJson')}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-secondary-500">{t('delivery.files.note')}</p>
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <TableCellsIcon className="h-5 w-5 text-emerald-300" />
              <h3 className="text-sm font-semibold text-white">{t('delivery.sheets.title')}</h3>
            </div>
            {projectBadge}
          </div>
          <p className="mt-2 text-xs text-secondary-400">{t('delivery.sheets.text')}</p>
          <button type="button" className={`${btn.secondary} mt-3`} aria-expanded={open === 'sheets'} onClick={() => setOpen(open === 'sheets' ? null : 'sheets')}>
            {open === 'sheets' ? t('delivery.hideExample') : t('delivery.showExample')}
          </button>
          {open === 'sheets' && (
            <div className="mt-3 overflow-x-auto rounded border border-secondary-700 bg-white">
              <table className="min-w-full text-[11px] text-secondary-800">
                <thead>
                  <tr className="bg-secondary-100 text-secondary-500">
                    <th className="w-6 border border-secondary-200 px-1" />
                    {columns.slice(0, 5).map((c, i) => <th key={c.key} className="border border-secondary-200 px-2 font-normal">{letters[i]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-secondary-200 bg-secondary-100 px-1 text-center text-secondary-500">1</td>
                    {columns.slice(0, 5).map((c) => <td key={c.key} className="whitespace-nowrap border border-secondary-200 px-2 font-semibold">{colLabel(c, t)}</td>)}
                  </tr>
                  {rows.slice(0, 4).map((row, i) => (
                    <tr key={i}>
                      <td className="border border-secondary-200 bg-secondary-100 px-1 text-center text-secondary-500">{i + 2}</td>
                      {columns.slice(0, 5).map((c) => <td key={c.key} className="max-w-[180px] truncate whitespace-nowrap border border-secondary-200 px-2">{formatCell(c, row[c.key], t, loc)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-emerald-300" />
              <h3 className="text-sm font-semibold text-white">{t('delivery.bi.title')}</h3>
            </div>
            {projectBadge}
          </div>
          <p className="mt-2 text-xs text-secondary-400">{t('delivery.bi.text')}</p>
          <button type="button" className={`${btn.secondary} mt-3`} aria-expanded={open === 'bi'} onClick={() => setOpen(open === 'bi' ? null : 'bi')}>
            {open === 'bi' ? t('delivery.hideExample') : t('delivery.showExample')}
          </button>
          {open === 'bi' && (
            <div className="mt-3 overflow-x-auto">
              <p className="mb-1 font-mono text-[11px] text-secondary-300">{t('delivery.bi.table', { name: `extraccion_${sourceId}` })}</p>
              <table className="w-full min-w-[320px] text-[11px]">
                <thead className="text-secondary-500"><tr><th className="py-1 pr-2 text-left font-medium">{t('delivery.bi.column')}</th><th className="py-1 text-left font-medium">{t('delivery.bi.type')}</th></tr></thead>
                <tbody className="divide-y divide-secondary-800 text-secondary-200">
                  {columns.map((c) => (
                    <tr key={c.key}><td className="py-1 pr-2">{colLabel(c, t)}</td><td className="py-1 font-mono text-cyan-300">{t(`delivery.bi.types.${c.type}`)}</td></tr>
                  ))}
                  <tr><td className="py-1 pr-2">{t('delivery.bi.runAt')}</td><td className="py-1 font-mono text-cyan-300">{t('delivery.bi.types.date')}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="h-5 w-5 text-emerald-300" />
              <h3 className="text-sm font-semibold text-white">{t('delivery.api.title')}</h3>
            </div>
            {projectBadge}
          </div>
          <p className="mt-2 text-xs text-secondary-400">{t('delivery.api.text')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn.secondary} aria-expanded={open === 'api'} onClick={() => setOpen(open === 'api' ? null : 'api')}>
              {open === 'api' ? t('delivery.hideExample') : t('delivery.showExample')}
            </button>
            {open === 'api' && (
              <button
                type="button"
                className={btn.secondary}
                onClick={async () => {
                  const ok = await copyText(payload);
                  if (ok) notify.success(t('actions.copied'));
                  else notify.error(t('actions.copyFailed'));
                }}
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                {t('actions.copy')}
              </button>
            )}
          </div>
          {open === 'api' && (
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-secondary-800 bg-secondary-950 p-3 font-mono text-[11px] text-cyan-200">{payload}</pre>
          )}
        </Panel>

        <Panel className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellAlertIcon className="h-5 w-5 text-emerald-300" />
              <div>
                <h3 className="text-sm font-semibold text-white">{t('delivery.notify.title')}</h3>
                <p className="text-xs text-secondary-400">{t('delivery.notify.text')}</p>
              </div>
            </div>
            <button type="button" className={btn.secondary} onClick={() => setTab('alerts')}>{t('delivery.notify.button')}</button>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
