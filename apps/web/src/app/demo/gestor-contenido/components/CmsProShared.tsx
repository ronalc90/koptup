'use client';

import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PhotoIcon,
  Bars3Icon,
  CodeBracketIcon,
  PlayCircleIcon,
  TableCellsIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import useModalClose from '@/hooks/useModalClose';

export const SITE_KEYS = ['corp', 'blog', 'docs', 'shop', 'support'] as const;
export type SiteKey = (typeof SITE_KEYS)[number];

export const WORKFLOW_STEPS = ['draft', 'review', 'approved', 'scheduled', 'published'] as const;
export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

export const WORKFLOW_COLORS: Record<WorkflowStep, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800',
  scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  published: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-800',
};

export const SITE_METRICS: Record<SiteKey, { pages: number; drafts: number; published: number; traffic: string }> = {
  corp: { pages: 248, drafts: 12, published: 236, traffic: '142k' },
  blog: { pages: 412, drafts: 28, published: 384, traffic: '89k' },
  docs: { pages: 1024, drafts: 6, published: 1018, traffic: '54k' },
  shop: { pages: 312, drafts: 18, published: 294, traffic: '210k' },
  support: { pages: 186, drafts: 4, published: 182, traffic: '37k' },
};

export function TabTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

interface CmsDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  widthClass?: string;
}

