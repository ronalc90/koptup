'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useModeration } from '../lib/store';
import type { CaseView } from '../lib/store';
import { SectionTitle, SimNote, focusRing, selectCls } from './ui';

const HOST = 'https://moderacion.example.com';

type Mode = 'realtime' | 'batch';
type CodeLang = 'curl' | 'ts' | 'python';

function requestBody(mode: Mode, v: CaseView): unknown {
  const item = { id: v.id, type: v.type, text: v.text };
  return mode === 'batch' ? { items: [item], callbackUrl: 'https://tu-plataforma.example.com/webhooks/moderacion' } : item;
}

export function responseBody(v: CaseView, rulesVersion: number): unknown {
  return {
    id: v.id,
    category: v.label,
    confidence: v.score,
    action: v.route.action,
    rule: v.route.ruleNo,
    rulesVersion,
    signals: v.label === 'none' ? [] : v.cls.signalsBy[v.label as Exclude<CaseView['label'], 'none'>],
  };
}

function snippet(mode: Mode, lang: CodeLang, body: unknown): string {
  const path = mode === 'batch' ? '/v1/moderate/batch' : '/v1/moderate';
  const json = JSON.stringify(body, null, 2);
  if (lang === 'curl') {
    return `curl -X POST ${HOST}${path} \\
  -H "Authorization: Bearer $MODERACION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${json.replace(/'/g, "'\\''")}'`;
  }
  if (lang === 'ts') {
    return `const res = await fetch("${HOST}${path}", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.MODERACION_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),
});
const decision = await res.json();`;
  }
  return `import os, requests

res = requests.post(
    "${HOST}${path}",
    headers={"Authorization": f"Bearer {os.environ['MODERACION_API_KEY']}"},
    json=${json.replace(/\n/g, '\n    ').replace(/\bnull\b/g, 'None').replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False')},
)
decision = res.json()`;
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const t = useTranslations('demoModeration.api');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-secondary-950 p-4 pr-24 text-xs leading-relaxed text-secondary-100" aria-label={label}>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code).catch(() => {});
          setCopied(true);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        }}
        className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-secondary-800 px-2 py-1 text-xs text-secondary-100 hover:bg-secondary-700 ${focusRing}`}
      >
        <ClipboardIcon className="h-3.5 w-3.5" aria-hidden />
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

export default function ApiTab() {
  const t = useTranslations('demoModeration');
  const { views, s } = useModeration();
  const [mode, setMode] = useState<Mode>('realtime');
  const [codeLang, setCodeLang] = useState<CodeLang>('curl');
  const [caseId, setCaseId] = useState<string>(views[0]?.id ?? '');
  const v = views.find((x) => x.id === caseId) ?? views[0];
  const rulesVersion = s.audit.filter((e) => e.action === 'rulesEdit').length + 1;
  const webhook = v
    ? {
        event: 'moderation.decision',
        id: v.id,
        decision: v.status === 'pending' ? 'pending_review' : v.status,
        category: v.decision?.policy ?? v.label,
        by: v.decision?.kind === 'auto' ? `rule:${v.decision.ruleNo}` : v.decision ? 'moderator' : null,
        at: v.decision?.at ?? null,
      }
    : null;

  const pill = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm transition-colors ${focusRing} ${
      active ? 'border-primary-600 bg-primary-600 text-white' : 'border-secondary-200 bg-white text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-200'
    }`;

  return (
    <section>
      <SectionTitle title={t('api.title')} subtitle={t('api.subtitle')} />
      <SimNote className="mb-4">{t('api.illustrative')}</SimNote>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('api.modeLabel')}>
          {(['realtime', 'batch'] as Mode[]).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={pill(mode === m)}>
              {t(`api.${m}`)}
            </button>
          ))}
        </div>
        <label className="block md:w-80">
          <span className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('api.caseLabel')}</span>
          <select value={v?.id ?? ''} onChange={(e) => setCaseId(e.target.value)} className={selectCls}>
            {views.map((x) => (
              <option key={x.id} value={x.id}>
                {x.id} · {t(`categories.${x.label}.name`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-600 dark:text-secondary-400">
            <span>
              <strong>{t('api.endpoint')}:</strong> <code className="font-mono">POST {mode === 'batch' ? '/v1/moderate/batch' : '/v1/moderate'}</code>
            </span>
            <span>
              <strong>{t('api.auth')}:</strong> {t('api.authValue')}
            </span>
          </div>
          <div className="flex gap-1" role="group" aria-label={t('api.langLabel')}>
            {(['curl', 'ts', 'python'] as CodeLang[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={codeLang === l}
                onClick={() => setCodeLang(l)}
                className={`rounded-md px-2.5 py-1 text-xs ${focusRing} ${codeLang === l ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200'}`}
              >
                {t(`api.${l}`)}
              </button>
            ))}
          </div>
        </div>
        {v && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-secondary-900 dark:text-white">{t('api.request')}</h3>
              <CodeBlock code={snippet(mode, codeLang, requestBody(mode, v))} label={t('api.request')} />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-secondary-900 dark:text-white">{mode === 'batch' ? t('api.responseBatch') : t('api.response')}</h3>
              <p className="mb-1 text-xs text-secondary-500 dark:text-secondary-400">{t('api.responseHint')}</p>
              <CodeBlock
                code={JSON.stringify(mode === 'batch' ? { jobId: 'job_0001', status: 'queued', items: 1 } : responseBody(v, rulesVersion), null, 2)}
                label={t('api.response')}
              />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-secondary-900 dark:text-white">{t('api.webhook')}</h3>
              <p className="mb-1 text-xs text-secondary-500 dark:text-secondary-400">{t('api.webhookHint')}</p>
              <CodeBlock code={JSON.stringify(webhook, null, 2)} label={t('api.webhook')} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
