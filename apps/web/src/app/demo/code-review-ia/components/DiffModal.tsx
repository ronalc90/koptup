'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { XMarkIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  LOCAL_RULES, MAX_INPUT_LINES, parseInput, tr,
  type Locale, type ParsedInput, type ParseError,
} from './analyzer';
import { SAMPLE_DIFF } from './data';
import { sevBadge, type T } from './tabs';

/**
 * "Prueba con tu diff": el texto se analiza en el navegador con las reglas
 * locales de analyzer.ts. No se envía a ningún servidor ni se guarda.
 */
export default function DiffModal({
  open, onClose, onAnalyze, t, locale,
}: {
  open: boolean;
  onClose: () => void;
  onAnalyze: (parsed: ParsedInput) => void;
  t: T;
  locale: Locale;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<ParseError | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = text ? text.replace(/\s+$/, '').split(/\r?\n/).length : 0;

  useEffect(() => {
    if (!open) return;
    setError(null);
    const id = window.setTimeout(() => areaRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const analyze = () => {
    const r = parseInput(text, t('modal.fragmentName'));
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    onAnalyze(r.value);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-black/70 p-3 sm:p-6 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="crd-title" className="w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 id="crd-title" className="text-base font-semibold">{t('modal.title')}</h2>
            <p className="text-xs text-zinc-400 mt-1">{t('modal.intro', { max: MAX_INPUT_LINES, rules: LOCAL_RULES.length })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('modal.close')} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('modal.warning')}</span>
          </div>
          <label htmlFor="crd-input" className="sr-only">{t('modal.inputLabel')}</label>
          <textarea
            id="crd-input"
            ref={areaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); if (error) setError(null); }}
            placeholder={t('modal.placeholder')}
            spellCheck={false}
            rows={12}
            className="w-full font-mono text-xs bg-zinc-950 border border-zinc-700 rounded-md p-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className={lineCount > MAX_INPUT_LINES ? 'text-rose-400' : 'text-zinc-500'}>
              {t('modal.lines', { count: lineCount, max: MAX_INPUT_LINES })}
            </span>
            <Button size="sm" variant="ghost" className="!text-zinc-300" onClick={() => { setText(SAMPLE_DIFF); setError(null); }}>
              {t('modal.loadSample')}
            </Button>
          </div>
          {error && <p role="alert" className="text-xs text-rose-400">{t(`modal.errors.${error}`, { max: MAX_INPUT_LINES })}</p>}
          <details className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
            <summary className="cursor-pointer text-zinc-300 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4" />{t('modal.rulesTitle', { count: LOCAL_RULES.length })}
            </summary>
            <ul className="mt-2 space-y-1.5">
              {LOCAL_RULES.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  <Badge variant={sevBadge(r.severity)} size="sm" className="shrink-0">{t(`severity.${r.severity}`)}</Badge>
                  <span className="text-zinc-300">{tr(r.name, locale)}{r.fix ? ` · ${t('modal.autoFix')}` : ''}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-zinc-500">{t('modal.rulesNote')}</p>
          </details>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-zinc-800">
          <Button size="sm" variant="ghost" className="!text-zinc-300" onClick={onClose}>{t('modal.cancel')}</Button>
          <Button size="sm" variant="primary" onClick={analyze}>{t('modal.analyze')}</Button>
        </div>
      </div>
    </div>
  );
}
