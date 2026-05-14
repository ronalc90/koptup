'use client';

import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';

export function CodeBlock({ code, lang = 'ts' }: { code: string; lang?: string }) {
  return (
    <pre className="rounded-lg bg-secondary-950 dark:bg-black border border-secondary-800 text-secondary-100 text-xs leading-relaxed p-4 overflow-x-auto">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-secondary-500 mb-2">
        <span>{lang}</span>
        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
      </div>
      <code>
        {code.split('\n').map((line, i) => (
          <div key={i} className="whitespace-pre">
            <span className="select-none text-secondary-600 mr-3">{String(i + 1).padStart(2, '0')}</span>
            <span
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/(--.*$|\/\/.*$)/g, '<span class="text-secondary-500">$1</span>')
                  .replace(/('[^']*'|`[^`]*`|"[^"]*")/g, '<span class="text-emerald-400">$1</span>')
                  .replace(
                    /\b(SELECT|FROM|WHERE|ALTER|TABLE|ENABLE|ROW|LEVEL|SECURITY|CREATE|POLICY|USING|SET|LOCAL|LIMIT|IS|NULL|AND|OR)\b/g,
                    '<span class="text-fuchsia-400">$1</span>'
                  )
                  .replace(
                    /\b(const|await|return|async|function|new|import|from|export)\b/g,
                    '<span class="text-fuchsia-400">$1</span>'
                  )
                  .replace(/\b([A-Z][A-Z_]+)\b/g, '<span class="text-amber-300">$1</span>'),
              }}
            />
          </div>
        ))}
      </code>
    </pre>
  );
}

export function ArchNode({ title, sub, accent }: { title: string; sub: string; accent: string }) {
  return (
    <div className={`rounded-xl border ${accent} p-3 bg-white/60 dark:bg-secondary-900/60 backdrop-blur text-center`}>
      <div className="text-sm font-semibold text-secondary-900 dark:text-white">{title}</div>
      <div className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-0.5">{sub}</div>
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  tone = 'primary',
}: {
  value: number;
  max: number;
  tone?: 'primary' | 'warning' | 'danger';
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const tones = {
    primary: 'bg-primary-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };
  return (
    <div className="w-full h-2 rounded-full bg-secondary-200 dark:bg-secondary-800 overflow-hidden">
      <div className={`h-full ${tones[tone]} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
