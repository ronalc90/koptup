'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownIcon, ArrowUpIcon, CodeBracketIcon, DocumentDuplicateIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SHEET_COLUMNS, TYPE_DEFS, isTrigger, type FieldDef, type SheetKey, typeKey } from '../lib/catalog';
import { backoffMs, listPaths } from '../lib/engine';
import { fmtDec } from '../lib/format';
import { credentialsFor } from '../lib/samples';
import { useAutomation, type TestResult } from '../lib/store';
import type { ConfigValue, Step } from '../lib/types';
import { TYPE_ICONS } from './icons';
import { JsonBlock, SimTag, btnGhost, btnPrimary, focusRing, inputCls } from './ui';

type TabKey = 'params' | 'auth' | 'retry' | 'test';

interface Props {
  stepId: string | null;
  onOpenCode: (stepId: string) => void;
  onSelect: (id: string | null) => void;
  onDeleted?: () => void;
}

const STATUS_TONE: Record<string, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  retry: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  review: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  stopped: 'border-secondary-600 bg-secondary-800 text-secondary-200',
  failed: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  cancelled: 'border-secondary-600 bg-secondary-800 text-secondary-200',
};

export default function NodeInspector({ stepId, onOpenCode, onSelect, onDeleted }: Props) {
  const t = useTranslations('demoAutomation');
  const { wf, s, updateStep, moveStep, removeStep, duplicateStep, testStep, wfSamples, sampleId, msg, loc } = useAutomation();
  const index = wf.steps.findIndex((x) => x.id === stepId);
  const step = index >= 0 ? wf.steps[index] : null;
  const [tab, setTab] = useState<TabKey>('params');
  const [testSample, setTestSample] = useState(sampleId);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Campos que tenía el paso en la última ejecución (para ayudar con {{campo}}).
  const knownPaths = useMemo(() => {
    if (!step) return [];
    for (const r of s.runs) {
      if (r.workflowId !== wf.id) continue;
      const log = r.steps.find((l) => l.stepId === step.id);
      if (log) return listPaths(log.input).filter((p) => !p.startsWith('documento.contenido'));
    }
    return [];
  }, [s.runs, step, wf.id]);

  if (!step) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-xs text-secondary-400">{t('inspector.empty')}</p>
      </div>
    );
  }

  const def = TYPE_DEFS[step.type];
  const Icon = TYPE_ICONS[step.type];
  const trigger = isTrigger(step.type);
  const setConfig = (key: string, value: ConfigValue) => updateStep(step.id, { config: { [key]: value } });
  const tabs: TabKey[] = ['params', 'auth', 'retry', 'test'];
  const creds = credentialsFor(step.type);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const [res] = await Promise.all([testStep(step.id, testSample || sampleId), new Promise((r) => setTimeout(r, 350))]);
    setResult(res);
    setTesting(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-secondary-800 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary-300">{t('inspector.title')}</h2>
        <div className="mt-1 flex items-center gap-1.5">
          <Icon className="h-4 w-4 shrink-0 text-secondary-300" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{step.name}</p>
          {def.simulated && <SimTag />}
        </div>
        <p className="mt-0.5 text-[11px] text-secondary-400">
          {t('inspector.position', { n: index + 1, total: wf.steps.length })} · {t(`types.${typeKey(step.type)}.name`)}
        </p>
      </div>

      <div role="tablist" aria-label={t('inspector.title')} className="flex border-b border-secondary-800 bg-secondary-950/40">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex-1 border-b-2 px-1 py-2 text-[11px] font-medium transition-colors ${focusRing} ${
              tab === k ? 'border-primary-500 bg-secondary-900/60 text-primary-200' : 'border-transparent text-secondary-400 hover:text-secondary-200'
            }`}
          >
            {t(`inspector.tabs.${k}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === 'params' && (
          <>
            <p className="rounded-md border border-secondary-800 bg-secondary-900/60 p-2 text-[11px] leading-relaxed text-secondary-300">{t.raw(`types.${typeKey(step.type)}.help`) as string}</p>
            <label className="block text-[11px] text-secondary-400">
              {t('fields.name')}
              <input value={step.name} maxLength={60} onChange={(e) => updateStep(step.id, { name: e.target.value })} className={`${inputCls} mt-1`} />
            </label>
            {def.fields.map((f) => (
              <FieldInput key={f.key} field={f} step={step} onChange={setConfig} onOpenCode={() => onOpenCode(step.id)} />
            ))}
            {def.fields.some((f) => f.kind === 'template' || f.kind === 'textarea') && (
              <div className="rounded-md border border-secondary-800 p-2">
                <p className="text-[11px] font-medium text-secondary-300">{t('inspector.vars')}</p>
                {knownPaths.length ? (
                  <p className="mt-1 break-words font-mono text-[10.5px] leading-relaxed text-sky-200">{knownPaths.map((p) => `{{${p}}}`).join('  ')}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-secondary-400">{t('inspector.varsEmpty')}</p>
                )}
              </div>
            )}
            <div className="space-y-2 border-t border-secondary-800 pt-3">
              {trigger ? (
                <p className="text-[11px] text-secondary-400">{t('inspector.triggerNote')}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={btnGhost} disabled={index <= 1} onClick={() => moveStep(step.id, index - 1)}>
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                    {t('inspector.moveBefore')}
                  </button>
                  <button type="button" className={btnGhost} disabled={index >= wf.steps.length - 1} onClick={() => moveStep(step.id, index + 2)}>
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                    {t('inspector.moveAfter')}
                  </button>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={wf.steps.length >= 20}
                    onClick={() => {
                      const id = duplicateStep(step.id);
                      if (id) onSelect(id);
                    }}
                  >
                    <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                    {t('inspector.duplicate')}
                  </button>
                  <button
                    type="button"
                    className={`${btnGhost} border-rose-500/40 text-rose-200 hover:bg-rose-500/10`}
                    onClick={() => {
                      const next = wf.steps[index - 1]?.id ?? null;
                      removeStep(step.id);
                      onSelect(next);
                      onDeleted?.();
                    }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    {t('inspector.delete')}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'auth' && (
          <div className="space-y-2">
            {def.credential ? (
              <>
                <label className="block text-[11px] text-secondary-400">
                  {t('inspector.credential')}
                  <select value={step.credential} onChange={(e) => updateStep(step.id, { credential: e.target.value })} className={`${inputCls} mt-1`}>
                    <option value="">{t('inspector.noCredential')}</option>
                    {creds.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(`credentials.${c.id}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {def.credentialRequired && !step.credential && <p className="text-[11px] text-amber-300">{t('inspector.credentialRequired')}</p>}
                <p className="text-[11px] leading-relaxed text-secondary-400">{t('inspector.credentialNote')}</p>
              </>
            ) : (
              <p className="text-[11px] text-secondary-400">{t('inspector.noCredentialNeeded')}</p>
            )}
          </div>
        )}

        {tab === 'retry' && (
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed text-secondary-300">{t('inspector.retry.intro')}</p>
            <label className="block text-[11px] text-secondary-400">
              {t('inspector.retry.attempts')}
              <select value={step.retry.attempts} onChange={(e) => updateStep(step.id, { retry: { attempts: Number(e.target.value) } })} className={`${inputCls} mt-1`}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? t('inspector.retry.none') : n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-secondary-400">
              {t('inspector.retry.base')}
              <select value={step.retry.baseSeconds} onChange={(e) => updateStep(step.id, { retry: { baseSeconds: Number(e.target.value) } })} className={`${inputCls} mt-1`}>
                {[1, 2, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} s
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-secondary-400">
              {t('inspector.retry.backoff')}
              <select value={step.retry.backoff} onChange={(e) => updateStep(step.id, { retry: { backoff: e.target.value === 'linear' ? 'linear' : 'exponential' } })} className={`${inputCls} mt-1`}>
                <option value="exponential">{t('inspector.retry.exponential')}</option>
                <option value="linear">{t('inspector.retry.linear')}</option>
              </select>
            </label>
            {step.retry.attempts > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] text-secondary-400">{t('inspector.retry.preview')}</p>
                <div className="flex h-14 items-end gap-1">
                  {Array.from({ length: step.retry.attempts }, (_, i) => {
                    const ms = backoffMs(step.retry, i + 1);
                    const max = backoffMs(step.retry, step.retry.attempts);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                        <div className="w-full rounded-sm bg-gradient-to-t from-primary-700 to-primary-400" style={{ height: `${Math.max(12, (ms / max) * 40)}px` }} />
                        <span className="text-[10px] text-secondary-400">{fmtDec(ms / 1000, loc, ms % 1000 ? 1 : 0)} s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-secondary-400">{t('inspector.retry.after')}</p>
          </div>
        )}

        {tab === 'test' && (
          <div className="space-y-3">
            <label className="block text-[11px] text-secondary-400">
              {t('inspector.test.sample')}
              <select value={testSample || sampleId} onChange={(e) => setTestSample(e.target.value)} className={`${inputCls} mt-1`}>
                {wfSamples.map((x) => (
                  <option key={x.id} value={x.id}>
                    {t(x.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={runTest} disabled={testing || !wfSamples.length} className={`${btnPrimary} w-full`}>
              <PlayIcon className="h-3.5 w-3.5" />
              {testing ? t('inspector.test.running') : t('inspector.test.run')}
            </button>
            <p className="text-[11px] text-secondary-400">{t('inspector.test.note')}</p>
            {result && (
              <div className="space-y-2" aria-live="polite">
                {result.blockedBy ? (
                  <p className={`rounded-md border p-2 text-[11px] ${STATUS_TONE[result.blockedBy.status]}`}>
                    {t('inspector.test.blocked', { step: result.blockedBy.name })} {msg(result.blockedBy.msg)}
                  </p>
                ) : (
                  result.logs.map((l, i) => (
                    <p key={i} className={`rounded-md border p-2 text-[11px] ${STATUS_TONE[l.status]}`}>
                      <span className="font-semibold">{t(`logs.stepStatus.${l.status}`)}</span>
                      {result.logs.length > 1 ? ` (${t('logs.attempt', { n: l.attempt })})` : ''}: {msg(l.msg)}
                    </p>
                  ))
                )}
                {!result.blockedBy && (
                  <>
                    {!trigger && (
                      <div>
                        <p className="mb-1 text-[11px] font-medium text-secondary-300">{t('inspector.test.input')}</p>
                        <JsonBlock value={result.input} />
                      </div>
                    )}
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-secondary-300">{t('inspector.test.output')}</p>
                      <JsonBlock value={result.output} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldInput({ field, step, onChange, onOpenCode }: { field: FieldDef; step: Step; onChange: (key: string, v: ConfigValue) => void; onOpenCode: () => void }) {
  const t = useTranslations('demoAutomation');
  const raw = step.config[field.key];
  const value = raw === undefined ? '' : String(raw);
  const id = `f-${step.id}-${field.key}`;
  const label = (
    <label htmlFor={id} className="mb-1 block text-[11px] text-secondary-400">
      {t(`fields.${field.key}`)}
    </label>
  );

  if (field.kind === 'select' || field.kind === 'column') {
    let options: { value: string; label: string }[] = [];
    if (field.kind === 'column') {
      const sheet = String(step.config.sheet) as SheetKey;
      options = (SHEET_COLUMNS[sheet] ?? []).map((c) => ({ value: c, label: `${c} · ${t(`sheets.${sheet}.cols.${c}`)}` }));
    } else if (field.key === 'sheet') {
      options = (field.options ?? []).map((o) => ({ value: o, label: t(`sheets.${o}.name`) }));
    } else if (field.key === 'time' || field.key === 'method') {
      options = (field.options ?? []).map((o) => ({ value: o, label: o }));
    } else {
      options = (field.options ?? []).map((o) => ({ value: o, label: t(`options.${field.key}.${o}`) }));
    }
    return (
      <div>
        {label}
        <select
          id={id}
          value={value}
          onChange={(e) => {
            onChange(field.key, e.target.value);
            if (field.key === 'sheet') {
              const cols = SHEET_COLUMNS[e.target.value as SheetKey] ?? [];
              if (!cols.includes(String(step.config.column))) onChange('column', cols[0] ?? '');
            }
          }}
          className={inputCls}
        >
          {!options.some((o) => o.value === value) && <option value={value}>{value || '—'}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.kind === 'number') {
    return (
      <div>
        {label}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value === '' || Number.isNaN(n)) return;
            onChange(field.key, Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, n)));
          }}
          className={inputCls}
        />
      </div>
    );
  }
  if (field.kind === 'textarea' || field.kind === 'code') {
    return (
      <div>
        {label}
        <textarea
          id={id}
          value={value}
          rows={field.rows ?? 4}
          spellCheck={false}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={`${inputCls} resize-y font-mono text-[11px] leading-relaxed ${field.kind === 'code' ? 'text-emerald-200' : ''}`}
        />
        {field.kind === 'code' && (
          <button type="button" onClick={onOpenCode} className={`${btnGhost} mt-1.5`}>
            <CodeBracketIcon className="h-3.5 w-3.5" />
            {t('inspector.openEditor')}
          </button>
        )}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input id={id} value={value} spellCheck={false} onChange={(e) => onChange(field.key, e.target.value)} className={`${inputCls} ${field.kind === 'template' ? 'font-mono' : ''}`} />
    </div>
  );
}
