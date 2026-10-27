'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookmarkSquareIcon, PlayIcon } from '@heroicons/react/24/outline';
import type { JsResult } from '../lib/engine';
import { fmtDec } from '../lib/format';
import { JS_TIMEOUT_MS, runInWorker } from '../lib/sandbox';
import { useAutomation } from '../lib/store';
import { ConfirmDialog, JsonBlock, Modal, btnGhost, btnPrimary, focusRing } from './ui';

type Tab = 'code' | 'input' | 'output';

export default function CodeEditorModal({ stepId, onClose }: { stepId: string | null; onClose: () => void }) {
  const t = useTranslations('demoAutomation.code');
  const tr = useTranslations('demoAutomation');
  const { wf, updateStep, testStep, wfSamples, sampleId, msg, toast, loc } = useAutomation();
  const seconds = fmtDec(JS_TIMEOUT_MS / 1000, loc);
  const step = wf.steps.find((x) => x.id === stepId) ?? null;
  const saved = step ? String(step.config.code ?? '') : '';
  const [draft, setDraft] = useState(saved);
  const [tab, setTab] = useState<Tab>('code');
  const [sample, setSample] = useState(sampleId);
  const [input, setInput] = useState<unknown>(null);
  const [inputNote, setInputNote] = useState<string | null>(null);
  const [result, setResult] = useState<(JsResult & { ms: number }) | null>(null);
  const [running, setRunning] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!stepId) return;
    setDraft(saved);
    setTab('code');
    setResult(null);
    // Solo al abrir el editor de otro paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  // Datos que recibe el paso con el ejemplo elegido.
  useEffect(() => {
    if (!stepId) return;
    let alive = true;
    setInputNote(null);
    testStep(stepId, sample || sampleId).then((res) => {
      if (!alive) return;
      if (!res) {
        setInput(null);
        setInputNote(t('noInput'));
      } else if (res.blockedBy) {
        setInput(null);
        setInputNote(`${t('blocked', { step: res.blockedBy.name })} ${msg(res.blockedBy.msg)}`);
      } else setInput(res.input);
    });
    return () => {
      alive = false;
    };
    // testStep cambia con el flujo; basta con el paso y el ejemplo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, sample]);

  if (!step) return null;
  const dirty = draft !== saved;

  const run = async () => {
    setRunning(true);
    const t0 = performance.now();
    const res = await runInWorker(draft, (input as Record<string, unknown>) ?? {});
    setResult({ ...res, ms: Math.round(performance.now() - t0) });
    setRunning(false);
    setTab('output');
  };

  const requestClose = () => {
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  const errorText = (e: string) => (e.startsWith('§') ? tr(e.slice(1)) : e);

  return (
    <>
      <Modal
        open={!!step}
        onClose={requestClose}
        title={t('title', { name: step.name })}
        subtitle={t('subtitle', { seconds })}
        size="lg"
        footer={
          <>
            {dirty && <span className="mr-auto text-[11px] text-amber-300">{t('unsaved')}</span>}
            <button type="button" onClick={requestClose} className={btnGhost}>
              {t('close')}
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                updateStep(step.id, { config: { code: draft } });
                toast(t('savedToast', { name: step.name }));
              }}
              className={btnGhost}
            >
              <BookmarkSquareIcon className="h-3.5 w-3.5" />
              {t('save')}
            </button>
            <button type="button" onClick={run} disabled={running || !draft.trim()} className={btnPrimary}>
              <PlayIcon className="h-3.5 w-3.5" />
              {running ? t('running') : t('run')}
            </button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-[11px] text-secondary-400">
            {t('sample')}
            <select value={sample || sampleId} onChange={(e) => setSample(e.target.value)} className="mt-1 block max-w-[320px] rounded-md border border-secondary-700 bg-secondary-950 px-2 py-1 text-xs text-secondary-100">
              {wfSamples.map((x) => (
                <option key={x.id} value={x.id}>
                  {tr(x.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <span className="rounded border border-secondary-700 px-2 py-1 text-[11px] text-secondary-300">{t('language')}</span>
        </div>
        <div role="tablist" className="mb-2 flex border-b border-secondary-800">
          {(['code', 'input', 'output'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`border-b-2 px-3 py-1.5 text-xs font-medium ${focusRing} ${tab === k ? 'border-primary-500 text-primary-200' : 'border-transparent text-secondary-400 hover:text-secondary-200'}`}
            >
              {t(`tabs.${k}`)}
            </button>
          ))}
        </div>
        {tab === 'code' && (
          <>
            <label htmlFor="code-editor" className="sr-only">
              {t('tabs.code')}
            </label>
            <textarea
              id="code-editor"
              data-autofocus
              value={draft}
              spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart;
                  const next = `${draft.slice(0, start)}  ${draft.slice(el.selectionEnd)}`;
                  setDraft(next);
                  requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
                }
              }}
              rows={14}
              className="w-full resize-y rounded-md border border-secondary-800 bg-secondary-950 p-3 font-mono text-[12px] leading-relaxed text-emerald-200 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <p className="mt-1 text-[11px] text-secondary-400">{t('help')}</p>
          </>
        )}
        {tab === 'input' && (inputNote ? <p className="text-xs text-amber-200">{inputNote}</p> : <JsonBlock value={input} className="max-h-80" />)}
        {tab === 'output' &&
          (result ? (
            result.ok ? (
              <>
                <p className="mb-1 text-[11px] text-emerald-300">{t('ok', { ms: result.ms })}</p>
                <JsonBlock value={result.value} className="max-h-80" />
              </>
            ) : (
              <p className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 font-mono text-xs text-rose-200">
                {result.timeout ? t('timeout', { seconds }) : t('error', { error: errorText(result.error) })}
              </p>
            )
          ) : (
            <p className="text-xs text-secondary-400">{t('noOutput')}</p>
          ))}
      </Modal>
      <ConfirmDialog
        open={confirmClose}
        title={t('discardTitle')}
        body={t('discardBody')}
        confirmLabel={t('discard')}
        danger
        onClose={() => setConfirmClose(false)}
        onConfirm={onClose}
      />
    </>
  );
}
