'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, PuzzlePieceIcon, PlusIcon } from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

interface Props {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (templateName: string) => void;
  onStartFromScratch: () => void;
}

const GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-teal-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-purple-500 to-indigo-500',
  'from-emerald-500 to-green-500',
  'from-blue-500 to-sky-500',
];

export default function TemplatesModal({ open, onClose, onUseTemplate, onStartFromScratch }: Props) {
  const t = useTranslations('demoProjectsPro.templates');

  useModalClose(open, onClose);

  if (!open) return null;

  const tpls = [1, 2, 3, 4, 5, 6] as const;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[150]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
        <div
          role="dialog"
          aria-label={t('title')}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('chooseTemplate')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="close-templates"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <button
              onClick={onStartFromScratch}
              className="w-full mb-5 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all flex items-center gap-3 text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{t('fromScratch')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('fromScratchDesc')}</p>
              </div>
            </button>

            <p className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-3 tracking-wide">
              {t('useTemplates')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tpls.map((i) => (
                <button
                  key={i}
                  onClick={() => onUseTemplate(t(`tpl${i}`))}
                  className="text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={`h-20 bg-gradient-to-br ${GRADIENTS[i - 1]} flex items-center justify-center`}>
                    <PuzzlePieceIcon className="w-8 h-8 text-white/90" />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{t(`tpl${i}`)}</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">{t(`tpl${i}Desc`)}</p>
                    <span className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                      {t('use')} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
