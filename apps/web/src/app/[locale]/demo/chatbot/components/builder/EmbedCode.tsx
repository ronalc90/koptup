'use client';

/**
 * EmbedCode — código para insertar el bot en otro sitio. Solo ofrece lo que
 * existe y funciona:
 *  - Script: `/widget.js` (apps/web/public/widget.js) con `data-bot-id`,
 *    `data-color` y `data-position`: inserta un botón flotante y el iframe
 *    del chat.
 *  - Iframe: la página pública `/embed/chatbot/<id>`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

import type { BuilderWidgetConfig } from './widgetConfig';
import { escapeAttr } from './widgetConfig';

type EmbedTabKey = 'script' | 'iframe';
const TABS: readonly EmbedTabKey[] = ['script', 'iframe'];

interface EmbedCodeProps {
  config: BuilderWidgetConfig;
  botId: string | null;
  origin: string;
}

export function buildSnippet(tab: EmbedTabKey, c: BuilderWidgetConfig, botId: string, origin: string): string {
  if (tab === 'script') {
    return [
      '<script',
      `  src="${escapeAttr(origin)}/widget.js"`,
      `  data-bot-id="${escapeAttr(botId)}"`,
      `  data-color="${escapeAttr(c.primaryColor)}"`,
      `  data-position="${escapeAttr(c.position)}"`,
      '  async',
      '></script>',
    ].join('\n');
  }
  return [
    '<iframe',
    `  src="${escapeAttr(origin)}/embed/chatbot/${encodeURIComponent(botId)}"`,
    `  title="${escapeAttr(c.botName)}"`,
    '  width="380"',
    '  height="600"',
    '  style="border:0;border-radius:16px;max-width:100%"',
    '  loading="lazy"',
    '></iframe>',
  ].join('\n');
}

export default function EmbedCode({ config, botId, origin }: EmbedCodeProps) {
  const t = useTranslations('demoChatbot.builder.embed');
  const [tab, setTab] = useState<EmbedTabKey>('script');
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => (botId ? buildSnippet(tab, config, botId, origin) : ''), [tab, config, botId, origin]);

  const onCopy = useCallback(async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles: seleccionamos el texto para copiarlo a mano.
      const pre = document.getElementById('chatbot-embed-snippet');
      const range = document.createRange();
      if (pre) {
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [snippet]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="flex flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">{t('title')}</h3>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('subtitle')}</p>
      </header>

      <div
        className="flex flex-wrap gap-0.5 border-b border-secondary-200 bg-secondary-50 px-2 pt-2 dark:border-secondary-800 dark:bg-secondary-950"
        role="tablist"
        aria-label={t('title')}
      >
        {TABS.map((tk) => {
          const active = tab === tk;
          return (
            <button
              key={tk}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tk)}
              className={`rounded-t-md px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-secondary-900 dark:text-primary-300'
                  : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
              }`}
            >
              {t(`tabs.${tk}`)}
            </button>
          );
        })}
      </div>

      <div className="relative p-3">
        {botId ? (
          <>
            <pre
              id="chatbot-embed-snippet"
              className="max-h-64 overflow-auto rounded-md bg-secondary-950 p-3 pr-20 font-mono text-[11px] leading-relaxed text-secondary-100"
            >
              <code>{snippet}</code>
            </pre>
            <button
              type="button"
              onClick={onCopy}
              className="absolute right-5 top-5 flex items-center gap-1 rounded-md bg-secondary-800/90 px-2 py-1 text-[11px] font-medium text-white shadow ring-1 ring-white/10 hover:bg-secondary-700"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
              {copied ? t('copied') : t('copy')}
            </button>
            {copied ? (
              <span role="status" className="sr-only">
                {t('copied')}
              </span>
            ) : null}
            <p className="mt-2 text-[10.5px] leading-snug text-secondary-500 dark:text-secondary-400">
              {tab === 'script' ? t('scriptHelp') : t('iframeHelp')}
            </p>
            <p className="mt-1 text-[10.5px] leading-snug text-secondary-500 dark:text-secondary-400">
              {t('cspNote', { origin })}
            </p>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-secondary-300 px-3 py-6 text-center text-xs text-secondary-500 dark:border-secondary-700 dark:text-secondary-400">
            {t('saveFirst')}
          </p>
        )}
      </div>

      {botId ? (
        <footer className="border-t border-secondary-200 px-3 py-2 text-[10px] text-secondary-500 dark:border-secondary-800 dark:text-secondary-400">
          <span className="break-all">
            {t('botId')}: <span className="font-mono">{botId}</span>
          </span>
        </footer>
      ) : null}
    </div>
  );
}
