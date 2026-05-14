'use client';

/**
 * EmbedCode — columna derecha del Builder.
 *
 * Genera el snippet de embed según la pestaña elegida y permite copiarlo
 * al portapapeles. Muestra un toast efímero al copiar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

import type { BuilderWidgetConfig, EmbedTabKey } from './widgetConfig';

interface EmbedCodeProps {
  config: BuilderWidgetConfig;
  /** Cuando hay un botId persistido, los snippets usan URLs reales. */
  botId: string | null;
}

const TABS: readonly EmbedTabKey[] = ['script', 'iframe', 'react', 'webhook'];

function buildSnippet(
  tab: EmbedTabKey,
  c: BuilderWidgetConfig,
  effectiveBotId: string,
): string {
  const cfg = {
    botId: effectiveBotId,
    botName: c.botName,
    primaryColor: c.primaryColor,
    position: c.position,
    avatar: c.avatar,
    welcome: c.welcome,
    tone: c.tone,
    languages: c.languages,
  };

  const iframeSrc = `https://koptup.com/embed/chatbot/${effectiveBotId}`;
  const webhookUrl = `https://koptup.com/api/chatbot/bots/${effectiveBotId}/webhook`;

  switch (tab) {
    case 'script':
      return [
        '<!-- Koptup chatbot widget -->',
        '<script>',
        `  window.KoptupChatbot = ${JSON.stringify(cfg, null, 2).replace(/\n/g, '\n  ')};`,
        '  (function(){',
        '    var f = document.createElement("iframe");',
        `    f.src = "${iframeSrc}";`,
        '    f.title = window.KoptupChatbot.botName;',
        '    f.style.cssText = "position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;z-index:2147483647;background:transparent";',
        '    f.allow = "microphone; clipboard-write";',
        '    document.body.appendChild(f);',
        '  })();',
        '</script>',
        `<script src="https://cdn.koptup.com/widget.js?bot=${effectiveBotId}" async></script>`,
      ].join('\n');

    case 'iframe':
      return [
        '<iframe',
        `  src="${iframeSrc}"`,
        '  width="380"',
        '  height="600"',
        '  frameborder="0"',
        `  title="${c.botName}"`,
        '  allow="microphone"',
        '  style="position:fixed;bottom:20px;right:20px;border:none;background:transparent;z-index:2147483647"',
        '></iframe>',
      ].join('\n');

    case 'react':
      return [
        "import { KopTupChatbot } from '@koptup/widget-react';",
        '',
        'export default function App() {',
        '  return (',
        '    <KopTupChatbot',
        `      botId="${effectiveBotId}"`,
        `      primaryColor="${c.primaryColor}"`,
        `      position="${c.position}"`,
        `      avatar="${c.avatar}"`,
        `      welcome={${JSON.stringify(c.welcome)}}`,
        `      tone="${c.tone}"`,
        `      languages={${JSON.stringify(c.languages)}}`,
        '    />',
        '  );',
        '}',
      ].join('\n');

    case 'webhook':
    default:
      return [
        `# Webhook URL para ${c.botName}`,
        `POST ${webhookUrl}`,
        '',
        '# Headers',
        'Content-Type: application/json',
        '',
        '# Body de ejemplo',
        JSON.stringify(
          {
            message: 'Hola, ¿cuál es el horario de atención?',
            history: [],
          },
          null,
          2,
        ),
        '',
        '# Respuesta',
        '# { "botId": "...", "reply": "...", "sources": [...] }',
      ].join('\n');
  }
}

/**
 * Coloreo "casual" del snippet: tags HTML/JSX, strings y comentarios.
 * No es un highlighter real; sólo un toque de UX.
 */
function highlight(snippet: string): React.ReactNode {
  const lines = snippet.split('\n');
  return lines.map((line, idx) => {
    const isComment = /^\s*(\/\/|#|<!--)/.test(line);
    return (
      <div
        key={idx}
        className={isComment ? 'text-secondary-500 dark:text-secondary-500' : ''}
      >
        {line.length === 0 ? ' ' : line}
      </div>
    );
  });
}

export default function EmbedCode({ config, botId }: EmbedCodeProps) {
  const t = useTranslations('demoChatbot.builder');
  const [tab, setTab] = useState<EmbedTabKey>('iframe');
  const [copied, setCopied] = useState(false);

  const effectiveBotId = botId ?? config.botId;
  const snippet = useMemo(
    () => buildSnippet(tab, config, effectiveBotId),
    [tab, config, effectiveBotId],
  );

  const onCopy = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }
  }, [snippet]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
          {t('embed.title')}
        </h3>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
          {t('embed.subtitle')}
        </p>
      </header>

      {/* Tabs */}
      <div
        className="flex gap-0.5 border-b border-secondary-200 bg-secondary-50 px-2 pt-2 dark:border-secondary-800 dark:bg-secondary-950"
        role="tablist"
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
              {t(`embed.tabs.${tk}`)}
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 overflow-hidden p-3">
        <pre className="h-full overflow-auto rounded-md bg-secondary-950 p-3 font-mono text-[11px] leading-relaxed text-secondary-100">
          <code>{highlight(snippet)}</code>
        </pre>

        <button
          type="button"
          onClick={onCopy}
          className="absolute right-5 top-5 flex items-center gap-1 rounded-md bg-secondary-800/90 px-2 py-1 text-[11px] font-medium text-white shadow ring-1 ring-white/10 hover:bg-secondary-700"
          aria-label={t('embed.copy')}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" />
              {t('embed.copied')}
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              {t('embed.copy')}
            </>
          )}
        </button>

        {copied ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-lg"
          >
            {t('embed.copied')}
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-secondary-200 px-3 py-2 text-[10px] text-secondary-500 dark:border-secondary-800 dark:text-secondary-400">
        <span className="truncate">
          {t('embed.botId')}: <span className="font-mono">{effectiveBotId}</span>
        </span>
        <span className="font-mono">
          {!botId ? t('embed.saveFirst') : tab === 'webhook' ? t('embed.webhookTitle') : null}
        </span>
      </footer>
    </div>
  );
}
