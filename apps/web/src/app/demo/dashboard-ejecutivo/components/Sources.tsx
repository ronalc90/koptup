'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, CircleStackIcon, DocumentTextIcon, LockClosedIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import {
  buildUploadDataset,
  guessMapping,
  MAX_FILE_BYTES,
  MAX_ROWS,
  OPTIONAL_FIELDS,
  parseCsv,
  REQUIRED_FIELDS,
  toCsv,
  type Field,
  type Mapping,
  type ParsedCsv,
} from '../lib/csv';
import { slugify } from '../lib/format';
import { useDashboard } from '../lib/store';
import { btn, card, downloadText, labelCls, Note, NS, SectionTitle, selectCls, useFmt, useLabels } from './ui';

const CONNECTORS = ['csv', 'sheets', 'postgres', 'siigo', 'sapb1', 'hubspot'] as const;

export default function Sources() {
  const t = useTranslations(`${NS}.sources`);
  const ts = useTranslations(`${NS}.sectors`);
  const fmt = useFmt();
  const labels = useLabels();
  const { dataset, setUpload, company, ctx, notify, setView } = useDashboard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Mapping>({});
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const readFile = (file: File) => {
    setError(null);
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError(t('errors.type'));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t('errors.size', { mb: MAX_FILE_BYTES / 1024 / 1024 }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const p = parseCsv(text);
      if (!p.headers.length || !p.rows.length) {
        setError(t('errors.empty'));
        return;
      }
      setParsed(p);
      setFileName(file.name);
      setMapping(guessMapping(p.headers));
    };
    reader.onerror = () => setError(t('errors.read'));
    reader.readAsText(file, 'utf-8');
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const missing = REQUIRED_FIELDS.filter((f) => mapping[f] === undefined);

  const apply = () => {
    if (!parsed) return;
    const res = buildUploadDataset(parsed, mapping, fileName, dataset.sector, {
      noCity: t('placeholders.noCity'),
      noLine: t('placeholders.noLine'),
      noSeller: t('placeholders.noSeller'),
    });
    if (!res.dataset) {
      setError(t('errors.noRows', { badDate: res.reasons.badDate, badValue: res.reasons.badValue, noCustomer: res.reasons.noCustomer }));
      return;
    }
    setUpload(res.dataset);
    setParsed(null);
    notify(
      res.skipped
        ? t('loadedSkipped', { used: res.used, skipped: res.skipped, file: fileName })
        : t('loaded', { used: res.used, file: fileName }),
    );
    if (res.truncated) notify(t('truncated', { max: MAX_ROWS }), 'info');
    setView('resumen');
  };

  const downloadSample = () => {
    const rows = dataset.rows;
    const csv = toCsv(
      [t('template.date'), t('template.invoice'), t('template.customer'), t('template.city'), t('template.line'), t('template.seller'), t('template.value'), t('template.cost')],
      rows.map((r) => [r.date, r.id, r.customer, r.city, labels.line(r.line), r.seller, Math.round(r.value), r.cost !== null ? Math.round(r.cost) : null]),
      fmt.loc,
    );
    const file = `ventas-${slugify(dataset.source === 'sample' ? company.name : dataset.fileName ?? 'archivo')}.csv`;
    downloadText(csv, file, 'text/csv;charset=utf-8');
    notify(t('downloaded', { file, count: rows.length }));
  };

  const fieldSelect = (f: Field, required: boolean) => (
    <div key={f}>
      <label htmlFor={`map-${f}`} className={labelCls}>
        {t(`fields.${f}`)} {required ? <span className="text-red-600">*</span> : <span className="font-normal text-slate-400">({t('optional')})</span>}
      </label>
      <select
        id={`map-${f}`}
        value={mapping[f] ?? ''}
        onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value === '' ? undefined : Number(e.target.value) }))}
        className={selectCls}
      >
        <option value="">{t('noColumn')}</option>
        {parsed!.headers.map((h, i) => (
          <option key={`${h}-${i}`} value={i}>
            {h || t('columnN', { n: i + 1 })}
          </option>
        ))}
      </select>
    </div>
  );

  const sample = dataset.source === 'sample';

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 sm:p-6`} aria-labelledby="src-current">
        <SectionTitle title={<span id="src-current">{t('currentTitle')}</span>} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white self-start">
            {sample ? <CircleStackIcon className="w-7 h-7" aria-hidden="true" /> : <DocumentTextIcon className="w-7 h-7" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {sample ? t('sampleName', { company: company.name, sector: ts(`${dataset.sector}.name`) }) : t('uploadName', { file: dataset.fileName ?? '' })}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('stats', {
                rows: fmt.num(dataset.rows.length),
                customers: ctx.idx.customers.length,
                from: fmt.month(dataset.months[0], true),
                to: fmt.month(dataset.months[dataset.months.length - 1], true),
                cutoff: fmt.date(dataset.cutoff),
              })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sample ? t('sampleHow') : t('uploadHow')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.outline} onClick={downloadSample}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
              {sample ? t('downloadSample') : t('downloadUpload')}
            </button>
            {!sample && (
              <button type="button" className={btn.primary} onClick={() => setUpload(null)}>
                <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
                {t('backToSample')}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="src-upload">
        <SectionTitle title={<span id="src-upload">{t('uploadTitle')}</span>} subtitle={t('uploadSubtitle')} />
        {!parsed ? (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-slate-300 dark:border-slate-700'}`}
            >
              <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-purple-600" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('dropHint')}</p>
              <button type="button" className={`${btn.primary} mt-3`} onClick={() => inputRef.current?.click()}>
                {t('choose')}
              </button>
              <input ref={inputRef} type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={onInput} tabIndex={-1} aria-hidden="true" data-testid="exec-csv-input" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('limits', { mb: MAX_FILE_BYTES / 1024 / 1024, rows: fmt.num(MAX_ROWS) })}</p>
            </div>
            <ul className="mt-4 text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc pl-5">
              <li>{t('format.required')}</li>
              <li>{t('format.optional')}</li>
              <li>{t('format.excel')}</li>
              <li>{t('format.numbers')}</li>
            </ul>
          </>
        ) : (
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">
              {t('parsed', { file: fileName, rows: fmt.num(parsed.rows.length), cols: parsed.headers.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REQUIRED_FIELDS.map((f) => fieldSelect(f, true))}
              {OPTIONAL_FIELDS.map((f) => fieldSelect(f, false))}
            </div>
            <h4 className="text-sm font-semibold mt-5 mb-2 text-slate-800 dark:text-slate-100">{t('preview')}</h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    {parsed.headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                        {h || t('columnN', { n: i + 1 })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      {parsed.headers.map((_, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap max-w-[220px] truncate">
                          {r[j] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {missing.length > 0 && (
              <div className="mt-3">
                <Note tone="amber">{t('missing', { fields: missing.map((f) => t(`fields.${f}`)).join(', ') })}</Note>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={btn.primary} onClick={apply} disabled={missing.length > 0}>
                {t('use')}
              </button>
              <button
                type="button"
                className={btn.outline}
                onClick={() => {
                  setParsed(null);
                  setError(null);
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex items-start gap-2">
          <LockClosedIcon className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('privacy')}</p>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="src-conn">
        <SectionTitle title={<span id="src-conn">{t('connectorsTitle')}</span>} subtitle={t('connectorsSubtitle')} />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONNECTORS.map((c) => (
            <li key={c} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />
                <h4 className="font-semibold text-slate-900 dark:text-white">{t(`connectors.${c}.name`)}</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t(`connectors.${c}.desc`)}</p>
              <span className="mt-2 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('inProject')}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Note>{t('connectorsNote')}</Note>
        </div>
      </section>
    </div>
  );
}
