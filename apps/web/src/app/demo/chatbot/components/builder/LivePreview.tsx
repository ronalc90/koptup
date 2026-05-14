'use client';

/**
 * LivePreview — columna central del Builder.
 *
 * Ofrece 3 modos de previsualización del widget:
 *   1. Desktop  → mockup de un sitio web con el widget en la esquina configurada.
 *   2. Mobile   → frame de iPhone vertical con el widget como app nativa.
 *   3. Bubble   → solo el FAB sin sitio detrás + snippet del iframe.
 *
 * Si el bot ya está guardado (botId != null) y el modo es Desktop, mostramos el
 * iframe REAL apuntando a `/embed/chatbot/{botId}` (sin CSP, mismo origen).
 * En Mobile y Bubble usamos siempre la simulación local porque el chrome del
 * iframe rompe la ilusión de "phone" o de FAB flotante puro.
 *
 * Memoización: los valores derivados del `config` viven dentro de `useMemo`
 * para que un cambio de docs/avatarImage NO destruya el estado interno
 * (`previewMode`, `expanded`, ...). El widget tampoco se desmonta al subir un
 * archivo: el `key` del iframe sólo cambia si cambia el botId, color o
 * posición — no por uploads.
 */

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import PreviewModeToggle, { type PreviewMode } from './PreviewModeToggle';
import type { BuilderWidgetConfig } from './widgetConfig';
import { PANEL_ORIGIN, POSITION_CLASS } from './widgetConfig';

interface LivePreviewProps {
  config: BuilderWidgetConfig;
  /** Si está presente, el preview reemplaza el simulacro con un iframe real. */
  botId: string | null;
}

