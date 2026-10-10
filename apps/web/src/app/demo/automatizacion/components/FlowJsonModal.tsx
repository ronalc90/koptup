'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useAutomation } from '../lib/store';
import { Modal, btnGhost, btnPrimary, downloadText } from './ui';

export const FLOW_FORMAT = 'koptup-demo-flow';

export default function FlowJsonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoAutomation.json');
  const { wf, importWorkflow, toast } = useAutomation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const json = useMemo(
    () =>
      JSON.stringify(
        {
          format: FLOW_FORMAT,
          version: 1,
          name: wf.name,
          steps: wf.steps.map((st) => ({ type: st.type, name: st.name, config: st.config, retry: st.retry, credential: st.credential })),
        },
        null,
        2,
      ),
    [wf],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast(t('copied'));
    } catch {
      toast(t('copyFailed'), 'warn');
    }
  };

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size > 200_000) {
      setError(t('errors.size'));
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError(t('errors.json'));
      return;
    }
    const res = importWorkflow(parsed);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast(t('imported', { name: res.name }));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('subtitle')}
      size="lg"
      footer={
        <>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => {
              const input = e.target;
              onFile(input.files?.[0]).finally(() => {
                input.value = '';
              });
            }} />
          <button type="button" onClick={() => fileRef.current?.click()} className={`${btnGhost} mr-auto`}>
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            {t('import')}
          </button>
          <button type="button" onClick={copy} className={btnGhost}>
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            {t('copy')}
          </button>
          <button type="button" onClick={() => downloadText(`${wf.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.json`, json, 'application/json')} className={btnPrimary}>
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {t('download')}
          </button>
        </>
      }
    >
      <p className="mb-2 text-xs leading-relaxed text-secondary-300">{t('intro')}</p>
      {error && (
        <p role="alert" className="mb-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">
          {error}
        </p>
      )}
      <pre className="max-h-[50vh] overflow-auto whitespace-pre rounded-md border border-secondary-800 bg-secondary-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-200">{json}</pre>
      <p className="mt-2 text-[11px] text-secondary-400">{t('note')}</p>
    </Modal>
  );
}
