'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, CloudArrowUpIcon, PaperAirplaneIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BUILTIN_TEMPLATE_IDS, MAX_BULK_ROWS, MAX_CSV_BYTES, TEMPLATE_SUBJECT_VAR, isBuiltin } from '../lib/data';
import { fmtBytes } from '../lib/dates';
import { buildCsv, formatMobile, parseCsv, readBulk } from '../lib/logic';
import { downloadCsv } from '../lib/files';
import { templateSample } from '../lib/seed';
import { useFirma } from '../lib/store';
import type { BulkRow } from '../lib/types';
import { Panel, SimNote, focusRing, labelCls, selectCls } from './ui';

/** Personas ficticias del CSV de ejemplo (la cuarta trae un correo inválido a propósito). */
const PEOPLE = [
  { name: 'Camila Andrea Rojas', email: 'camila.rojas@correo.example', phone: '3005550121', id: '1.020.111.222' },
  { name: 'Juan David Ospina', email: 'juan.ospina@correo.example', phone: '3005550122', id: '1.032.444.555' },
  { name: 'Valentina Herrera', email: 'valentina.herrera@correo.example', phone: '', id: '1.001.777.888' },
  { name: 'Santiago Morales', email: 'santiago.morales@correo', phone: '3005550124', id: '80.999.111' },
  { name: 'Laura Cristina Vargas', email: 'laura.vargas@correo.example', phone: '3005550125', id: '52.333.666' },
];

export default function Bulk() {
  const t = useTranslations('demoSign');
  const { s, now, loc, text, templateVars, bulkSend, toast, go } = useFirma();
  const [tpl, setTpl] = useState<string>('employment');
  const [rows, setRows] = useState<BulkRow[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [source, setSource] = useState('');

  const vars = templateVars(tpl);
  const label = (v: string) => (isBuiltin(tpl) ? t(`templates.vars.${v}`) : v);
  const headers = [t('bulk.cols.name'), t('bulk.cols.email'), t('bulk.cols.phone'), ...vars.filter((v) => v !== 'name').map(label)];
  const sep = loc === 'en' ? ',' : ';';

  const sampleRows = () => {
    const base = isBuiltin(tpl) ? templateSample(tpl, now, loc, text) : {};
    return PEOPLE.map((p) => [
      p.name,
      p.email,
      p.phone,
      ...vars
        .filter((v) => v !== 'name')
        .map((v) => (v === 'idNumber' ? p.id : isBuiltin(tpl) && v === TEMPLATE_SUBJECT_VAR[tpl] ? p.name : (base[v] ?? `${v} ${p.name.split(' ')[0]}`))),
    ]);
  };

  const aliases = () => {
    const a: Record<string, string[]> = {
      name: ['name', 'nombre', t('bulk.cols.name')],
      email: ['email', 'correo', 'correo electrónico', t('bulk.cols.email')],
      phone: ['phone', 'celular', 'teléfono', 'telefono', t('bulk.cols.phone')],
    };
    for (const v of vars) if (v !== 'name') a[v] = [v, label(v)];
    return a;
  };

  const load = (csv: string, from: string) => {
    setProblem(null);
    const table = parseCsv(csv);
    if (table.length < 2) {
      setRows(null);
      setProblem(t('bulk.errors.empty'));
      return;
    }
    const res = readBulk(table, aliases(), vars, MAX_BULK_ROWS);
    if (res.missingColumns.length) {
      setRows(null);
      setProblem(t('bulk.errors.columns', { cols: res.missingColumns.map((c) => (c === 'name' || c === 'email' ? t(`bulk.cols.${c}`) : label(c))).join(', ') }));
      return;
    }
    setRows(res.rows);
    setSource(from);
    if (res.truncated) setProblem(t('bulk.errors.truncated', { n: MAX_BULK_ROWS }));
  };

  const valid = rows?.filter((r) => r.errors.length === 0) ?? [];
  const errorText = (r: BulkRow) =>
    r.errors.map((e) => (e.startsWith('var:') ? t('bulk.rowErrors.var', { name: label(e.slice(4)) }) : t(`bulk.rowErrors.${e}`))).join(' · ');

  return (
    <Panel title={t('bulk.title')} subtitle={t('bulk.subtitle')}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
        <div>
          <label htmlFor="bulk-tpl" className={labelCls}>
            {t('bulk.template')}
          </label>
          <select
            id="bulk-tpl"
            className={selectCls}
            value={tpl}
            onChange={(e) => {
              setTpl(e.target.value);
              setRows(null);
              setProblem(null);
            }}
          >
            {BUILTIN_TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`templates.items.${id}.name`)}
              </option>
            ))}
            {s.templates.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadCsv(t('bulk.sampleFile'), headers, sampleRows(), sep)}>
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('bulk.downloadSample')}
          </Button>
          <label className={`inline-flex cursor-pointer items-center rounded-lg border-2 border-primary-600 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 ${focusRing} focus-within:ring-2 focus-within:ring-primary-500`}>
            <CloudArrowUpIcon className="mr-1 h-4 w-4" /> {t('bulk.upload')}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > MAX_CSV_BYTES) {
                  setRows(null);
                  setProblem(t('bulk.errors.tooBig', { size: fmtBytes(file.size, loc), max: fmtBytes(MAX_CSV_BYTES, loc) }));
                  return;
                }
                load(await file.text(), file.name);
              }}
            />
          </label>
          <Button size="sm" variant="ghost" onClick={() => load(buildCsv(headers, sampleRows(), sep), t('bulk.sampleFile'))}>
            <TableCellsIcon className="mr-1 h-4 w-4" /> {t('bulk.useSample')}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-secondary-500">{t('bulk.columnsHelp', { cols: headers.join(sep === ';' ? '; ' : ', ') })}</p>

      {problem && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
          {problem}
        </p>
      )}

      {rows && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">
            {t('bulk.summary', { file: source, total: rows.length, ok: valid.length, bad: rows.length - valid.length })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-700">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-secondary-50 text-xs uppercase text-secondary-500 dark:bg-secondary-800/60 dark:text-secondary-400">
                <tr>
                  <th className="px-3 py-2">{t('bulk.line')}</th>
                  <th className="px-3 py-2">{t('bulk.cols.name')}</th>
                  <th className="px-3 py-2">{t('bulk.cols.email')}</th>
                  <th className="px-3 py-2">{t('bulk.cols.phone')}</th>
                  <th className="px-3 py-2">{t('bulk.result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                {rows.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-2 text-secondary-500">{r.line}</td>
                    <td className="px-3 py-2">{r.name || '—'}</td>
                    <td className="break-all px-3 py-2">{r.email || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.phone ? formatMobile(r.phone) : '—'}</td>
                    <td className={`px-3 py-2 text-xs ${r.errors.length ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {r.errors.length ? errorText(r) : t('bulk.ok')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={valid.length === 0}
              onClick={() => {
                const n = bulkSend(tpl, rows);
                setRows(null);
                setProblem(null);
                toast(t('bulk.sent', { n }));
                go('home');
              }}
            >
              <PaperAirplaneIcon className="mr-1 h-4 w-4" /> {t('bulk.send', { n: valid.length })}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setRows(null);
                setProblem(null);
              }}
            >
              {t('bulk.discard')}
            </Button>
          </div>
        </div>
      )}
      <SimNote className="mt-3">{t('bulk.simNote')}</SimNote>
    </Panel>
  );
}
