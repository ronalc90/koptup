'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { downloadBlob } from '@/lib/utils';
import { listJson, listUrl, type ApiQuery } from '../lib/api';
import { useCms } from '../lib/store';
import { LOCALES, TYPE_IDS, type Locale, type TypeId } from '../lib/types';
import { btn, card, labelCls, Note, selectCls, Switch } from './ui';

type Snippet = 'next' | 'curl';

export default function ApiView() {
  const t = useTranslations('demoCms.api');
  const tTypes = useTranslations('demoCms.types');
  const { state, toast } = useCms();
  const [q, setQ] = useState<ApiQuery>({ type: 'location', locale: 'es', preview: false });
  const [snippet, setSnippet] = useState<Snippet>('next');
  const json = listJson(state, q);
  const body = JSON.stringify(json, null, 2);
  const url = listUrl(q);
  const total = (json as { meta: { total: number } }).meta.total;
  const code =
    snippet === 'next'
      ? `// app/${q.type}/page.tsx (Next.js)\nexport default async function Page() {\n  const res = await fetch('${url}', {\n    next: { tags: ['cms:${q.type}'] }, // ${t('snippetComment')}\n  });\n  const { data } = await res.json();\n  return <EntryList items={data} />;\n}`
      : `curl -s '${url}'${q.preview ? " \\\n  -H 'Authorization: Bearer <preview-token>'" : ''}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t('copied'), 'info');
    } catch {
      toast(t('copyFailed'), 'warn');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
      </div>
      <div className={`${card} p-4 grid sm:grid-cols-3 gap-3 items-end`}>
        <div>
          <label htmlFor="cms-api-type" className={labelCls}>
            {t('type')}
          </label>
          <select id="cms-api-type" value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value as TypeId | 'all' })} className={selectCls}>
            <option value="all">{t('allTypes')}</option>
            {TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {tTypes(`${id}.name`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cms-api-locale" className={labelCls}>
            {t('locale')}
          </label>
          <select id="cms-api-locale" value={q.locale} onChange={(e) => setQ({ ...q, locale: e.target.value as Locale })} className={selectCls}>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch checked={q.preview} onChange={(v) => setQ({ ...q, preview: v })} label={t('preview')} />
          <span className="text-sm text-slate-700 dark:text-slate-200">{t('preview')}</span>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
        <section className={`${card} p-4 space-y-3 min-w-0`} aria-label={t('response')}>
          <div className="rounded-lg bg-slate-900 text-slate-100 text-xs font-mono p-3 break-all">
            <span className="text-emerald-400 font-semibold">GET</span> {url}
            {q.preview && <span className="block text-slate-400 mt-1">Authorization: Bearer &lt;{t('previewToken')}&gt;</span>}
            <span className="block mt-1 text-emerald-400">200 OK · {t('results', { n: total })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.small} onClick={() => copy(body)}>
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              {t('copy')}
            </button>
            <button
              type="button"
              className={btn.small}
              onClick={() => {
                downloadBlob(new Blob([body], { type: 'application/json' }), `entries-${q.type}-${q.locale}.json`);
                toast(t('downloaded'));
              }}
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              {t('download')}
            </button>
          </div>
          <pre className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 overflow-auto max-h-[32rem]">{body}</pre>
        </section>
        <section className={`${card} p-4 space-y-3 min-w-0`} aria-label={t('snippets')}>
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('snippets')}>
            {(['next', 'curl'] as const).map((s) => (
              <button key={s} type="button" aria-pressed={snippet === s} onClick={() => setSnippet(s)} className={`px-3 py-1.5 text-xs font-semibold ${snippet === s ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
                {t(`snippet.${s}`)}
              </button>
            ))}
          </div>
          <pre className="rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] leading-relaxed overflow-auto whitespace-pre">{code}</pre>
          <button type="button" className={btn.small} onClick={() => copy(code)}>
            <ClipboardDocumentIcon className="w-3.5 h-3.5" />
            {t('copyCode')}
          </button>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc pl-5">
            <li>{t('point1')}</li>
            <li>{t('point2')}</li>
            <li>{t('point3')}</li>
          </ul>
          <Note>{t('simulated')}</Note>
        </section>
      </div>
    </div>
  );
}
