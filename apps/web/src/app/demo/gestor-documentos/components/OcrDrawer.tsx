'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface OcrDrawerProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

/**
 * Drawer lateral con bounding boxes + tabla extraída + entidades reconocidas.
 */
export default function OcrDrawer({ open, onClose, documentName }: OcrDrawerProps) {
  const t = useTranslations('demoDocsPro');
  useModalClose(open, onClose);

  const rows = [
    { concept: 'Servicio profesional', qty: '1', unit: '$2.500.000', total: '$2.500.000' },
    { concept: 'Soporte mensual', qty: '12', unit: '$180.000', total: '$2.160.000' },
    { concept: 'Capacitación', qty: '4', unit: '$320.000', total: '$1.280.000' },
  ];
  const entities = [
    { k: 'name', v: 'Koptup Solutions S.A.S.' },
    { k: 'nit', v: '900.123.456-7' },
    { k: 'date', v: '2026-05-14' },
    { k: 'amount', v: '$5.940.000 COP' },
    { k: 'city', v: 'Bogotá D.C.' },
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={t('ocr.title')}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[95vw] sm:max-w-[640px] bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto"
      >
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <DocumentMagnifyingGlassIcon className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">PRO</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('ocr.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {documentName ? documentName : t('ocr.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('viewer.close')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('ocr.preview')}</h4>
            <div className="relative aspect-[4/5] rounded-lg bg-white dark:bg-slate-100 border border-slate-200 shadow-inner overflow-hidden">
              <div className="absolute inset-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-2 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-3/4" />
                <div className="h-2 bg-slate-100 rounded w-1/3" />
                <div className="h-16 bg-slate-50 border border-slate-200 rounded mt-4" />
                <div className="h-2 bg-slate-100 rounded w-1/2 mt-3" />
                <div className="h-2 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="absolute top-3 left-3 right-[35%] h-3 border-2 border-emerald-500 rounded animate-pulse" />
              <div className="absolute top-[55px] left-3 w-[40%] h-3 border-2 border-blue-500 rounded" />
              <div className="absolute top-[75px] left-3 right-[20%] h-16 border-2 border-purple-500 rounded" />
              <div className="absolute bottom-3 right-3 w-[35%] h-3 border-2 border-amber-500 rounded" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('ocr.table')}</h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t('ocr.headers.concept')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.qty')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.unit')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('ocr.headers.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((r, i) => (
                    <tr key={i} className="bg-white dark:bg-slate-900">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{r.concept}</td>
                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">{r.qty}</td>
                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-200">{r.unit}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('ocr.entities')}</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {entities.map((e) => (
                <li
                  key={e.k}
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="text-slate-500 dark:text-slate-400">{t(`ocr.entity.${e.k}`)}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{e.v}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