export default function LivePreview({ config, botId }: LivePreviewProps) {
  const t = useTranslations('demoChatbot.builder.preview');
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [open, setOpen] = useState(false);

  // Memoizamos los derivados del config para que el re-render por upload de
  // archivos (que muta `config.docs`) no recalcule estas strings ni rompa la
  // referencia que viaja a sub-componentes.
  const cornerCls = useMemo(
    () => POSITION_CLASS[config.position],
    [config.position],
  );
  const panelOriginCls = useMemo(
    () => PANEL_ORIGIN[config.position],
    [config.position],
  );

  const sharedWidget: SharedWidgetProps = useMemo(
    () => ({
      config,
      open,
      onToggleOpen: () => setOpen((v) => !v),
      onClose: () => setOpen(false),
      panelOriginCls,
      cornerCls,
      t,
    }),
    [config, open, panelOriginCls, cornerCls, t],
  );

  return (
    <div className="flex h-full flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="flex flex-col gap-2 border-b border-secondary-200 px-4 py-3 dark:border-secondary-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
            {t('title')}
          </h3>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
            {botId ? t('subtitleReal') : t('saveHint')}
          </p>
        </div>
        <PreviewModeToggle mode={mode} onChange={setMode} />
      </header>

      <div className="relative flex-1 overflow-hidden p-3">
        {mode === 'desktop' ? (
          <DesktopPreview
            botId={botId}
            config={config}
            widget={sharedWidget}
          />
        ) : null}
        {mode === 'mobile' ? <MobilePreview widget={sharedWidget} /> : null}
        {mode === 'bubble' ? (
          <BubblePreview widget={sharedWidget} botId={botId} t={t} />
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-componentes — cada modo se aísla para mantener Single Responsibility.
// ============================================================================

type TFn = ReturnType<typeof useTranslations>;

interface SharedWidgetProps {
  config: BuilderWidgetConfig;
  open: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  panelOriginCls: string;
  cornerCls: string;
  t: TFn;
}

/** Mockup del navegador con widget en la esquina configurada. */
function DesktopPreview({
  botId,
  config,
  widget,
}: {
  botId: string | null;
  config: BuilderWidgetConfig;
  widget: SharedWidgetProps;
}) {
  const { t } = widget;

  // Si el bot está persistido, mostramos el iframe REAL en Desktop. El `key`
  // sólo depende de identidad/color/posición — NO de docs ni avatarImage —
  // así el iframe NO se remonta al subir un archivo.
  const iframeKey = useMemo(
    () => `${botId ?? 'unsaved'}-${config.position}-${config.primaryColor}`,
    [botId, config.position, config.primaryColor],
  );

  if (botId) {
    return (
      <div className="relative h-full overflow-hidden rounded-lg border border-secondary-300 bg-white shadow-inner dark:border-secondary-700">
        <BrowserChrome label={`/embed/chatbot/${botId}`} />
        <iframe
          key={iframeKey}
          src={`/embed/chatbot/${encodeURIComponent(botId)}?open=1`}
          title={config.botName}
          allow="microphone; clipboard-write"
          className="h-[calc(100%-30px)] w-full border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-secondary-300 bg-white shadow-inner dark:border-secondary-700 dark:bg-secondary-950">
      <BrowserChrome label={t('notSaved')} />
      <div className="relative h-[calc(100%-30px)] overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-purple-950">
        <FakeSiteContent />
        <div className={`absolute flex flex-col gap-2 ${widget.cornerCls}`}>
          {widget.open ? (
            <WidgetPanel widget={widget} variant="anchored" />
          ) : null}
          <WidgetBubble widget={widget} />
          {!widget.open ? (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-secondary-700 shadow dark:bg-secondary-800/90 dark:text-secondary-200">
              {t('bubbleHint')}
            </span>
          ) : null}
        </div>
        <ChatBubbleOvalLeftIcon className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-secondary-200/40 dark:text-secondary-800/40" />
      </div>
    </div>
  );
}

/** Frame de iPhone vertical centrado: widget como app nativa. */
function MobilePreview({ widget }: { widget: SharedWidgetProps }) {
  const { t } = widget;

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 p-4 dark:from-secondary-900 dark:to-secondary-950">
      <div className="relative h-[560px] w-[300px] overflow-hidden rounded-[42px] border-[10px] border-secondary-900 bg-white shadow-2xl dark:bg-secondary-900">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-secondary-900" />
        {/* Status bar */}
        <div className="flex justify-between px-6 pb-1 pt-3 text-[10px] font-semibold text-secondary-700 dark:text-secondary-200">
          <span>{t('mobileFrame.time')}</span>
          <span>{t('mobileFrame.status')}</span>
        </div>
        {/* Fake mobile site content */}
        <div className="space-y-2 px-4 py-3">
          <div className="h-4 w-2/3 rounded bg-secondary-200 dark:bg-secondary-700" />
          <div className="h-2 w-full rounded bg-secondary-200 dark:bg-secondary-700" />
          <div className="h-2 w-5/6 rounded bg-secondary-200 dark:bg-secondary-700" />
          <div className="mt-3 h-20 rounded bg-secondary-100 ring-1 ring-secondary-200 dark:bg-secondary-800 dark:ring-secondary-700" />
        </div>

        {widget.open ? (
          <div className="absolute inset-x-3 bottom-4 top-14 z-10 overflow-hidden rounded-2xl shadow-xl">
            <WidgetPanel widget={widget} variant="fullsize" />
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 z-10">
            <WidgetBubble widget={widget} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Vista limpia: solo el FAB centrado + snippet del iframe debajo. */
function BubblePreview({
  widget,
  botId,
  t,
}: {
  widget: SharedWidgetProps;
  botId: string | null;
  t: TFn;
}) {
  const iframeSnippet = useMemo(
    () =>
      `<iframe src="https://koptup.com/embed/chatbot/${botId ?? '{botId}'}" />`,
    [botId],
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-secondary-100 to-secondary-200 p-6 dark:from-secondary-900 dark:to-secondary-950">
      <div className="max-w-md rounded-lg border border-secondary-200 bg-white/80 p-3 text-center text-xs text-secondary-600 backdrop-blur dark:border-secondary-700 dark:bg-secondary-900/80 dark:text-secondary-300">
        {t('bubble.intro')}
      </div>

      <div className="relative">
        {widget.open ? (
          <div className="absolute bottom-20 right-0 z-10">
            <WidgetPanel widget={widget} variant="floating" />
          </div>
        ) : null}
        <WidgetBubble widget={widget} />
      </div>

      <div className="w-full max-w-md overflow-x-auto rounded-lg bg-secondary-950 px-3 py-2 font-mono text-[10px] text-green-300">
        <div className="text-secondary-500">{`// ${t('bubble.snippetComment')}`}</div>
        <div>{iframeSnippet}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Componentes atómicos reutilizados por los 3 modos.
// ============================================================================

function BrowserChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-secondary-200 bg-secondary-100 px-3 py-1.5 dark:border-secondary-700 dark:bg-secondary-800">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
      <span className="ml-2 truncate rounded bg-white px-2 py-0.5 font-mono text-[10px] text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
        {label}
      </span>
    </div>
  );
}

function FakeSiteContent() {
  return (
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
  );
}

/** Botón flotante (FAB). Misma instancia montada en los 3 modos. */
function WidgetBubble({ widget }: { widget: SharedWidgetProps }) {
  const { config, open, onToggleOpen, t } = widget;
  return (
    <button
      type="button"
      onClick={onToggleOpen}
      style={{ backgroundColor: config.primaryColor }}
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-2xl text-white shadow-lg ring-2 ring-white transition hover:scale-105 dark:ring-secondary-900"
      aria-expanded={open}
      aria-label={open ? t('bubble.closeButton') : t('bubble.openButton')}
    >
      {open ? (
        <XMarkIcon className="h-5 w-5" />
      ) : config.avatarImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.avatarImage}
          alt={config.botName}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="leading-none">{config.avatar}</span>
      )}
    </button>
  );
}

/**
 * Panel del chat. La `variant` define solo dimensiones/posición; el contenido
 * (header, mensajes, footer) es idéntico — Open/Closed: añadir un nuevo
 * `variant` no obliga a tocar la lógica de mensajes.
 */
function WidgetPanel({
  widget,
  variant,
}: {
  widget: SharedWidgetProps;
  variant: 'anchored' | 'fullsize' | 'floating';
}) {
  const { config, onClose, panelOriginCls, t } = widget;

  const sizingClass = (() => {
    switch (variant) {
      case 'fullsize':
        return 'h-full w-full';
      case 'floating':
        return 'h-[460px] w-[320px]';
      case 'anchored':
      default:
        return `absolute w-72 max-w-[18rem] ${panelOriginCls}`;
    }
  })();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-secondary-900 ${sizingClass}`}
      role="dialog"
      aria-label={config.botName}
    >
      <header
        className="flex items-center justify-between px-3 py-2.5 text-white"
        style={{ backgroundColor: config.primaryColor }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {config.avatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.avatarImage}
              alt={config.botName}
              className="h-6 w-6 rounded-full object-cover ring-2 ring-white/40"
            />
          ) : (
            <span className="text-lg">{config.avatar}</span>
          )}
          <span className="truncate text-sm font-semibold">
            {config.botName || t('defaultName')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('bubble.closeButton')}
          className="rounded p-0.5 hover:bg-white/20"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-secondary-50 px-3 py-3 text-xs text-secondary-800 dark:bg-secondary-950 dark:text-secondary-100">
        <div className="flex gap-2">
          {config.avatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.avatarImage}
              alt={config.botName}
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="text-base">{config.avatar}</span>
          )}
          <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm dark:bg-secondary-800">
            {config.welcome || t('defaultWelcome')}
          </div>
        </div>
        <div className="flex justify-end">
          <div
            className="rounded-lg px-2.5 py-1.5 text-white shadow-sm"
            style={{ backgroundColor: config.primaryColor }}
          >
            {t('sampleUser')}
          </div>
        </div>
        <div className="flex gap-2">
          {config.avatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.avatarImage}
              alt={config.botName}
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="text-base">{config.avatar}</span>
          )}
          <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm dark:bg-secondary-800">
            {t('sampleBot')}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-1.5 border-t border-secondary-200 bg-white p-2 dark:border-secondary-800 dark:bg-secondary-900"
      >
        <input
          type="text"
          placeholder={t('inputPlaceholder')}
          className="flex-1 rounded border border-secondary-300 px-2 py-1 text-xs text-secondary-900 focus:outline-none dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
        />
        <button
          type="submit"
          style={{ backgroundColor: config.primaryColor }}
          className="rounded p-1.5 text-white"
          aria-label={t('send')}
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="border-t border-secondary-200 bg-secondary-50 px-3 py-1 text-center text-[9px] text-secondary-500 dark:border-secondary-800 dark:bg-secondary-950 dark:text-secondary-400">
        {t('poweredBy')}
      </div>
    </div>
  );
}
