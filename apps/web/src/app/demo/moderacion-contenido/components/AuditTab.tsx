'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { downloadCsv } from '../lib/files';
import { fmtDateTime } from '../lib/format';
import { useModeration } from '../lib/store';
import { AUDIT_ACTIONS, type AuditAction } from '../lib/types';
import { SectionTitle, SimNote, inputCls, selectCls } from './ui';
import { useText } from './useText';

export default function AuditTab() {
  const t = useTranslations('demoModeration');
  const { s, lang, toast } = useModeration();
  const { actor, detail } = useText();
  const [who, setWho] = useState('');
  const [action, setAction] = useState<AuditAction | 'all'>('all');

  const rows = useMemo(
    () =>
      [...s.audit]
        .sort((a, b) => b.at.localeCompare(a.at))
        .filter((e) => (who.trim() ? actor(e).toLowerCase().includes(who.trim().toLowerCase()) : true))
        .filter((e) => (action === 'all' ? true : e.action === action)),
    // `actor` depende del idioma y del estado ya incluidos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.audit, who, action, lang],
  );

  const exportCsv = () => {
    const sep = lang === 'es' ? ';' : ',';
    downloadCsv(
      `auditoria-moderacion-${new Date().toISOString().slice(0, 10)}.csv`,
      [t('audit.when'), t('audit.who'), t('audit.what'), t('audit.target'), t('audit.detailCol')],
      rows.map((e) => [fmtDateTime(e.at, lang), actor(e), t(`audit.actions.${e.action}`), e.target, detail(e)]),
      sep,
    );
    toast(t('audit.exported', { n: rows.length }));
  };

  return (
    <section>
      <SectionTitle
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <label className="block">
              <span className="sr-only">{t('audit.filterWho')}</span>
              <input value={who} onChange={(e) => setWho(e.target.value)} placeholder={t('audit.filterWho')} className={`${inputCls} sm:w-48`} />
            </label>
            <label className="block">
              <span className="sr-only">{t('audit.filterAction')}</span>
              <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | 'all')} className={`${selectCls} sm:w-52`}>
                <option value="all">{t('audit.allActions')}</option>
                {AUDIT_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {t(`audit.actions.${a}`)}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length} className="gap-1 whitespace-nowrap">
              <DocumentArrowDownIcon className="h-4 w-4" aria-hidden />
              {t('audit.export')}
            </Button>
          </div>
        }
      />
      <p className="mb-2 text-xs text-secondary-500 dark:text-secondary-400">{t('audit.count', { n: rows.length, total: s.audit.length })}</p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-secondary-300 p-6 text-center text-sm text-secondary-600 dark:border-secondary-700 dark:text-secondary-400">{t('audit.empty')}</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900 md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t('audit.when')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('audit.who')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('audit.what')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('audit.target')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('audit.detailCol')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-secondary-100 align-top dark:border-secondary-800">
                    <td className="whitespace-nowrap px-3 py-2 text-secondary-600 dark:text-secondary-400">{fmtDateTime(e.at, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-secondary-800 dark:text-secondary-200">{actor(e)}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100">{t(`audit.actions.${e.action}`)}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{e.target}</td>
                    <td className="px-3 py-2 text-secondary-700 dark:text-secondary-300">{detail(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {rows.map((e) => (
              <li key={e.id} className="rounded-lg border border-secondary-200 bg-white p-3 text-sm dark:border-secondary-700 dark:bg-secondary-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100">{t(`audit.actions.${e.action}`)}</span>
                  <span className="font-mono text-xs">{e.target}</span>
                </div>
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                  {fmtDateTime(e.at, lang)} · {actor(e)}
                </p>
                <p className="mt-1 text-secondary-700 dark:text-secondary-300">{detail(e)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <SimNote className="mt-4">{t('audit.note')}</SimNote>
    </section>
  );
}
