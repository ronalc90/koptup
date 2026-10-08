'use client';

/**
 * LivePreview — columna central del Builder.
 *
 * Con el bot guardado muestra el embebido REAL:
 *  - "Sitio web" / "Celular": una página de ejemplo (iframe `srcdoc`) que
 *    carga `/widget.js` con el mismo código que copias en "Código para tu
 *    sitio"; el script inserta el botón flotante y el iframe del chat
 *    (`/embed/chatbot/<id>`), que conversa con el backend.
 *  - "Enlace directo": la página pública del chat, `/embed/chatbot/<id>`.
 *
 * Sin guardar, muestra una vista previa local (solo apariencia y bienvenida;
 * no conversa) y el botón para guardar.
 */

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChatBubbleOvalLeftIcon, PaperAirplaneIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import PreviewModeToggle, { type PreviewMode } from './PreviewModeToggle';
import type { BuilderWidgetConfig } from './widgetConfig';
import { PANEL_ORIGIN, POSITION_CLASS, escapeAttr } from './widgetConfig';

interface LivePreviewProps {
  config: BuilderWidgetConfig;
  botId: string | null;
  /** Hay cambios sin guardar (nombre, bienvenida… solo se ven en el widget real tras guardar). */
  dirty: boolean;
  /** Cambia tras cada guardado para recargar el widget real. */
  nonce: number;
  origin: string;
  saving: boolean;
  onSave: () => void;
}

function buildSiteDoc(opts: {
  origin: string;
  botId: string;
  color: string;
  position: string;
  label: string;
  lang: string;
  title: string;
  body: string;
}): string {
  const a = escapeAttr;
  return `<!doctype html><html lang="${a(opts.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${a(opts.title)}</title><style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a}
header{display:flex;align-items:center;gap:8px;padding:14px 20px;background:#fff;border-bottom:1px solid #e2e8f0;font-weight:700}
header span{width:22px;height:22px;border-radius:6px;background:${a(opts.color)}}
main{padding:24px 20px;max-width:640px}
h1{font-size:20px;margin:0 0 8px}p{font-size:14px;line-height:1.5;color:#475569;margin:0 0 16px}
.bar{height:10px;background:#e2e8f0;border-radius:6px;margin:10px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.card{height:90px;background:#fff;border:1px solid #e2e8f0;border-radius:10px}
</style></head><body><header><span></span>${a(opts.title)}</header><main><h1>${a(opts.title)}</h1><p>${a(opts.body)}</p><div class="bar" style="width:80%"></div><div class="bar" style="width:65%"></div><div class="bar" style="width:72%"></div><div class="grid"><div class="card"></div><div class="card"></div></div></main>
<script src="${a(opts.origin)}/widget.js" data-bot-id="${a(opts.botId)}" data-color="${a(opts.color)}" data-position="${a(opts.position)}" data-label="${a(opts.label)}" async></script>
</body></html>`;
}

