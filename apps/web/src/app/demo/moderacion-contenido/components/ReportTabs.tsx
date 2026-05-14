'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentArrowDownIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { BarChart, Field, MetricCard, SlaBadge, codeSamples } from './Atoms';
import {
  APPEALS,
  AUDIT,
  CATEGORY_COLORS,
  CLASSIFIER_STATS,
  METRICS_BY_CATEGORY,
  TRANSPARENCY_BY_CATEGORY,
  TRANSPARENCY_BY_MONTH,
  type ContentType,
} from './mockData';

/* ---------- Classifiers ---------- */
export function ClassifiersTab() {
  const t = useTranslations('demoModeration');
  const [modality, setModality] = useState<ContentType>('text');
  const active = CLASSIFIER_STATS.find((c) => c.modality === modality)!;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
          {t('classifiers.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          {t('classifiers.subtitle')}
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['text', 'image', 'video', 'audio'] as ContentType[]).map((m) => (
          <button
            key={m}
            onClick={() => setModality(m)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              modality === m
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 border-secondary-200 dark:border-secondary-700'
            }`}
          >
            {t(`classifiers.${m}`)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md" className="md:col-span-1 space-y-2 text-sm">
          <Field label={t('classifiers.model')} value={active.model} />
          <Field label={t('classifiers.version')} value={active.version} />
          <Field label={t('classifiers.languages')} value={`${active.languages}`} />
          <Field label={t('classifiers.throughput')} value={active.throughput} />
          <Field label={t('classifiers.latencyP95')} value={active.latencyP95} />
          <Field label={t('classifiers.precision')} value={`${active.precision}%`} />
          <Field label={t('classifiers.recall')} value={`${active.recall}%`} />
          <Field label={t('classifiers.categoriesCovered')} value={`${active.categoriesCovered}`} />
          <Field label={t('classifiers.lastTrained')} value={active.lastTrained} />
        </Card>

        <Card variant="bordered" padding="md" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('classifiers.perCategory')}</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {active.perCategory.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.key]}`}>
                    {t(`queue.classifications.${c.key}`)}
                  </span>
                  <span className="text-xs font-mono text-secondary-600 dark:text-secondary-400">
                    P {c.precision}% · R {c.recall}%
                  </span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                  <div className="bg-emerald-500" style={{ width: `${c.precision}%` }} />
                  <div className="bg-blue-500" style={{ width: `${100 - c.precision}%`, opacity: 0.25 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- Appeals ---------- */
export function AppealsTab() {
  const t = useTranslations('demoModeration');
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('appeals.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('appeals.subtitle')}</p>
      </div>

      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 dark:bg-secondary-800/60 text-secondary-600 dark:text-secondary-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">{t('appeals.case')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('appeals.originalDecision')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('queue.classification')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('appeals.appealReason')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('appeals.slaRemaining')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('appeals.reviewer')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('appeals.resolutionPath')}</th>
              </tr>
            </thead>
            <tbody>
              {APPEALS.map((a) => (
                <tr key={a.id} className="border-t border-secondary-100 dark:border-secondary-800">
                  <td className="px-3 py-3 font-mono text-xs text-secondary-700 dark:text-secondary-300">{a.id}</td>
                  <td className="px-3 py-3 text-secondary-700 dark:text-secondary-200 capitalize">
                    {a.originalDecision}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>
                      {t(`queue.classifications.${a.category}`)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-secondary-700 dark:text-secondary-200 max-w-sm">
                    <p className="line-clamp-2">{a.reason}</p>
                  </td>
                  <td className="px-3 py-3">
                    <SlaBadge hours={a.slaHoursRemaining} overdueLabel={t('appeals.statuses.overdue')} />
                  </td>
                  <td className="px-3 py-3 text-secondary-700 dark:text-secondary-200">{a.reviewer}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="primary" size="sm">
                        {t('appeals.upholdDecision')}
                      </Button>
                      <Button variant="outline" size="sm">
                        {t('appeals.reverseDecision')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

/* ---------- Audit ---------- */
export function AuditTab() {
  const t = useTranslations('demoModeration');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState<string>('all');

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('audit.title')}</h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('audit.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            placeholder={t('audit.filterByActor')}
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="text-sm"
          />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-sm px-3 py-2"
          >
            <option value="all">{t('audit.filterByAction')}</option>
            {(
              ['approve', 'reject', 'escalate', 'editTag', 'appealUphold', 'appealReverse', 'ruleEdit'] as const
            ).map((a) => (
              <option key={a} value={a}>
                {t(`audit.actions.${a}`)}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            {t('audit.export')}
          </Button>
        </div>
      </div>

      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 dark:bg-secondary-800/60 text-secondary-600 dark:text-secondary-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">{t('audit.when')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('audit.who')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('audit.what')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('audit.target')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('audit.reason')}</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT.filter((e) => (actor ? e.who.toLowerCase().includes(actor.toLowerCase()) : true))
                .filter((e) => (action === 'all' ? true : e.action === action))
                .map((e) => (
                  <tr key={e.id} className="border-t border-secondary-100 dark:border-secondary-800">
                    <td className="px-3 py-2 text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                      {new Date(e.when).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-secondary-800 dark:text-secondary-200">{e.who}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" size="sm">
                        {t(`audit.actions.${e.action}`)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{e.target}</td>
                    <td className="px-3 py-2 text-secondary-700 dark:text-secondary-300">{e.reason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

/* ---------- Transparency ---------- */
export function TransparencyTab() {
  const t = useTranslations('demoModeration');
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
          {t('transparency.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          {t('transparency.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <MetricCard label={t('transparency.totalTakedowns')} value="81,780" />
        <MetricCard label={t('transparency.reinstated')} value="3.2%" />
        <MetricCard label={t('dashboard.fpr')} value="1.3%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card variant="bordered" padding="md">
          <CardHeader>
            <CardTitle className="text-lg">{t('transparency.byMonth')}</CardTitle>
          </CardHeader>
          <BarChart data={TRANSPARENCY_BY_MONTH.map((m) => ({ label: m.month, value: m.takedowns }))} />
        </Card>
        <Card variant="bordered" padding="md">
          <CardHeader>
            <CardTitle className="text-lg">{t('transparency.byCategory')}</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {TRANSPARENCY_BY_CATEGORY.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.key]}`}>
                  {t(`queue.classifications.${c.key}`)}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: `${c.value * 2.8}%` }} />
                </div>
                <span className="text-xs text-secondary-600 dark:text-secondary-400 w-8 text-right">
                  {c.value}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Button variant="outline" size="sm">
          <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
          {t('transparency.downloadFull')}
        </Button>
      </div>
    </section>
  );
}

/* ---------- Metrics ---------- */
export function MetricsTab() {
  const t = useTranslations('demoModeration');
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('metrics.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('metrics.subtitle')}</p>
      </div>

      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 dark:bg-secondary-800/60 text-secondary-600 dark:text-secondary-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">{t('metrics.category')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('metrics.precision')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('metrics.recall')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('metrics.fpr')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('metrics.ttm')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('metrics.volume')}</th>
              </tr>
            </thead>
            <tbody>
              {METRICS_BY_CATEGORY.map((m) => (
                <tr key={m.key} className="border-t border-secondary-100 dark:border-secondary-800">
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[m.key]}`}>
                      {t(`queue.classifications.${m.key}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{m.precision}%</td>
                  <td className="px-3 py-2 font-mono">{m.recall}%</td>
                  <td className="px-3 py-2 font-mono">{m.fpr}%</td>
                  <td className="px-3 py-2 font-mono">{m.ttm}</td>
                  <td className="px-3 py-2 font-mono text-right">{m.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

/* ---------- API ---------- */
export function ApiTab() {
  const t = useTranslations('demoModeration');
  const [apiMode, setApiMode] = useState<'realtime' | 'batch'>('realtime');
  const [codeLang, setCodeLang] = useState<'curl' | 'ts' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const snippet = codeSamples(apiMode, codeLang);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('api.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('api.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-3">
        {(['realtime', 'batch'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setApiMode(m)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              apiMode === m
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 border-secondary-200 dark:border-secondary-700'
            }`}
          >
            {t(`api.${m}`)}
          </button>
        ))}
      </div>

      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex flex-wrap gap-3 text-xs text-secondary-600 dark:text-secondary-400">
            <span>
              <strong>{t('api.endpoint')}:</strong>{' '}
              <code className="font-mono">POST /v1/moderate{apiMode === 'batch' ? '/batch' : ''}</code>
            </span>
            <span>
              <strong>{t('api.auth')}:</strong> Bearer · API key
            </span>
            <span>
              <strong>{t('api.rateLimit')}:</strong> {apiMode === 'batch' ? '5 jobs/min' : '2k req/s'}
            </span>
          </div>
          <div className="flex gap-1">
            {(['curl', 'ts', 'python'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setCodeLang(l)}
                className={`px-2.5 py-1 text-xs rounded-md ${
                  codeLang === l
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200'
                }`}
              >
                {t(`api.${l}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="bg-secondary-950 text-secondary-100 text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <button
            onClick={() => copy(snippet)}
            className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary-800 text-secondary-100 hover:bg-secondary-700"
          >
            <ClipboardIcon className="h-3.5 w-3.5" />
            {copied ? t('api.copied') : t('api.copy')}
          </button>
        </div>
      </Card>
    </section>
  );
}
