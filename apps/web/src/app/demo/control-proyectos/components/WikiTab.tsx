'use client';

import { useTranslations } from 'next-intl';
import { DocumentTextIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

export default function WikiTab() {
  const t = useTranslations('demoProjectsPro.wiki');
  const tWb = useTranslations('demoProjectsPro.whiteboards');
  const pages = [1, 2, 3, 4, 5] as const;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('title')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <aside className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
          <ul className="space-y-1">
            {pages.map((i) => (
              <li key={i}>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                  {t(`page${i}`)}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500 mb-2 font-semibold">{t('preview')}</p>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('page1')}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('previewText')}</p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{tWb('title')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{tWb('subtitle')}</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 relative flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative text-center">
              <PaintBrushIcon className="w-10 h-10 text-teal-500 mx-auto mb-2" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{tWb('placeholder')}</p>
            </div>
            <div className="absolute top-3 right-3 flex -space-x-2">
              {['M', 'C', 'A'].map((l, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-slate-900"
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700">
              {tWb('open')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
