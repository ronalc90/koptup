'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentArrowUpIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { DEMO_DATE, daysUntil, docStatus, fmtDate } from './engine';
import type { DriverDoc } from './types';
import { Modal, useMonths } from './ui';
import { useDelivery } from './store';

const NO_EXPIRY: DriverDoc['id'][] = ['cedula', 'tarjetaPropiedad'];

/** Documentos del repartidor (Colombia) con vencimientos calculados frente a la fecha de la demo. */
export default function DriverDocs({ driverId }: { driverId: string }) {
  const t = useTranslations('demoDelivery');
  const months = useMonths();
  const { state, dispatch, notify } = useDelivery();
  const docs = state.docs[driverId] ?? [];
  const [editing, setEditing] = useState<DriverDoc | null>(null);
  const [file, setFile] = useState<string>('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const issues = docs.filter((d) => docStatus(d.expires) !== 'valid').length;

  const save = () => {
    if (!editing) return;
    if (!file) return setError(t('docs.needFile'));
    const needsDate = !NO_EXPIRY.includes(editing.id);
    if (needsDate && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || daysUntil(date) <= 0)) return setError(t('docs.needDate'));
    dispatch({ type: 'doc', driverId, docId: editing.id, expires: needsDate ? date : undefined, fileName: file });
    notify(t('docs.savedToast', { doc: t(`docs.items.${editing.id}`) }));
    setEditing(null);
  };

  return (
    <section aria-label={t('docs.title')} className="rounded-xl border border-secondary-200 bg-white p-3 text-xs dark:border-secondary-700 dark:bg-secondary-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t('docs.title')}</h3>
        {issues ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            <ExclamationTriangleIcon className="h-3 w-3" />{t('docs.issues', { n: issues })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <ShieldCheckIcon className="h-3 w-3" />{t('docs.allValid')}
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {docs.map((d) => {
          const st = docStatus(d.expires);
          const days = d.expires ? daysUntil(d.expires) : null;
          return (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary-50 px-2 py-1.5 dark:bg-secondary-900">
              <span className="min-w-0">
                <span className="block font-semibold">{t(`docs.items.${d.id}`)}</span>
                <span className={st === 'expired' ? 'text-red-600' : st === 'expiring' ? 'text-amber-700 dark:text-amber-300' : 'text-secondary-500 dark:text-secondary-400'}>
                  {d.expires
                    ? st === 'expired'
                      ? t('docs.expired', { date: fmtDate(d.expires, months) })
                      : st === 'expiring'
                        ? t('docs.expiresIn', { n: days ?? 0, date: fmtDate(d.expires, months) })
                        : t('docs.validUntil', { date: fmtDate(d.expires, months) })
                    : t('docs.noExpiry')}
                  {d.fileName && ` · ${t('docs.uploaded', { file: d.fileName })}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => { setEditing(d); setFile(''); setDate(''); setError(''); }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30"
              >
                <DocumentArrowUpIcon className="h-3.5 w-3.5" />{t('docs.update')}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] text-secondary-500 dark:text-secondary-400">{t('docs.note', { date: fmtDate(DEMO_DATE, months) })}</p>

      {editing && (
        <Modal
          scope="phone"
          title={t('docs.updateTitle', { doc: t(`docs.items.${editing.id}`) })}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={save}>{t('common.save')}</Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block">
              <span className="mb-1 block font-semibold">{t('docs.file')}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => { setFile(e.target.files?.[0]?.name ?? ''); setError(''); }}
                className="block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary-600 file:px-2 file:py-1 file:text-white"
              />
            </label>
            {!NO_EXPIRY.includes(editing.id) && (
              <label className="block">
                <span className="mb-1 block font-semibold">{t('docs.newDate')}</span>
                <input type="date" value={date} min="2026-10-09" onChange={(e) => { setDate(e.target.value); setError(''); }} className="block w-full rounded-lg border border-secondary-300 bg-white px-2 py-1.5 dark:border-secondary-600 dark:bg-secondary-900" />
              </label>
            )}
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('docs.privacy')}</p>
            {error && <p role="alert" className="font-semibold text-red-600">{error}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
}
