'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ClipboardDocumentIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import * as ai from '../lib/ai';
import { entryJson, entryUrl } from '../lib/api';
import { pathOf } from '../lib/models';
import { canEdit } from '../lib/permissions';
import { DESCRIPTION_RANGE, seoChecks, seoDescription, seoTitle, TITLE_RANGE } from '../lib/seo';
import { COMPANY } from '../lib/seed';
import { useCms } from '../lib/store';
import { isL10n, stripHtml, textToHtml, wordCount } from '../lib/text';
import { formatDateTime } from '../lib/time';
import type { Entry, EntryContent, L10n } from '../lib/types';
import { useFieldLabel } from './Fields';
import { btn, inputCls, labelCls, Note, selectCls } from './ui';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ SEO */

export function SeoPanel({ entry, readOnly, onSeo }: { entry: Entry; readOnly: boolean; onSeo: (key: 'title' | 'description', v: L10n) => void }) {
  const t = useTranslations('demoCms.seo');
  const { state, contentLocale: locale } = useCms();
  const c = entry.content;
  const checks = seoChecks(state, entry, c, locale);
  const passed = checks.filter((x) => x.ok).length;
  const title = seoTitle(entry, c, locale);
  const desc = seoDescription(c, locale);
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cms-seo-title" className={labelCls}>
          {t('metaTitle')} ({locale.toUpperCase()})
        </label>
        <input id="cms-seo-title" value={c.seo.title[locale]} placeholder={title} readOnly={readOnly} onChange={(e) => onSeo('title', { ...c.seo.title, [locale]: e.target.value })} className={inputCls} />
        <p className="text-[11px] text-slate-500 mt-0.5">{t('titleCount', { n: title.length, min: TITLE_RANGE[0], max: TITLE_RANGE[1] })}</p>
      </div>
      <div>
        <label htmlFor="cms-seo-desc" className={labelCls}>
          {t('metaDescription')} ({locale.toUpperCase()})
        </label>
        <textarea id="cms-seo-desc" rows={3} value={c.seo.description[locale]} readOnly={readOnly} onChange={(e) => onSeo('description', { ...c.seo.description, [locale]: e.target.value })} className={inputCls} />
        <p className="text-[11px] text-slate-500 mt-0.5">{t('descCount', { n: desc.length, min: DESCRIPTION_RANGE[0], max: DESCRIPTION_RANGE[1] })}</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('serp')}</p>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
          {COMPANY.domain}
          {locale === 'en' ? '/en' : ''}
          {pathOf(entry.type, c.slug).replace(/#.*/, '')}
        </p>
        <p className="text-base text-blue-700 dark:text-blue-400 font-medium leading-snug break-words">{title.length > 60 ? `${title.slice(0, 58)}…` : title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{desc ? (desc.length > 160 ? `${desc.slice(0, 157)}…` : desc) : <span className="italic text-slate-400">{t('noDescription')}</span>}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t('checksTitle', { passed, total: checks.length })}</p>
        <ul className="space-y-1.5">
          {checks.map((ch) => (
            <li key={ch.id} className="flex items-start gap-2 text-sm">
              {ch.ok ? <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" /> : <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />}
              <span className="text-slate-700 dark:text-slate-300">
                {t(`checks.${ch.id}.${ch.ok ? 'ok' : 'ko'}`, { value: ch.value, min: ch.id === 'titleLength' ? TITLE_RANGE[0] : DESCRIPTION_RANGE[0], max: ch.id === 'titleLength' ? TITLE_RANGE[1] : DESCRIPTION_RANGE[1] })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Note>{t('note')}</Note>
    </div>
  );
}

/* ------------------------------------------------------------------ API */

export function EntryApiPanel({ entry }: { entry: Entry }) {
  const t = useTranslations('demoCms.api');
  const { state, contentLocale: locale, toast } = useCms();
  const [preview, setPreview] = useState(false);
  const json = entryJson(state, entry, locale, preview);
  const slug = (preview ? entry.content : (entry.live ?? entry.content)).slug;
  const url = entryUrl(entry, slug, locale, preview);
  const body = json ? JSON.stringify(json, null, 2) : JSON.stringify({ error: 'not_found' }, null, 2);
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('version')}>
        {([false, true] as const).map((p) => (
          <button key={String(p)} type="button" aria-pressed={preview === p} onClick={() => setPreview(p)} className={`px-3 py-1.5 text-xs font-semibold ${preview === p ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
            {p ? t('previewVersion') : t('publishedVersion')}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-slate-900 text-slate-100 text-xs font-mono p-3 break-all">
        <span className="text-emerald-400 font-semibold">GET</span> {url}
        {preview && <span className="block text-slate-400 mt-1">Authorization: Bearer &lt;{t('previewToken')}&gt;</span>}
        <span className={`block mt-1 ${json ? 'text-emerald-400' : 'text-amber-400'}`}>{json ? '200 OK' : '404 Not Found'}</span>
      </div>
      {!json && <Note tone="warn">{t('notPublished')}</Note>}
      <div className="relative">
        <pre className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 overflow-auto max-h-[28rem]">{body}</pre>
        <button
          type="button"
          className={`${btn.small} absolute top-2 right-2`}
          onClick={async () => toast((await copyText(body)) ? t('copied') : t('copyFailed'), 'info')}
        >
          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
          {t('copy')}
        </button>
      </div>
      <Note>{t('simulated')}</Note>
    </div>
  );
}

/* ------------------------------------------------------------------ Historial */

export function HistoryPanel({ entry }: { entry: Entry }) {
  const t = useTranslations('demoCms.history');
  const tAct = useTranslations('demoCms.activity');
  const { state, me, act, toast, contentLocale: locale } = useCms();
  const person = (id: string) => state.people.find((p) => p.id === id)?.name ?? id;
  const editable = canEdit(me.role, entry);
  const versions = [...entry.versions].reverse();
  const activity = state.activity.filter((a) => a.entryId === entry.id);
  const changed = (c: EntryContent) => {
    const keys = Object.keys({ ...c.fields, ...entry.content.fields }).filter((k) => JSON.stringify(c.fields[k]) !== JSON.stringify(entry.content.fields[k]));
    if (JSON.stringify(c.blocks) !== JSON.stringify(entry.content.blocks)) keys.push('body');
    if (JSON.stringify(c.seo) !== JSON.stringify(entry.content.seo)) keys.push('seo');
    if (c.slug !== entry.content.slug) keys.push('slug');
    return keys.length;
  };
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {versions.map((v, i) => {
          const diff = changed(v.content);
          return (
            <li key={v.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t(`reasons.${v.reason}`)} {i === 0 && <span className="text-[11px] font-normal text-slate-500">· {t('latest')}</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {person(v.by)} · {formatDateTime(v.at, locale)} · {diff === 0 ? t('sameAsCurrent') : t('differs', { n: diff })}
                </p>
              </div>
              <button
                type="button"
                className={btn.small}
                disabled={!editable || diff === 0}
                onClick={() => {
                  act({ type: 'entry.restore', id: entry.id, versionId: v.id });
                  toast(t('restored'));
                }}
              >
                {t('restore')}
              </button>
            </li>
          );
        })}
      </ol>
      {activity.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{t('activity')}</p>
          <ul className="space-y-1">
            {activity.map((a) => (
              <li key={a.id} className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{person(a.by)}</span> {tAct(a.kind, { title: a.entryTitle ?? '', detail: a.detail ?? '' })} · {formatDateTime(a.at, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Note>{t('note')}</Note>
    </div>
  );
}

/* ------------------------------------------------------------------ Asistente de redacción (IA real) */

type Target = { key: string; label: string; text: string; apply: (s: string) => void };

export function AiPanel({ entry, readOnly, onField, onBlockHtml }: { entry: Entry; readOnly: boolean; onField: (fieldId: string, v: L10n) => void; onBlockHtml: (blockId: string, v: L10n) => void }) {
  const t = useTranslations('demoCms.ai');
  const tBlocks = useTranslations('demoCms.blocks');
  const label = useFieldLabel();
  const { state, act, toast, contentLocale: locale } = useCms();
  const type = state.types.find((x) => x.id === entry.type);
  const c = entry.content;
  const targets: Target[] = [];
  for (const def of type?.fields ?? []) {
    const v = c.fields[def.id];
    if ((def.kind === 'text' || def.kind === 'longText') && def.localized && isL10n(v)) {
      targets.push({ key: `f:${def.id}`, label: label(entry.type, def), text: v[locale], apply: (s) => onField(def.id, { ...v, [locale]: s }) });
    }
  }
  c.blocks.forEach((b, i) => {
    if (b.kind === 'paragraph') targets.push({ key: `b:${b.id}`, label: `${tBlocks('kinds.paragraph')} ${i + 1}`, text: stripHtml(b.html[locale]), apply: (s) => onBlockHtml(b.id, { ...b.html, [locale]: textToHtml(s) }) });
  });
  const defaultKey = targets.find((x) => x.key === 'f:description' || x.key === 'f:summary' || x.key === 'f:answer' || x.key === 'f:excerpt')?.key ?? targets[0]?.key ?? '';
  const [key, setKey] = useState(defaultKey);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [options, setOptions] = useState<ai.AiVersion[] | null>(null);
  const [error, setError] = useState<ai.AiErrorCode | null>(null);
  const [uses, setUses] = useState(0);
  const target = targets.find((x) => x.key === key) ?? targets[0];
  const source = target?.text.trim() ?? '';
  const words = wordCount(source);

  const run = async (id: string, fn: () => Promise<string | ai.AiVersion[]>) => {
    if (!source) return;
    setBusy(id);
    setError(null);
    setResult(null);
    setOptions(null);
    try {
      const r = await fn();
      if (typeof r === 'string') setResult(r);
      else setOptions(r);
      setUses((n) => n + 1);
      act({ type: 'tour.mark', step: 'assistant' });
    } catch (e) {
      setError(e instanceof ai.AiError ? e.code : 'server');
    } finally {
      setBusy(null);
    }
  };

  const apply = (s: string) => {
    if (!target) return;
    target.apply(s);
    setResult(null);
    setOptions(null);
    toast(t('applied', { field: target.label }));
  };

  if (targets.length === 0) return <p className="text-sm text-slate-500">{t('noTargets')}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 px-3 py-2 text-xs text-purple-900 dark:text-purple-100">
        <SparklesIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t('realNote')}</span>
      </div>
      <div>
        <label htmlFor="cms-ai-target" className={labelCls}>
          {t('target')} ({locale.toUpperCase()})
        </label>
        <select
          id="cms-ai-target"
          value={target?.key}
          onChange={(e) => {
            setKey(e.target.value);
            setResult(null);
            setOptions(null);
            setError(null);
          }}
          className={selectCls}
        >
          {targets.map((x) => (
            <option key={x.key} value={x.key}>
              {x.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
        {source || <span className="italic text-slate-400">{t('emptySource')}</span>}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('words', { n: words })}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.outline} disabled={!source || !!busy || readOnly} onClick={() => run('improve', () => ai.improve(source))}>
          <SparklesIcon className="w-4 h-4" />
          {busy === 'improve' ? t('working') : t('improve')}
        </button>
        <button type="button" className={btn.outline} disabled={!source || !!busy || readOnly || words < 12} onClick={() => run('short', () => ai.adjustLength(source, Math.max(10, Math.min(30, Math.round(words / 2)))))} title={words < 12 ? t('tooShort') : undefined}>
          {busy === 'short' ? t('working') : t('shorter')}
        </button>
        {ai.AI_TONES.map((tone) => (
          <button key={tone} type="button" className={btn.outline} disabled={!source || !!busy || readOnly} onClick={() => run(`tone-${tone}`, () => ai.changeTone(source, tone))}>
            {busy === `tone-${tone}` ? t('working') : t(`tones.${tone === 'técnico' ? 'tecnico' : tone}`)}
          </button>
        ))}
        <button type="button" className={btn.outline} disabled={!source || !!busy || readOnly} onClick={() => run('versions', () => ai.versions(source))}>
          {busy === 'versions' ? t('working') : t('versions')}
        </button>
      </div>
      {readOnly && <Note tone="warn">{t('readOnly')}</Note>}
      {error && <Note tone="warn">{t(`errors.${error}`)}</Note>}
      {result !== null && (
        <div className="rounded-lg border border-pink-200 dark:border-pink-900 p-3 space-y-2">
          <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">{t('result')}</p>
          <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{result}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={() => apply(result)} disabled={readOnly}>
              {t('apply')}
            </button>
            <button type="button" className={btn.outline} onClick={async () => toast((await copyText(result)) ? t('copied') : t('copyFailed'), 'info')}>
              {t('copy')}
            </button>
            <button type="button" className={btn.outline} onClick={() => setResult(null)}>
              {t('discard')}
            </button>
          </div>
        </div>
      )}
      {options && (
        <ul className="space-y-2">
          {options.map((o, i) => (
            <li key={i} className="rounded-lg border border-pink-200 dark:border-pink-900 p-3 space-y-2">
              <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">{t('option', { n: i + 1, tone: t(`tones.${o.tone === 'técnico' ? 'tecnico' : o.tone}`) })}</p>
              <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{o.content}</p>
              <button type="button" className={btn.small} onClick={() => apply(o.content)} disabled={readOnly}>
                {t('applyThis')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('uses', { n: uses })}</p>
    </div>
  );
}
