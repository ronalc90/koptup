'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  HandThumbUpIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  PaperAirplaneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface PostPreviewProps {
  texto: string;
  imagenUrl?: string | null;
}

/**
 * Vista previa simulada con el aspecto del feed de LinkedIn. No muestra
 * reacciones ni contadores (no hay datos reales) y sus íconos de acción son
 * decorativos: la demo no publica ni interactúa con LinkedIn.
 */
export default function PostPreview({ texto, imagenUrl }: PostPreviewProps) {
  const t = useTranslations('demoLinkedinAds.preview');
  const [expandido, setExpandido] = useState(false);
  const lineas = texto.split('\n');
  const necesitaExpansion = lineas.length > 3 || texto.length > 220;
  const corto = lineas.slice(0, 3).join('\n').slice(0, 220);
  const textoMostrado = expandido || !necesitaExpansion ? texto : corto;

  return (
    <div className="w-full max-w-[552px] rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <div className="flex items-start gap-2 px-4 pt-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-base font-bold text-white">
          K
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-secondary-900 dark:text-white">{t('author')}</p>
          <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">{t('headline')}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-secondary-500 dark:text-secondary-400">
            {t('time')} · <GlobeAltIcon className="h-3 w-3" aria-hidden="true" />
          </p>
        </div>
      </div>

      <div className="px-4 pb-2 pt-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary-900 dark:text-secondary-100">
          {textoMostrado}
        </p>
        {necesitaExpansion ? (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="mt-1 text-sm font-medium text-secondary-500 hover:text-primary-600 dark:text-secondary-400"
          >
            {expandido ? t('seeLess') : t('seeMore')}
          </button>
        ) : null}
      </div>

      {imagenUrl ? (
        <div className="border-y border-secondary-200 bg-secondary-50 dark:border-secondary-800 dark:bg-secondary-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagenUrl} alt={t('imageAlt')} className="max-h-[480px] w-full object-contain" />
        </div>
      ) : null}

      <p className="px-4 py-2 text-[11px] italic text-secondary-500 dark:text-secondary-400">{t('simulated')}</p>

      <div className="border-t border-secondary-200 px-2 py-1 dark:border-secondary-800" aria-hidden="true">
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: t('actions.like'), Icon: HandThumbUpIcon },
            { label: t('actions.comment'), Icon: ChatBubbleOvalLeftIcon },
            { label: t('actions.repost'), Icon: ArrowPathRoundedSquareIcon },
            { label: t('actions.send'), Icon: PaperAirplaneIcon },
          ].map(({ label, Icon }) => (
            <span
              key={label}
              className="flex cursor-default select-none items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-semibold text-secondary-400 dark:text-secondary-500"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
