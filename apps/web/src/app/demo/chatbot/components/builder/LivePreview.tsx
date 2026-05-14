'use client';

/**
 * LivePreview — columna central del Builder.
 *
 * Simula el sitio web del cliente (no usa <iframe> real para evitar CSP y
 * permitir interactividad con el widget). El widget se ubica en la esquina
 * configurada, con el color y avatar elegidos, y al click expande/colapsa.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import type { BuilderWidgetConfig } from './widgetConfig';
import { PANEL_ORIGIN, POSITION_CLASS } from './widgetConfig';

interface LivePreviewProps {
  config: BuilderWidgetConfig;
  /** Si está presente, el preview reemplaza el simulacro con un iframe real. */
  botId: string | null;
}

export default function LivePreview({ config, botId }: LivePreviewProps) {
  const t = useTranslations('demoChatbot.builder');
  const [open, setOpen] = useState(false);

  const cornerCls = POSITION_CLASS[config.position];
  const panelOriginCls = PANEL_ORIGIN[config.position];

  // Si el bot ya está guardado, mostramos el embed real (iframe) — el verdadero
  // widget cargado desde `/embed/chatbot/{botId}`. Caemos al simulacro local
  // mientras el usuario aún no guardó el bot.
  if (botId) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
        <header className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
          <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
            {t('preview.title')}
          </h3>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
            {t('preview.subtitleReal')}
          </p>
        </header>
        <div className="relative flex-1 overflow-hidden p-3">
          <div className="relative h-full overflow-hidden rounded-lg border border-secondary-300 bg-white shadow-inner dark:border-secondary-700">
            <div className="flex items-center gap-1.5 border-b border-secondary-200 bg-secondary-100 px-3 py-1.5 dark:border-secondary-700 dark:bg-secondary-800">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 truncate rounded bg-white px-2 py-0.5 font-mono text-[10px] text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
                /embed/chatbot/{botId}
              </span>
            </div>
            <iframe
              key={`${botId}-${config.position}-${config.primaryColor}`}
              src={`/embed/chatbot/${encodeURIComponent(botId)}?open=1`}
              title={config.botName}
              allow="microphone; clipboard-write"
              className="h-[calc(100%-30px)] w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
          {t('preview.title')}
        </h3>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
          {t('preview.saveHint')}
        </p>
      </header>

      <div className="relative flex-1 overflow-hidden p-3">
        {/* "Iframe" simulado: marco con barra de URL fake. */}
        <div className="relative h-full overflow-hidden rounded-lg border border-secondary-300 bg-white shadow-inner dark:border-secondary-700 dark:bg-secondary-950">
          <div className="flex items-center gap-1.5 border-b border-secondary-200 bg-secondary-100 px-3 py-1.5 dark:border-secondary-700 dark:bg-secondary-800">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-[10px] text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
              {t('preview.notSaved')}
            </span>
          </div>

          {/* "Sitio del cliente" — gradient + tipografía mock */}
          <div className="relative h-[calc(100%-30px)] overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-purple-950">
            <div className="px-6 py-8">
              <div className="mb-4 h-3 w-32 rounded bg-secondary-300 dark:bg-secondary-700" />
              <div className="space-y-2">
                <div className="h-2 w-3/4 rounded bg-secondary-200 dark:bg-secondary-800" />
                <div className="h-2 w-2/3 rounded bg-secondary-200 dark:bg-secondary-800" />
                <div className="h-2 w-1/2 rounded bg-secondary-200 dark:bg-secondary-800" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="h-20 rounded bg-white shadow-sm ring-1 ring-secondary-200 dark:bg-secondary-900 dark:ring-secondary-800" />
                <div className="h-20 rounded bg-white shadow-sm ring-1 ring-secondary-200 dark:bg-secondary-900 dark:ring-secondary-800" />
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-secondary-400 dark:text-secondary-600">
                Sitio del cliente · preview
              </p>
            </div>

            {/* Widget */}
            <div className={`absolute flex flex-col gap-2 ${cornerCls}`}>
              {open ? (
                <div
                  className={`absolute w-72 max-w-[18rem] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-secondary-900 ${panelOriginCls}`}
                  role="dialog"
                  aria-label={config.botName}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2.5 text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-lg">{config.avatar}</span>
                      <span className="truncate text-sm font-semibold">
                        {config.botName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="close"
                      className="rounded p-0.5 hover:bg-white/20"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-56 space-y-2 overflow-y-auto bg-secondary-50 px-3 py-3 text-xs text-secondary-800 dark:bg-secondary-950 dark:text-secondary-100">
                    <div className="flex gap-2">
                      <span className="text-base">{config.avatar}</span>
                      <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm dark:bg-secondary-800">
                        {config.welcome}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div
                        className="rounded-lg px-2.5 py-1.5 text-white shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {t('preview.sampleUser')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-base">{config.avatar}</span>
                      <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm dark:bg-secondary-800">
                        {t('preview.sampleBot')}
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="flex items-center gap-1.5 border-t border-secondary-200 bg-white p-2 dark:border-secondary-800 dark:bg-secondary-900"
                  >
                    <input
                      type="text"
                      placeholder="..."
                      className="flex-1 rounded border border-secondary-300 px-2 py-1 text-xs text-secondary-900 focus:outline-none dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      style={{ backgroundColor: config.primaryColor }}
                      className="rounded p-1.5 text-white"
                      aria-label={t('preview.send')}
                    >
                      <PaperAirplaneIcon className="h-3.5 w-3.5" />
                    </button>
                  </form>

                  <div className="border-t border-secondary-200 bg-secondary-50 px-3 py-1 text-center text-[9px] text-secondary-500 dark:border-secondary-800 dark:bg-secondary-950 dark:text-secondary-400">
                    {t('preview.poweredBy')}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{ backgroundColor: config.primaryColor }}
                className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-lg ring-2 ring-white transition hover:scale-105 dark:ring-secondary-900"
                aria-expanded={open}
                aria-label={config.botName}
              >
                {open ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <span className="leading-none">{config.avatar}</span>
                )}
              </button>

              {!open ? (
                <span
                  className={`rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-secondary-700 shadow dark:bg-secondary-800/90 dark:text-secondary-200 ${
                    config.position.startsWith('t') ? '' : ''
                  }`}
                >
                  {t('preview.bubbleHint')}
                </span>
              ) : null}
            </div>

            {/* Decoración: el widget también lleva su propio icono */}
            <ChatBubbleOvalLeftIcon className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-secondary-200/40 dark:text-secondary-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
