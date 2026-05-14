'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface RetentionPanelProps {
  open: boolean;
  onClose: () => void;
  focusedFolder?: string;
}

/**
 * Panel lateral con la tabla completa de políticas de retención por carpeta.
 */
export default function RetentionPanel({ open, onClose, focusedFolder }: RetentionPanelProps) {
  const t = useTranslations('demoDocsPro');
  useModalClose(open, onClose);

  const rows = [
    { folder: 'Contratos', policyKey: 'p10', expires: '2036-01-01', worm: true, hold: false },
    { folder: 'Facturas', policyKey: 'p7', expires: '2033-12-31', worm: true, hold: false },
    { folder: 'RRHH', policyKey: 'perm', expires: '—', worm: true, hold: true },
    { folder: 'Marketing', policyKey: 'p3', expires: '2029-06-30', worm: false, hold: false },
  ] as const;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={t('retention.title')}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[95vw] sm:max-w-[640px] bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto"
      >
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <ArchiveBoxIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('retention.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('retention.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">{t('retention.headers.folder')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('retention.headers.policy')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('retention.headers.expires')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('retention.headers.worm')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('retention.headers.hold')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((r) => {
                  const focused = focusedFolder && r.folder.toLowerCase() === focusedFolder.toLowerCase();
                  return (
                    <tr
                      key={r.folder}
                      className={`${
                        focused ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{r.folder}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        {t(`retention.policies.${r.policyKey}`)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{r.expires}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            r.worm
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {r.worm ? t('retention.active') : t('retention.inactive')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            r.hold
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {r.hold ? t('retention.active') : t('retention.inactive')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </>
  );
}