export default function LivePreview({ config, botId, dirty, nonce, origin, saving, onSave }: LivePreviewProps) {
  const t = useTranslations('demoChatbot.builder.preview');
  const tActions = useTranslations('demoChatbot.builder.actions');
  const locale = useLocale();
  const [mode, setMode] = useState<PreviewMode>('desktop');

  const siteDoc = useMemo(
    () =>
      botId
        ? buildSiteDoc({
            origin,
            botId,
            color: config.primaryColor,
            position: config.position,
            label: t('bubbleOpen'),
            lang: locale,
            title: t('siteTitle'),
            body: t('siteBody'),
          })
        : '',
    [botId, config.primaryColor, config.position, locale, origin, t],
  );

  const frameKey = `${botId ?? 'local'}-${nonce}-${config.primaryColor}-${config.position}-${mode}`;
  const embedUrl = botId ? `/embed/chatbot/${encodeURIComponent(botId)}?color=${encodeURIComponent(config.primaryColor)}` : '';

  return (
    <div className="flex flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="flex flex-col gap-2 border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-secondary-900 dark:text-white">{t('title')}</h3>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
            {botId ? t('subtitleReal') : t('subtitleLocal')}
          </p>
        </div>
        <PreviewModeToggle mode={mode} onChange={setMode} disabled={!botId} />
      </header>

      {botId && dirty ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="inline-flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t('unsavedChanges')}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-amber-600 px-2 py-0.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? tActions('saving') : tActions('save')}
          </button>
        </div>
      ) : null}

      <div className="relative h-[600px] overflow-hidden p-3 sm:h-[640px]">
        {!botId ? (
          <LocalPreview config={config} saving={saving} onSave={onSave} />
        ) : mode === 'page' ? (
          <iframe
            key={frameKey}
            src={embedUrl}
            title={config.botName}
            className="h-full w-full rounded-lg border border-secondary-300 bg-white dark:border-secondary-700"
          />
        ) : (
          <div
            className={`flex h-full items-stretch justify-center ${
              mode === 'mobile' ? 'bg-gradient-to-br from-secondary-100 to-secondary-200 py-2 dark:from-secondary-900 dark:to-secondary-950' : ''
            }`}
          >
            <iframe
              key={frameKey}
              srcDoc={siteDoc}
              title={t('siteTitle')}
              className={`h-full rounded-lg border border-secondary-300 bg-white dark:border-secondary-700 ${
                mode === 'mobile' ? 'w-[360px] max-w-full rounded-[28px] border-[8px] border-secondary-900' : 'w-full'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Vista previa local (bot sin guardar): solo apariencia y bienvenida. */
function LocalPreview({ config, saving, onSave }: { config: BuilderWidgetConfig; saving: boolean; onSave: () => void }) {
  const t = useTranslations('demoChatbot.builder.preview');
  const tActions = useTranslations('demoChatbot.builder.actions');
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-secondary-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:border-secondary-700 dark:from-secondary-900 dark:via-secondary-950 dark:to-purple-950">
      <div className="px-6 py-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">{t('siteTitle')}</p>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 rounded bg-secondary-200 dark:bg-secondary-800" />
          <div className="h-2 w-2/3 rounded bg-secondary-200 dark:bg-secondary-800" />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? tActions('saving') : t('saveToTest')}
        </button>
      </div>
      <ChatBubbleOvalLeftIcon className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-secondary-200/40 dark:text-secondary-800/40" />
      <div className={`absolute flex flex-col gap-2 ${POSITION_CLASS[config.position]}`}>
        {open ? (
          <div
            className={`absolute flex w-72 max-w-[calc(100vw-4rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-secondary-900 ${PANEL_ORIGIN[config.position]}`}
            role="group"
            aria-label={config.botName || t('defaultName')}
          >
            <header className="flex items-center justify-between px-3 py-2.5 text-white" style={{ backgroundColor: config.primaryColor }}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-lg">{config.avatar}</span>
                <span className="truncate text-sm font-semibold">{config.botName || t('defaultName')}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('bubbleClose')} className="rounded p-0.5 hover:bg-white/20">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-2 bg-secondary-50 px-3 py-3 text-xs text-secondary-800 dark:bg-secondary-950 dark:text-secondary-100">
              <div className="flex gap-2">
                <span className="text-base">{config.avatar}</span>
                <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm dark:bg-secondary-800">
                  {config.welcome || t('defaultWelcome')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t border-secondary-200 bg-white p-2 dark:border-secondary-800 dark:bg-secondary-900">
              <input
                type="text"
                disabled
                placeholder={t('inputDisabled')}
                aria-label={t('inputDisabled')}
                className="min-w-0 flex-1 rounded border border-secondary-300 px-2 py-1 text-xs text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
              />
              <span className="rounded p-1.5 text-white opacity-60" style={{ backgroundColor: config.primaryColor }} aria-hidden="true">
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="border-t border-secondary-200 bg-secondary-50 px-3 py-1 text-center text-[9px] text-secondary-500 dark:border-secondary-800 dark:bg-secondary-950 dark:text-secondary-400">
              {t('poweredBy')}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ backgroundColor: config.primaryColor }}
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-lg ring-2 ring-white transition hover:scale-105 dark:ring-secondary-900"
          aria-expanded={open}
          aria-label={open ? t('bubbleClose') : t('bubbleOpen')}
        >
          {open ? <XMarkIcon className="h-5 w-5" /> : <span className="leading-none">{config.avatar}</span>}
        </button>
      </div>
    </div>
  );
}
