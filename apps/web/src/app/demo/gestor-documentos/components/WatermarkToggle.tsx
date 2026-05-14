'use client';

import { useTranslations } from 'next-intl';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface WatermarkToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Toggle de marca de agua dinámica. La marca de agua se renderiza
 * como overlay rotado 30° con <WatermarkOverlay /> aparte.
 */
export default function WatermarkToggle({ enabled, onToggle }: WatermarkToggleProps) {
  const t = useTranslations('demoDocsPro');
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
        enabled
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-300'
      }`}
    >
      <span className="flex items-center gap-2 font-semibold text-sm">
        <PencilSquareIcon className="w-5 h-5" />
        {enabled ? t('viewer.watermarkOn') : t('viewer.watermarkToggle')}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

interface WatermarkOverlayProps {
  text: string;
  id: string;
}

/**
 * Overlay rotado 30° que se monta encima del preview cuando la marca de agua está activa.
 */
export function WatermarkOverlay({ text, id }: WatermarkOverlayProps) {
  const t = useTranslations('demoDocsPro');
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="text-xl md:text-2xl font-bold text-slate-500/30 dark:text-slate-300/20 rotate-[-30deg] select-none text-center px-4 leading-tight">
        {t('watermark.label')} {text}
        <br />
        {t('watermark.id')}: {id}
      </span>
    </div>
  );
}
