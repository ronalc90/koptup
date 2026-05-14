'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useModalClose } from '@/hooks/useModalClose';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SNIPPETS: Record<string, string> = {
  JavaScript: `// Sandboxed Node.js · 256MB · 30s timeout
export default async function run(input, ctx) {
  const enriched = input.items.map(item => ({
    ...item,
    score: item.revenue * 0.4 + item.size * 0.6,
    enrichedAt: new Date().toISOString(),
  }));

  await ctx.kv.set('last_run', enriched.length);
  return { items: enriched };
}`,
  Python: `# Sandboxed CPython 3.11 · 512MB · 60s timeout
def run(input, ctx):
    items = input["items"]
    enriched = [
        {
            **i,
            "score": i["revenue"] * 0.4 + i["size"] * 0.6,
        }
        for i in items
    ]
    ctx.kv.set("last_run", len(enriched))
    return {"items": enriched}`,
};

export default function CodeEditorModal({ open, onClose }: Props) {
  const t = useTranslations('demoAutomation.code');
  const [lang, setLang] = useState<keyof typeof SNIPPETS>('JavaScript');
  const [tab, setTab] = useState<'code' | 'input' | 'output'>('code');
  useModalClose(open, onClose);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-modal-title"
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative z-50 bg-secondary-900 border border-secondary-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-secondary-800">
          <h2 id="code-modal-title" className="text-base font-semibold text-white">{t('title')}</h2>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="code-lang-select">{t('language')}</label>
            <select
              id="code-lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as keyof typeof SNIPPETS)}
              className="px-2 py-1 text-xs bg-secondary-950 border border-secondary-800 rounded text-secondary-200"
            >
              {Object.keys(SNIPPETS).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button onClick={onClose} aria-label={t('close')} className="text-secondary-500 hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-secondary-800 bg-secondary-950/40">
          {(['code', 'input', 'output'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                tab === k
                  ? 'text-primary-300 border-b-2 border-primary-500 bg-secondary-900/60'
                  : 'text-secondary-500 hover:text-secondary-200 border-b-2 border-transparent'
              }`}
            >
              {t(`tabs.${k}`)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 bg-secondary-950">
          {tab === 'code' && (
            <pre className="text-[12px] text-emerald-300 font-mono leading-relaxed">
              {SNIPPETS[lang]}
            </pre>
          )}
          {tab === 'input' && (
            <pre className="text-[12px] text-sky-300 font-mono leading-relaxed">
{`{
  "items": [
    { "id": "a1", "revenue": 12400, "size": 142 },
    { "id": "a2", "revenue": 8200, "size": 60 }
  ]
}`}
            </pre>
          )}
          {tab === 'output' && (
            <pre className="text-[12px] text-emerald-300 font-mono leading-relaxed">
{`{
  "items": [
    { "id": "a1", "revenue": 12400, "size": 142, "score": 5045.2 },
    { "id": "a2", "revenue": 8200, "size": 60, "score": 3316 }
  ]
}`}
            </pre>
          )}
        </div>

        <div className="px-5 py-3 border-t border-secondary-800 flex justify-end gap-2">
          <button className="px-3 py-1.5 text-xs text-secondary-300 hover:text-white">
            {t('save')}
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors">
            <PlayIcon className="h-3.5 w-3.5" />
            {t('run')}
          </button>
        </div>
      </div>
    </div>
  );
}
