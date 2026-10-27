'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { classify, highlightSpans, MAX_TEXT, SIGNALS, topCategories, type Classification } from '../lib/classifier';
import { SEVERITY } from '../lib/data';
import { fmtPct } from '../lib/format';
import { isAutomatic, routeFor } from '../lib/logic';
import { POLICIES, QUICK_EXAMPLES } from '../lib/samples';
import { useModeration } from '../lib/store';
import { CATEGORIES, type ContentType } from '../lib/types';
import AiExplain from './AiExplain';
import { CategoryChip, ConfidenceBar, Highlighted, PriorityChip, SectionTitle, SimNote, chipBtn, focusRing, inputCls } from './ui';
import { useText } from './useText';

function Result({ text, c, onSent }: { text: string; c: Classification; onSent: () => void }) {
  const t = useTranslations('demoModeration');
  const { lang, s, addCase, toast, go } = useModeration();
  const { ruleText } = useText();
  const route = routeFor(s.rules, c.label, c.score);
  const rule = route.ruleNo ? s.rules[route.ruleNo - 1] : null;
  const spans = highlightSpans(c, c.label);
  const signals = c.label === 'none' ? [] : c.hits.filter((h) => c.signalsBy[c.label as (typeof CATEGORIES)[number]].includes(h.id));
  const others = topCategories(c, 4).filter((x) => x.cat !== c.label);
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{t('classifier.result')}</span>
        <CategoryChip label={c.label} />
        <ConfidenceBar score={c.score} />
      </div>
      {others.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-400">
          {t('classifier.others')}
          {others.map((o) => (
            <span key={o.cat} className="inline-flex items-center gap-1">
              <CategoryChip label={o.cat} /> <span className="font-mono">{fmtPct(o.score, lang)}</span>
            </span>
          ))}
        </p>
      )}
      <p className="rounded-md bg-secondary-50 p-2 text-sm text-secondary-800 dark:bg-secondary-800/60 dark:text-secondary-100">
        <Highlighted text={text} spans={spans} />
      </p>
      {signals.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-secondary-700 dark:text-secondary-300">
          {signals.map((h) => (
            <li key={h.id}>
              {t(`signals.${h.id}`)}: <span className="italic">«{h.fragments[0]}»</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('classifier.noSignals')}</p>
      )}
      <div className="text-sm">
        <p className="font-medium text-secondary-800 dark:text-secondary-100">{t('classifier.rulesWould')}</p>
        <p className="mt-0.5 text-secondary-700 dark:text-secondary-300">
          {rule ? t('classifier.ruleMatch', { n: route.ruleNo ?? 0, rule: ruleText(rule) }) : t('classifier.noRule')}
        </p>
        {c.label !== 'none' && (
          <>
            <p className="mt-2 font-medium text-secondary-800 dark:text-secondary-100">{t('queue.policy')}</p>
            <p className="mt-0.5 text-secondary-700 dark:text-secondary-300">{POLICIES[c.label][lang]}</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            const v = addCase(text);
            onSent();
            if (v.status === 'auto') toast(t('classifier.sentAuto', { id: v.id, n: v.route.ruleNo ?? 0, action: t(`actions.${v.route.action}`) }), 'info');
            else toast(t('classifier.sentQueue', { id: v.id }));
          }}
        >
          <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
          {isAutomatic(route.action) ? t('classifier.sendAuto') : t('classifier.send')}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1" onClick={() => go('queue')}>
          {t('classifier.goQueue')}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <AiExplain text={text} />
    </div>
  );
}

export default function ClassifierTab() {
  const t = useTranslations('demoModeration');
  const { lang } = useModeration();
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ text: string; c: Classification } | null>(null);
  const [modality, setModality] = useState<ContentType>('text');

  const run = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setResult({ text: v, c: classify(v) });
  };

  return (
    <section>
      <SectionTitle title={t('classifier.title')} subtitle={t('classifier.subtitle')} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 lg:col-span-3">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('classifier.tryTitle')}</h3>
          <p className="mb-3 text-sm text-secondary-600 dark:text-secondary-400">{t('classifier.tryHint')}</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {QUICK_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setText(ex[lang]);
                  run(ex[lang]);
                }}
                className={`${chipBtn} border-secondary-200 bg-white text-secondary-700 hover:border-primary-400 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300`}
              >
                {t(`classifier.example${i + 1}`)}
              </button>
            ))}
          </div>
          <label htmlFor="mod-try" className="sr-only">
            {t('classifier.tryTitle')}
          </label>
          <textarea
            id="mod-try"
            value={text}
            maxLength={MAX_TEXT}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(text);
            }}
            rows={4}
            className={inputCls}
            placeholder={t('classifier.placeholder')}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('classifier.counter', { n: text.length, max: MAX_TEXT })}</span>
            <Button size="sm" onClick={() => run(text)} disabled={!text.trim()}>
              {t('classifier.classify')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('classifier.privacy')}</p>
          {result && <Result text={result.text} c={result.c} onSent={() => setResult(null)} />}
        </div>

        <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 lg:col-span-2">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('classifier.howTitle')}</h3>
          <p className="mb-3 text-sm text-secondary-600 dark:text-secondary-400">{t('classifier.howText', { n: SIGNALS.length })}</p>
          <ul className="space-y-1.5">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <details className="group rounded-lg border border-secondary-100 px-2 py-1.5 dark:border-secondary-800">
                  <summary className={`flex cursor-pointer list-none flex-wrap items-center gap-2 rounded text-sm ${focusRing}`}>
                    <CategoryChip label={c} />
                    <PriorityChip priority={SEVERITY[c]} />
                    <span className="ml-auto text-xs text-secondary-500 group-open:hidden">{t('common.show')}</span>
                    <span className="ml-auto hidden text-xs text-secondary-500 group-open:inline">{t('common.hide')}</span>
                  </summary>
                  <p className="mt-2 text-xs text-secondary-700 dark:text-secondary-300">
                    <span className="font-semibold">{t('classifier.signalsLabel')}</span> {t(`categories.${c}.signals`)}
                  </p>
                  <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">{POLICIES[c][lang]}</p>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t('classifier.severityNote')}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
        <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-white">{t('classifier.modalityTitle')}</h3>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={t('classifier.modalityTitle')}>
          {(['text', 'image', 'video', 'audio'] as ContentType[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modality === m}
              onClick={() => setModality(m)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${focusRing} ${
                modality === m
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-secondary-200 bg-white text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-200'
              }`}
            >
              {t(`types.${m}`)}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
            <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('classifier.inDemo')}</p>
            <p className="text-secondary-700 dark:text-secondary-300">{t(`classifier.modality.${modality}.demo`)}</p>
          </div>
          <div className="rounded-lg bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
            <p className="mb-1 font-semibold text-secondary-900 dark:text-white">{t('classifier.inProject')}</p>
            <p className="text-secondary-700 dark:text-secondary-300">{t(`classifier.modality.${modality}.project`)}</p>
          </div>
        </div>
        <SimNote className="mt-3">{t('classifier.noMetricsNote')}</SimNote>
      </div>
    </section>
  );
}