export function CmsDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'w-full sm:w-[28rem] md:w-[32rem]',
}: CmsDrawerProps) {
  const t = useTranslations('demoCmsPro.drawer');
  useModalClose(open, onClose);
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 h-full ${widthClass} max-w-full bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-slate-950 dark:to-slate-900">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h2>
            {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label={t('close')}
          >
            <XMarkIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}

export function AiPanel() {
  const t = useTranslations('demoCmsPro.ai');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const generate = () => {
    setOutput('');
    const text = t('outputBody');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOutput(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
  };
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('prompt')}</label>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('promptPlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
        />
        <button
          onClick={generate}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors"
        >
          <SparklesIcon className="w-4 h-4" /> {t('generate')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[t('brand'), t('seo'), t('tone')].map((b) => (
          <button
            key={b}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50"
          >
            {b}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 min-h-[120px]">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('outputTitle')}</div>
        <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
          {output || <span className="text-slate-400 italic">{t('promptPlaceholder')}</span>}
        </div>
      </div>
    </div>
  );
}

export function WorkflowPanel({
  current,
  onChange,
}: {
  current: WorkflowStep;
  onChange?: (s: WorkflowStep) => void;
}) {
  const t = useTranslations('demoCmsPro.workflow');
  const tSteps = useTranslations('demoCmsPro.workflow.steps');
  const currentIdx = WORKFLOW_STEPS.indexOf(current);
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      {onChange && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('changeState')}</label>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_STEPS.map((s) => (
              <button
                key={s}
                onClick={() => onChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  current === s
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-pressed={current === s}
              >
                {tSteps(s)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">
        {t('currentDoc')}: <span className="font-semibold text-slate-900 dark:text-white">Press release · Q2 launch</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6">
        {WORKFLOW_STEPS.map((s, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                  active
                    ? 'bg-pink-600 text-white border-pink-600'
                    : done
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {tSteps(s)}
              </div>
              {i < WORKFLOW_STEPS.length - 1 && <span className="text-slate-400">→</span>}
            </div>
          );
        })}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('approvals')}</div>
        <div className="space-y-2">
          {[
            { name: t('approver1'), done: true },
            { name: t('approver2'), done: true },
            { name: t('approver3'), done: false },
          ].map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-sm text-slate-800 dark:text-slate-200">{a.name}</div>
              {a.done ? (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                  <CheckCircleIcon className="w-4 h-4" /> {tSteps('approved')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <ClockIcon className="w-4 h-4" /> {tSteps('review')}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t('scheduledFor')}: 2026-05-20 09:00 UTC</div>
      </div>
    </div>
  );
}

export function MultisitePanel({ site }: { site: SiteKey }) {
  const tMs = useTranslations('demoCmsPro.multisite');
  const m = SITE_METRICS[site];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { k: tMs('metrics.pages'), v: m.pages },
        { k: tMs('metrics.drafts'), v: m.drafts },
        { k: tMs('metrics.published'), v: m.published },
        { k: tMs('metrics.traffic'), v: m.traffic },
      ].map((x) => (
        <div key={x.k} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">{x.k}</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{x.v}</div>
        </div>
      ))}
    </div>
  );
}

type I18nStatus = 'pending' | 'review' | 'approved';
const I18N_ROWS: { doc: string; lang: string; status: I18nStatus }[] = [
  { doc: 'press-release-q2.md', lang: 'EN', status: 'approved' },
  { doc: 'press-release-q2.md', lang: 'PT', status: 'review' },
  { doc: 'press-release-q2.md', lang: 'FR', status: 'pending' },
  { doc: 'product-launch.md', lang: 'EN', status: 'approved' },
  { doc: 'product-launch.md', lang: 'DE', status: 'review' },
  { doc: 'blog-ai-content.md', lang: 'EN', status: 'pending' },
];
const I18N_STATUS_COLORS: Record<I18nStatus, string> = {
  pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800',
};

export function I18nPanel() {
  const t = useTranslations('demoCmsPro.i18n');
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-300 dark:border-purple-800">
        <SparklesIcon className="w-4 h-4" /> {t('engine')}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.doc')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.lang')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.status')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.engine')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {I18N_ROWS.map((r, i) => (
              <tr key={i} className="bg-white dark:bg-slate-900">
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{r.doc}</td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{r.lang}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${I18N_STATUS_COLORS[r.status]}`}>
                    {t(`status.${r.status}`)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    DeepL/GPT
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SeoPanel() {
  const t = useTranslations('demoCmsPro.seo');
  const cards = [
    { k: t('cards.schema'), d: t('cards.schemaDesc') },
    { k: t('cards.sitemap'), d: t('cards.sitemapDesc') },
    { k: t('cards.hreflang'), d: t('cards.hreflangDesc') },
    { k: t('cards.og'), d: t('cards.ogDesc') },
  ];
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.k} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{c.k}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{c.d}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('serp')}</div>
        <div className="text-blue-700 dark:text-blue-400 text-base font-medium leading-snug">{t('serpTitle')}</div>
        <div className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">{t('serpUrl')}</div>
        <div className="text-sm text-slate-700 dark:text-slate-300">{t('serpDesc')}</div>
      </div>
    </div>
  );
}

export function AbPanel() {
  const t = useTranslations('demoCmsPro.ab');
  const rows = [
    { exp: t('exps.hero'), variants: 'A/B/C', traffic: '34k', winner: 'B', sig: '97%' },
    { exp: t('exps.cta'), variants: 'A/B', traffic: '18k', winner: 'A', sig: '82%' },
    { exp: t('exps.checkout'), variants: 'A/B/C', traffic: '52k', winner: '—', sig: '54%' },
  ];
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.exp')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.variants')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.traffic')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.winner')}</th>
              <th className="text-left px-4 py-2 font-semibold">{t('headers.significance')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((r) => {
              const sigOk = parseInt(r.sig) >= 95;
              return (
                <tr key={r.exp} className="bg-white dark:bg-slate-900">
                  <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{r.exp}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{r.variants}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{r.traffic}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">{r.winner}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        sigOk
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {r.sig}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EDGE_SELECTORS = ['cookie', 'utm', 'geo'] as const;
const EDGE_SEGMENTS = ['anon', 'lead', 'customer', 'enterprise'] as const;
const EDGE_CONTENTS = ['hero', 'cta', 'pricing', 'case'] as const;
const EDGE_MATRIX: Record<string, Record<string, string>> = {
  anon: { hero: 'Default', cta: 'Sign up', pricing: 'Public', case: '—' },
  lead: { hero: 'Lead', cta: 'Book demo', pricing: 'Public', case: 'SMB' },
  customer: { hero: 'Welcome back', cta: 'Upgrade', pricing: 'Tier', case: 'Mid' },
  enterprise: { hero: 'Enterprise', cta: 'Talk sales', pricing: 'Custom', case: 'Fortune 500' },
};

export function EdgePanel() {
  const t = useTranslations('demoCmsPro.edge');
  const [selector, setSelector] = useState<(typeof EDGE_SELECTORS)[number]>('cookie');
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="flex flex-wrap gap-2 mb-4">
        {EDGE_SELECTORS.map((s) => (
          <button
            key={s}
            onClick={() => setSelector(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              selector === s
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            aria-pressed={selector === s}
          >
            {t(`selectors.${s}`)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Segment</th>
              {EDGE_CONTENTS.map((c) => (
                <th key={c} className="text-left px-4 py-2 font-semibold">{t(`contents.${c}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {EDGE_SEGMENTS.map((seg) => (
              <tr key={seg} className="bg-white dark:bg-slate-900">
                <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">{t(`segments.${seg}`)}</td>
                {EDGE_CONTENTS.map((c) => (
                  <td key={c} className="px-4 py-2 text-slate-700 dark:text-slate-300">{EDGE_MATRIX[seg][c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BlocksPanel() {
  const t = useTranslations('demoCmsPro.blocks');
  const blocks = [
    { type: 'heading', icon: Bars3Icon, text: t('heading') },
    { type: 'paragraph', icon: Bars3Icon, text: t('paragraph') },
    { type: 'image', icon: PhotoIcon, text: t('image') },
    { type: 'code', icon: CodeBracketIcon, text: t('code') },
    { type: 'embed', icon: PlayCircleIcon, text: t('embed') },
    { type: 'table', icon: TableCellsIcon, text: t('table') },
  ];
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="space-y-2">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.type}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-pink-400 dark:hover:border-pink-600 bg-white dark:bg-slate-900 transition-colors group"
            >
              <div className="cursor-grab text-slate-400 group-hover:text-pink-500 mt-1" aria-label="drag-handle">
                <Bars3Icon className="w-4 h-4" />
              </div>
              <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
                  {t(`types.${b.type}`)}
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200">{b.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="mt-4 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-pink-700 transition-colors">
        <PlusIcon className="w-4 h-4" /> {t('addBlock')}
      </button>
    </div>
  );
}

const DAM_ASSETS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] as const;
const DAM_TAGS: Record<string, string[]> = {
  a1: ['team', 'office', 'people'],
  a2: ['product', 'hero', 'studio'],
  a3: ['office', 'workspace'],
  a4: ['event', 'stage', 'launch'],
  a5: ['logos', 'vector'],
  a6: ['portrait', 'ceo', 'face'],
};

export function DamPanel() {
  const t = useTranslations('demoCmsPro.dam');
  const [faceDetection, setFaceDetection] = useState(true);
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={faceDetection}
            onChange={(e) => setFaceDetection(e.target.checked)}
            className="rounded"
          />
          {t('faceDetection')}
        </label>
        <code className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {t('transform')}: /cdn/img/{`{id}`}?w=800&q=80&format=webp
        </code>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DAM_ASSETS.map((id) => (
          <div key={id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-blue-900/40 flex items-center justify-center relative">
              <PhotoIcon className="w-10 h-10 text-slate-500 dark:text-slate-400" />
              {faceDetection && id === 'a6' && (
                <div className="absolute top-3 left-3 w-12 h-12 border-2 border-pink-500 rounded" aria-label="face-box" />
              )}
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t(`assets.${id}`)}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{t('tags')}</div>
              <div className="flex flex-wrap gap-1">
                {DAM_TAGS[id].map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeadlessPanel() {
  const t = useTranslations('demoCmsPro.headless');
  const nodes = [
    { label: t('cms'), color: 'from-pink-500 to-pink-600' },
    { label: t('api'), color: 'from-purple-500 to-purple-600' },
    { label: t('edge'), color: 'from-blue-500 to-blue-600' },
  ];
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="flex flex-col md:flex-row items-stretch gap-3 mb-6">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex-1 flex items-center gap-3">
            <div className={`flex-1 px-4 py-5 rounded-xl text-white text-center font-semibold bg-gradient-to-br ${n.color} shadow`}>
              {n.label}
            </div>
            {i < nodes.length - 1 && <div className="text-slate-400 hidden md:block text-2xl font-bold">→</div>}
          </div>
        ))}
      </div>
      <div className="mb-6">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('frontends')}</div>
        <div className="flex flex-wrap gap-2">
          {[t('next'), t('astro'), t('mobile')].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { k: t('latencyP95'), v: '32 ms' },
          { k: t('uptime'), v: '99.99%' },
          { k: t('regions'), v: '18' },
        ].map((m) => (
          <div key={m.k} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">{m.k}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ISR_EVENTS = ['publish', 'cacheHit', 'purge', 'rebuild', 'ready'] as const;

export function IsrPanel() {
  const t = useTranslations('demoCmsPro.isr');
  const [revalidated, setRevalidated] = useState(false);
  return (
    <div>
      <TabTitle title={t('title')} desc={t('desc')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('ttl')}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">60 s</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('lastBuild')}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">2 min</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('timeline')}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">edge SFO</div>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('timeline')}</div>
        <div className="space-y-2">
          {ISR_EVENTS.map((e, i) => (
            <div
              key={e}
              className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <div className="text-xs text-slate-500 dark:text-slate-400 w-12">{`T+${i}s`}</div>
              <div className="text-sm text-slate-800 dark:text-slate-200">{t(`events.${e}`)}</div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setRevalidated(true)}
        className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-pink-700 transition-colors"
      >
        <ArrowPathIcon className="w-4 h-4" /> {t('revalidate')}
      </button>
      {revalidated && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-300 dark:border-green-800">
          <CheckCircleIcon className="w-4 h-4" /> {t('revalidated')}
        </div>
      )}
    </div>
  );
}
