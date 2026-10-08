'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ShieldCheckIcon, BugAntIcon, SparklesIcon, CheckCircleIcon, RocketLaunchIcon, LockClosedIcon,
  ArrowDownTrayIcon, ClipboardDocumentIcon, ArrowUturnLeftIcon, EyeIcon, BeakerIcon,
  ExclamationTriangleIcon, CodeBracketIcon, PlusIcon, MinusIcon, ArrowTopRightOnSquareIcon,
  CalculatorIcon, ChartBarIcon, IdentificationIcon,
} from '@heroicons/react/24/outline';
import {
  tr, PENALTY, SEVERITY_ORDER, formatStamp, formatNumber, displayLineOf,
  type Locale, type PR, type ReviewComment, type CommentStatus, type Severity, type Category,
  type DisplayLine, type DiffRow, type Risk, type PREvent, type PRStatus, type Dependency,
} from './analyzer';
import { Code } from './highlight';
import { BASE_BRANCH } from './data';

export type T = ReturnType<typeof useTranslations>;
export type TabKey = 'summary' | 'comments' | 'diff' | 'security' | 'tests' | 'repo' | 'metrics';

export interface FileView {
  path: string;
  oldL: DisplayLine[];
  newL: DisplayLine[];
  rows: DiffRow[];
  additions: number;
  deletions: number;
  isNew: boolean;
  isAddedTest: boolean;
}
export interface CommentView { c: ReviewComment; status: CommentStatus; line: number }
export interface PRView {
  pr: PR;
  status: PRStatus;
  comments: CommentView[];
  files: FileView[];
  openSeverities: Severity[];
  score: number;
  risk: Risk;
  additions: number;
  deletions: number;
  events: PREvent[];
  addedTests: string[];
  deps: (Dependency & { current: string; resolved: boolean })[];
}
export interface CommentActions {
  /** PR fusionado: los comentarios quedan en solo lectura. */
  locked: boolean;
  apply: (id: string) => void;
  dismiss: (id: string) => void;
  resolve: (id: string) => void;
  reopen: (id: string) => void;
  showInDiff: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Utilidades visuales
// ---------------------------------------------------------------------------

export const sevBadge = (s: Severity): 'danger' | 'warning' | 'info' | 'default' =>
  s === 'blocking' ? 'danger' : s === 'warning' ? 'warning' : s === 'suggestion' ? 'info' : 'default';
const sevRing = (s: Severity) =>
  s === 'blocking' ? 'border-red-500/40 bg-red-500/5'
    : s === 'warning' ? 'border-amber-500/40 bg-amber-500/5'
      : s === 'suggestion' ? 'border-sky-500/40 bg-sky-500/5'
        : 'border-zinc-700 bg-zinc-800/40';
const catIcon = (c: Category) =>
  c === 'security' ? ShieldCheckIcon : c === 'privacy' ? IdentificationIcon : c === 'bug' ? BugAntIcon
    : c === 'perf' ? RocketLaunchIcon : c === 'tests' ? BeakerIcon : SparklesIcon;
export const riskTone = (r: Risk) => (r === 'high' ? 'text-rose-400' : r === 'medium' ? 'text-amber-400' : 'text-emerald-400');
const isPending = (s: CommentStatus) => s === 'open';

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-zinc-800 rounded-md p-2 bg-zinc-900/40 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 leading-tight">{label}</div>
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function CodeBlock({ text, tone }: { text: string; tone: 'old' | 'new' | 'neutral' }) {
  const border = tone === 'old' ? 'border-rose-500/20' : tone === 'new' ? 'border-emerald-500/20' : 'border-zinc-800';
  return (
    <pre className={`text-xs font-mono bg-zinc-950 border ${border} rounded p-2 overflow-x-auto whitespace-pre`}>
      {text.split('\n').map((l, i) => (
        <div key={i}><Code text={l || ' '} /></div>
      ))}
    </pre>
  );
}

const YOU_EVENTS: PREvent['kind'][] = ['opened', 'applied', 'dismissed', 'resolved', 'reopened'];

export function EventText({ e, t }: { e: PREvent; t: T }) {
  const detail = e.detail ?? '';
  // Acciones de quien visita la demo sobre su propio diff (se conjugan con "tú").
  if (e.who === '__you__' && YOU_EVENTS.includes(e.kind)) return <>{t(`events.you.${e.kind}`, { detail })}</>;
  const who = e.who === 'revisor-ia' ? t('events.bot') : e.who === 'revisor-local' ? t('events.localBot') : e.who;
  return <>{t(`events.${e.kind}`, { who, detail })}</>;
}

// ---------------------------------------------------------------------------
// Tarjeta de comentario (lista y diff)
// ---------------------------------------------------------------------------

export function CommentCard({
  cv, file, t, locale, actions, compact = false, highlight = false,
}: {
  cv: CommentView; file?: FileView; t: T; locale: Locale; actions: CommentActions; compact?: boolean; highlight?: boolean;
}) {
  const { c, status, line } = cv;
  const Icon = catIcon(c.category);
  const current = useMemo(() => {
    if (!file) return '';
    const first = file.newL.findIndex((l) => l.anchor === c.line);
    if (first < 0) return '';
    const end = c.endLine ?? c.line;
    const out: string[] = [];
    for (let i = first; i < file.newL.length; i++) {
      const a = file.newL[i].anchor;
      if (i > first && a !== undefined && a > end) break;
      out.push(file.newL[i].text);
    }
    return out.join('\n');
  }, [file, c.line, c.endLine]);
  const done = !isPending(status);
  return (
    <div
      id={compact ? `diff-comment-${c.id}` : `comment-${c.id}`}
      className={`rounded-lg border ${sevRing(c.severity)} p-3 transition-shadow ${done ? 'opacity-80' : ''} ${highlight ? 'ring-2 ring-violet-400/70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-zinc-900/70 border border-zinc-800 shrink-0">
          <Icon className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={sevBadge(c.severity)} size="sm">{t(`severity.${c.severity}`)}</Badge>
            <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">{t(`category.${c.category}`)}</Badge>
            <Badge variant="outline" size="sm" className={c.origin === 'ai-sample' ? '!text-violet-300 !border-violet-500/40' : '!text-sky-300 !border-sky-500/40'}>
              {c.origin === 'ai-sample' ? t('comments.originAi') : t('comments.originLocal')}
            </Badge>
            {!compact && <span className="text-[11px] text-zinc-500 font-mono break-all">{c.file}:{line}</span>}
            {done && (
              <Badge variant={status === 'dismissed' ? 'default' : 'success'} size="sm">
                <CheckCircleIcon className="w-3 h-3 mr-1" />{t(`comments.statuses.${status}`)}
              </Badge>
            )}
          </div>
          <div className="text-sm text-zinc-100 mt-2">{tr(c.message, locale)}</div>
          {!compact && <div className="text-xs text-zinc-400 mt-1">{tr(c.explanation, locale)}</div>}
          {c.rule && <div className="text-[11px] text-zinc-500 mt-1">{t('comments.rule')}: {tr(c.rule, locale)}</div>}
          {!compact && c.fix !== undefined && status !== 'applied' && (
            <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('comments.current')}</div>
                <CodeBlock text={current} tone="old" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('comments.suggestion')}</div>
                <CodeBlock text={c.fix} tone="new" />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            {actions.locked && status === 'open' && (
              <span className="text-[11px] text-zinc-500 self-center">{t('comments.lockedNote')}</span>
            )}
            {!actions.locked && status === 'open' && c.fix !== undefined && (
              <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700" onClick={() => actions.apply(c.id)}>
                <SparklesIcon className="w-3.5 h-3.5 mr-1" />{t('comments.apply')}
              </Button>
            )}
            {!actions.locked && status === 'open' && c.fix === undefined && (
              <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => actions.resolve(c.id)}>
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />{t('comments.markResolved')}
              </Button>
            )}
            {!actions.locked && status === 'open' && (
              <Button size="sm" variant="ghost" onClick={() => actions.dismiss(c.id)} className="!text-zinc-400">{t('comments.dismiss')}</Button>
            )}
            {!actions.locked && done && status !== 'resolved' && (
              <Button size="sm" variant="ghost" onClick={() => actions.reopen(c.id)} className="!text-zinc-400">
                <ArrowUturnLeftIcon className="w-3.5 h-3.5 mr-1" />{t('comments.undo')}
              </Button>
            )}
            {!actions.locked && done && status === 'resolved' && c.category !== 'tests' && (
              <Button size="sm" variant="ghost" onClick={() => actions.reopen(c.id)} className="!text-zinc-400">
                <ArrowUturnLeftIcon className="w-3.5 h-3.5 mr-1" />{t('comments.undo')}
              </Button>
            )}
            {!compact && (
              <Button size="sm" variant="ghost" onClick={() => actions.showInDiff(c.id)} className="!text-zinc-300">
                <EyeIcon className="w-3.5 h-3.5 mr-1" />{t('comments.showInDiff')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

export function SummaryTab({
  view, t, locale, onGo, onOpenFile, onTryDiff,
}: {
  view: PRView; t: T; locale: Locale; onGo: (tab: TabKey) => void; onOpenFile: (path: string) => void; onTryDiff: () => void;
}) {
  const { pr } = view;
  const pending = view.comments.filter((x) => x.status === 'open');
  const counts = SEVERITY_ORDER.map((s) => ({ s, n: pending.filter((x) => x.c.severity === s).length }));
  const reasons = pending
    .filter((x) => x.c.severity === 'blocking' || x.c.severity === 'warning')
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.c.severity) - SEVERITY_ORDER.indexOf(b.c.severity))
    .slice(0, 3);
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t('summary.whatChanges')}</div>
        <p className="text-sm text-zinc-200 mt-1">
          {pr.userDiff
            ? t('summary.userDiff', { files: view.files.length, additions: view.additions, deletions: view.deletions })
            : tr(pr.summary, locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t('summary.risk')}</div>
          <div className={`text-xl font-bold mt-1 ${riskTone(view.risk)}`}>{t(`summary.riskLevels.${view.risk}`)}</div>
          {reasons.length === 0 ? (
            <p className="text-xs text-zinc-400 mt-1">{t('summary.noRiskReasons')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {reasons.map((x) => (
                <li key={x.c.id} className="text-xs text-zinc-300 flex items-start gap-1.5">
                  <ExclamationTriangleIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${x.c.severity === 'blocking' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span className="min-w-0">{tr(x.c.message, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t('summary.score')}</div>
          <div className="text-xl font-bold mt-1 text-zinc-100">{view.score}<span className="text-sm text-zinc-500">/100</span></div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {t('summary.scoreFormula', { blocking: PENALTY.blocking, warning: PENALTY.warning, suggestion: PENALTY.suggestion, info: PENALTY.info })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {counts.map(({ s, n }) => (
              <Badge key={s} variant={n > 0 ? sevBadge(s) : 'default'} size="sm" className={n === 0 ? '!bg-zinc-800 !text-zinc-400' : ''}>
                {t(`severity.${s}`)}: {n}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{t('summary.files')}</div>
        <ul className="space-y-1">
          {view.files.map((f) => (
            <li key={f.path}>
              <button
                type="button"
                onClick={() => onOpenFile(f.path)}
                className="w-full flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded border border-zinc-800 hover:bg-zinc-800/60 text-zinc-300"
              >
                <span className="truncate text-left font-mono">{f.path}</span>
                <span className="shrink-0 flex items-center gap-2">
                  {f.isAddedTest && <Badge variant="success" size="sm">{t('diff.testFile')}</Badge>}
                  <span className="text-emerald-400">+{f.additions}</span>
                  <span className="text-rose-400">-{f.deletions}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{t('summary.activity')}</div>
          <ol className="space-y-2 border-l border-zinc-800 pl-3">
            {view.events.map((e, i) => (
              <li key={i} className="text-xs">
                <div className="text-zinc-500">{formatStamp(e.at, locale)}</div>
                <div className="text-zinc-200"><EventText e={e} t={t} /></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
          <div className="text-sm font-semibold text-zinc-100">{t('summary.tryTitle')}</div>
          <ol className="mt-2 space-y-2 text-xs text-zinc-300">
            <li className="flex items-start justify-between gap-2">
              <span>1. {t('summary.try1')}</span>
              <Button size="sm" variant="ghost" className="!text-violet-300 shrink-0 !px-2 !py-1" onClick={() => onGo('comments')}>{t('summary.go')}</Button>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>2. {t('summary.try2')}</span>
              <Button size="sm" variant="ghost" className="!text-violet-300 shrink-0 !px-2 !py-1" onClick={() => onGo('diff')}>{t('summary.go')}</Button>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>3. {t('summary.try3')}</span>
              <Button size="sm" variant="ghost" className="!text-violet-300 shrink-0 !px-2 !py-1" onClick={() => onGo('repo')}>{t('summary.go')}</Button>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>4. {t('summary.try4')}</span>
              <Button size="sm" variant="ghost" className="!text-violet-300 shrink-0 !px-2 !py-1" onClick={onTryDiff}>{t('summary.go')}</Button>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------

type CommentFilter = 'pending' | 'blocking' | 'done' | 'all';

export function CommentsTab({
  view, t, locale, actions, focusId,
}: { view: PRView; t: T; locale: Locale; actions: CommentActions; focusId: string | null }) {
  const [filter, setFilter] = useState<CommentFilter>('pending');
  const list = view.comments
    .filter((x) =>
      filter === 'all' ? true
        : filter === 'pending' ? x.status === 'open'
          : filter === 'blocking' ? x.c.severity === 'blocking'
            : x.status !== 'open')
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.c.severity) - SEVERITY_ORDER.indexOf(b.c.severity));
  const count = (f: CommentFilter) =>
    view.comments.filter((x) =>
      f === 'all' ? true : f === 'pending' ? x.status === 'open' : f === 'blocking' ? x.c.severity === 'blocking' : x.status !== 'open').length;
  const fileOf = (path: string) => view.files.find((f) => f.path === path);
  return (
    <div className="space-y-4">
      <SectionTitle
        title={view.pr.userDiff ? t('comments.titleLocal') : t('comments.title')}
        subtitle={view.pr.userDiff ? t('comments.subtitleLocal') : t('comments.subtitleAi')}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('comments.filterLabel')}>
        {(['pending', 'blocking', 'done', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-full border ${filter === f ? 'border-neutral-300 text-neutral-100 bg-neutral-500/10' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
          >
            {t(`comments.filters.${f}`)} ({count(f)})
          </button>
        ))}
      </div>
      {view.comments.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">{view.pr.userDiff ? t('comments.emptyLocal') : t('comments.empty')}</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">{t('comments.emptyFilter')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((cv) => (
            <li key={cv.c.id}>
              <CommentCard cv={cv} file={fileOf(cv.c.file)} t={t} locale={locale} actions={actions} highlight={focusId === cv.c.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff con comentarios anclados
// ---------------------------------------------------------------------------

export function DiffTab({
  view, t, locale, actions, file, setFile, focusId,
}: {
  view: PRView; t: T; locale: Locale; actions: CommentActions; file: string | null; setFile: (p: string) => void; focusId: string | null;
}) {
  const [mode, setMode] = useState<'unified' | 'split'>('unified');
  const current = view.files.find((f) => f.path === file) ?? view.files[0];

  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`diff-comment-${focusId}`);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, current?.path]);

  if (!current) return <p className="text-xs text-zinc-400">{t('diff.noFile')}</p>;

  const commentsByAnchor = new Map<number, CommentView[]>();
  for (const cv of view.comments) {
    if (cv.c.file !== current.path || cv.status === 'dismissed') continue;
    const list = commentsByAnchor.get(cv.c.line) ?? [];
    list.push(cv);
    commentsByAnchor.set(cv.c.line, list);
  }
  const commentedNumbers = new Set(
    view.comments.filter((x) => x.c.file === current.path && x.status === 'open').map((x) => x.line),
  );

  return (
    <div className="space-y-4">
      <SectionTitle title={t('diff.title')} subtitle={t('diff.subtitle')} />
      <div className="flex flex-wrap gap-2 text-xs">
        {view.files.map((f) => (
          <button
            key={f.path}
            type="button"
            aria-pressed={current.path === f.path}
            onClick={() => setFile(f.path)}
            className={`px-2.5 py-1 rounded border font-mono max-w-full truncate ${current.path === f.path ? 'border-neutral-300 text-neutral-100 bg-neutral-500/10' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}
          >
            {f.path}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="text-zinc-400 flex items-center gap-3">
          <span className="text-emerald-400">+{current.additions}</span>
          <span className="text-rose-400">-{current.deletions}</span>
          {current.isNew && <Badge variant="info" size="sm">{t('diff.newFile')}</Badge>}
          {current.isAddedTest && <Badge variant="success" size="sm">{t('diff.testFile')}</Badge>}
        </div>
        <div className="inline-flex rounded-md border border-zinc-700 overflow-hidden" role="group" aria-label={t('diff.viewLabel')}>
          {(['unified', 'split'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {t(`diff.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {mode === 'unified' ? (
        <div className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
          {chunkRows(current.rows, commentsByAnchor).map((chunk, ci) =>
            chunk.kind === 'code' ? (
              // Cada tramo de código hace scroll horizontal por su cuenta; los
              // comentarios quedan fuera del scroll y nunca se cortan en móvil.
              <div key={ci} className="overflow-x-auto">
                <div className="min-w-max">
                  {chunk.rows.map((r, i) => {
                    if (r.type === 'gap') {
                      return <div key={i} className="px-3 py-1 text-zinc-500 bg-zinc-900/60 border-y border-zinc-800">⋯</div>;
                    }
                    const bg = r.type === 'add' ? 'bg-emerald-500/10' : r.type === 'del' ? 'bg-rose-500/10' : '';
                    const sign = r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' ';
                    const signTone = r.type === 'add' ? 'text-emerald-400' : r.type === 'del' ? 'text-rose-400' : 'text-zinc-600';
                    const text = r.type === 'del' ? r.old.text : r.new.text;
                    return (
                      <div key={i} className={`flex ${bg}`}>
                        <span className="text-zinc-600 w-10 shrink-0 text-right pr-2 select-none">{r.type !== 'add' ? r.old.number : ''}</span>
                        <span className="text-zinc-600 w-10 shrink-0 text-right pr-2 select-none">{r.type !== 'del' ? r.new.number : ''}</span>
                        <span className={`w-4 shrink-0 select-none ${signTone}`}>{sign}</span>
                        <code className="pr-4 whitespace-pre"><Code text={text || ' '} /></code>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div key={ci} className="px-3 py-2 space-y-2 bg-zinc-900/80 border-y border-zinc-800 font-sans">
                {chunk.comments.map((cv) => (
                  <CommentCard key={cv.c.id} cv={cv} t={t} locale={locale} actions={actions} compact highlight={focusId === cv.c.id} />
                ))}
              </div>
            ),
          )}
        </div>
      ) : (
        <SplitDiff file={current} t={t} marked={commentedNumbers} />
      )}
    </div>
  );
}

type Chunk = { kind: 'code'; rows: DiffRow[] } | { kind: 'comments'; comments: CommentView[] };

/** Agrupa las filas del diff en tramos de código separados por los comentarios anclados. */
function chunkRows(rows: DiffRow[], byAnchor: Map<number, CommentView[]>): Chunk[] {
  const out: Chunk[] = [];
  let code: DiffRow[] = [];
  for (const r of rows) {
    code.push(r);
    const anchor = r.type === 'add' || r.type === 'ctx' ? r.new.anchor : undefined;
    const attached = anchor !== undefined ? byAnchor.get(anchor) : undefined;
    if (attached && attached.length > 0) {
      out.push({ kind: 'code', rows: code });
      out.push({ kind: 'comments', comments: attached });
      code = [];
    }
  }
  if (code.length > 0) out.push({ kind: 'code', rows: code });
  return out;
}

function SplitDiff({ file, t, marked }: { file: FileView; t: T; marked: Set<number> }) {
  const pane = (lines: DisplayLine[], kind: 'old' | 'new') => (
    <pre className="text-xs leading-relaxed font-mono bg-zinc-950 border border-zinc-800 rounded-md p-3 overflow-x-auto h-full">
      {lines.length === 0 && <div className="text-zinc-600 italic">{t('diff.emptySide')}</div>}
      {lines.map((l, i) => {
        const isMarked = kind === 'new' && marked.has(l.number);
        return (
          <div key={i} className={`flex ${kind === 'old' ? 'bg-rose-500/5' : 'bg-emerald-500/5'} ${isMarked ? '!bg-amber-500/15' : ''}`}>
            <span className="text-zinc-600 w-8 shrink-0 text-right pr-3 select-none">{l.number}</span>
            <code className="flex-1 whitespace-pre"><Code text={l.text || ' '} /></code>
          </div>
        );
      })}
    </pre>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="min-w-0"><div className="text-[11px] uppercase text-zinc-500 mb-1">{t('diff.before')}</div>{pane(file.oldL, 'old')}</div>
      <div className="min-w-0"><div className="text-[11px] uppercase text-zinc-500 mb-1">{t('diff.after')}</div>{pane(file.newL, 'new')}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seguridad
// ---------------------------------------------------------------------------

export function SecurityTab({
  view, t, locale, actions, onExportCsv, onSbom,
}: {
  view: PRView; t: T; locale: Locale; actions: CommentActions; onExportCsv: () => void; onSbom: () => void;
}) {
  const sec = view.comments.filter((x) => x.c.category === 'security' || x.c.category === 'privacy');
  const pendingSec = sec.filter((x) => x.status === 'open');
  const secrets = pendingSec.filter((x) => x.c.tag === 'secret').length;
  const privacy = pendingSec.filter((x) => x.c.category === 'privacy').length;
  const vulnDeps = view.deps.filter((d) => d.advisory && !d.resolved).length;
  const code = pendingSec.filter((x) => x.c.category === 'security' && !x.c.tag).length;
  const fileOf = (path: string) => view.files.find((f) => f.path === path);
  return (
    <div className="space-y-4">
      <SectionTitle title={t('security.title')} subtitle={view.pr.userDiff ? t('security.subtitleLocal') : t('security.subtitle')} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <MiniMetric label={t('security.secrets')} value={`${secrets}`} tone={secrets ? 'text-rose-400' : 'text-emerald-400'} />
        <MiniMetric label={t('security.vulnDeps')} value={`${vulnDeps}`} tone={vulnDeps ? 'text-rose-400' : 'text-emerald-400'} />
        <MiniMetric label={t('security.privacy')} value={`${privacy}`} tone={privacy ? 'text-amber-400' : 'text-emerald-400'} />
        <MiniMetric label={t('security.code')} value={`${code}`} tone={code ? 'text-amber-400' : 'text-emerald-400'} />
      </div>

      {sec.length === 0 ? (
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-zinc-200">{t('security.none')}</span>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {sec.map((cv) => (
            <li key={cv.c.id}><CommentCard cv={cv} file={fileOf(cv.c.file)} t={t} locale={locale} actions={actions} /></li>
          ))}
        </ul>
      )}

      {view.deps.length > 0 && (
        <div className="pt-1">
          <h4 className="text-sm font-semibold text-zinc-100">{t('security.depsTitle')}</h4>
          <p className="text-xs text-zinc-400 mt-1">{t('security.depsSubtitle')}</p>
          <div className="mt-3 border border-zinc-800 rounded-md overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead className="bg-zinc-900/60 text-zinc-400">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t('security.colDep')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('security.colChange')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('security.colLicense')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('security.colAdvisory')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('security.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {view.deps.map((d) => (
                  <tr key={d.name}>
                    <td className="px-3 py-2 font-mono text-zinc-200">{d.name}</td>
                    <td className="px-3 py-2 text-zinc-400 font-mono whitespace-nowrap">{d.from} → <span className="text-zinc-200">{d.current}</span></td>
                    <td className="px-3 py-2 text-zinc-300">{d.license}</td>
                    <td className="px-3 py-2">
                      {d.advisory ? (
                        <div className="space-y-0.5">
                          <a href={d.advisory.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-violet-300 hover:underline">
                            {d.advisory.id}<ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                          <div className="text-zinc-500">{tr(d.advisory.summary, locale)} · {t('security.fixedIn', { version: d.advisory.fixedIn })}</div>
                        </div>
                      ) : <span className="text-zinc-500">{t('security.noAdvisory')}</span>}
                    </td>
                    <td className="px-3 py-2">
                      {!d.advisory ? null : d.resolved ? (
                        <Badge variant="success" size="sm">{t('security.resolved')}</Badge>
                      ) : d.fixCommentId && !actions.locked ? (
                        <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700 whitespace-nowrap" onClick={() => actions.apply(d.fixCommentId as string)}>
                          {t('security.applyUpgrade', { version: d.fixedTo ?? d.advisory.fixedIn })}
                        </Button>
                      ) : (
                        <Badge variant="danger" size="sm">{t('security.pending')}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200" onClick={onExportCsv}>
          <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />{t('security.exportCsv')}
        </Button>
        {view.deps.length > 0 && (
          <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200" onClick={onSbom}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />{t('security.sbom')}
          </Button>
        )}
      </div>
      <p className="text-[11px] text-zinc-500">{t('security.note')}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pruebas sugeridas
// ---------------------------------------------------------------------------

export function TestsTab({
  view, t, locale, onAdd, onRemove, onCopy,
}: {
  view: PRView; t: T; locale: Locale; onAdd: (id: string) => void; onRemove: (id: string) => void; onCopy: (text: string) => void;
}) {
  const { pr } = view;
  return (
    <div className="space-y-4">
      <SectionTitle title={t('tests.title')} subtitle={t('tests.subtitle')} />
      {pr.userDiff ? (
        <p className="text-xs text-zinc-400 italic">{t('tests.userNone')}</p>
      ) : pr.tests.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">{t('tests.none')}</p>
      ) : (
        <>
          <div className="text-xs text-zinc-400">{t('tests.addedCount', { count: view.addedTests.length, total: pr.tests.length })}</div>
          <ul className="space-y-3">
            {pr.tests.map((tt) => {
              const added = view.addedTests.includes(tt.id);
              return (
                <li key={tt.id} className="border border-zinc-800 rounded-md p-3 bg-zinc-900/40">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-100">{tr(tt.name, locale)}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5 break-all">{tt.file}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">{t(`tests.kind.${tt.kind}`)}</Badge>
                      {added && <Badge variant="success" size="sm">{t('tests.added')}</Badge>}
                    </div>
                  </div>
                  <div className="mt-2"><CodeBlock text={tt.code} tone="neutral" /></div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {added && view.status === 'merged' ? null : added ? (
                      <Button size="sm" variant="ghost" className="!text-zinc-300" onClick={() => onRemove(tt.id)}>
                        <MinusIcon className="w-4 h-4 mr-1" />{t('tests.remove')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700" onClick={() => onAdd(tt.id)} disabled={view.status === 'merged'}>
                        <PlusIcon className="w-4 h-4 mr-1" />{t('tests.add')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="!text-zinc-300" onClick={() => onCopy(tt.code)}>
                      <ClipboardDocumentIcon className="w-4 h-4 mr-1" />{t('tests.copy')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-[11px] text-zinc-500">{t('tests.note')}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Así se ve en tu repositorio (simulación)
// ---------------------------------------------------------------------------

export type Platform = 'github' | 'gitlab' | 'bitbucket' | 'azure';
export const PLATFORMS: Platform[] = ['github', 'gitlab', 'bitbucket', 'azure'];

export function botMarkdown(view: PRView, t: T, locale: Locale): string {
  const pending = view.comments.filter((x) => x.status === 'open');
  const lines = [
    `**${t('repo.mdTitle')}** · ${t('repo.mdScore', { score: view.score })} · ${t('repo.mdRisk', { risk: t(`summary.riskLevels.${view.risk}`) })}`,
    '',
    ...SEVERITY_ORDER.map((s) => `- ${t(`severity.${s}`)}: ${pending.filter((x) => x.c.severity === s).length}`),
    '',
    ...pending.map((x) => `- [${t(`severity.${x.c.severity}`)}] \`${x.c.file}:${x.line}\` ${tr(x.c.message, locale)}`),
    '',
    `_${t('repo.mdFooter')}_`,
  ];
  return lines.join('\n');
}

export function RepoTab({
  view, t, locale, platform, setPlatform, actions, onCopy,
}: {
  view: PRView; t: T; locale: Locale; platform: Platform; setPlatform: (p: Platform) => void; actions: CommentActions; onCopy: (text: string) => void;
}) {
  const { pr } = view;
  const pending = view.comments.filter((x) => x.status === 'open');
  const blocking = pending.filter((x) => x.c.severity === 'blocking').length;
  const inline = pending.find((x) => x.c.fix !== undefined) ?? pending[0];
  const inlineFile = inline ? view.files.find((f) => f.path === inline.c.file) : undefined;
  const inlineCode = inline && inlineFile ? inlineFile.newL.find((l) => l.anchor === inline.c.line)?.text ?? '' : '';
  const term = platform === 'gitlab' ? t('repo.termMr') : t('repo.termPr');
  const handle = t(`repo.bot.${platform}`);
  const repoName = pr.userDiff ? t('pr.userRepo') : pr.repo;
  return (
    <div className="space-y-4">
      <SectionTitle title={t('repo.title')} subtitle={t('repo.subtitle')} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('repo.platformLabel')}>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={platform === p}
            onClick={() => setPlatform(p)}
            className={`text-xs px-3 py-1.5 rounded-md border flex items-center gap-1.5 ${platform === p ? 'border-neutral-300 text-neutral-100 bg-neutral-500/10' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
          >
            <CodeBracketIcon className="w-4 h-4" />{t(`repo.platforms.${p}`)}
          </button>
        ))}
      </div>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
        {t('repo.simulated', { platform: t(`repo.platforms.${platform}`), how: t(`repo.how.${platform}`), plan: t(`repo.plan.${platform}`) })}
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="text-[11px] text-zinc-500">{repoName} · {term} #{pr.number}</div>
          <div className="text-sm font-semibold text-zinc-100 mt-0.5">{tr(pr.title, locale)}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {t('repo.wants', { author: pr.userDiff ? t('pr.userAuthor') : pr.author, branch: pr.userDiff ? t('pr.userBranch') : pr.branch, base: BASE_BRANCH })}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-md border border-zinc-800">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-200 flex items-center justify-center"><SparklesIcon className="w-3.5 h-3.5" /></span>
              <span className="font-semibold text-zinc-200">{handle}</span>
              <span className="text-zinc-500">{t('repo.commented')}</span>
            </div>
            <div className="px-3 py-3 text-xs text-zinc-300 space-y-2">
              <div>
                <span className="font-semibold text-zinc-100">{t('repo.mdTitle')}</span> · {t('repo.mdScore', { score: view.score })} · <span className={riskTone(view.risk)}>{t('repo.mdRisk', { risk: t(`summary.riskLevels.${view.risk}`) })}</span>
              </div>
              {pending.length === 0 ? (
                <div className="text-emerald-300">{t('repo.noPending')}</div>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {pending.map((x) => (
                    <li key={x.c.id}>
                      <span className="text-zinc-400">[{t(`severity.${x.c.severity}`)}]</span>{' '}
                      <code className="text-[11px] text-zinc-400 break-all">{x.c.file}:{x.line}</code>{' '}
                      {tr(x.c.message, locale)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-[11px] text-zinc-500 italic">{t('repo.mdFooter')}</div>
            </div>
          </div>

          {inline && (
            <div className="rounded-md border border-zinc-800">
              <div className="px-3 py-2 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono break-all">{inline.c.file} · {t('repo.line', { line: inline.line })}</div>
              <div className="px-3 py-2 bg-emerald-500/5 text-xs font-mono overflow-x-auto whitespace-pre"><Code text={inlineCode || ' '} /></div>
              <div className="px-3 py-3 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{handle}</span>
                  <Badge variant={sevBadge(inline.c.severity)} size="sm">{t(`severity.${inline.c.severity}`)}</Badge>
                </div>
                <div className="text-zinc-200">{tr(inline.c.message, locale)}</div>
                <div className="text-zinc-400">{tr(inline.c.explanation, locale)}</div>
                {inline.c.fix !== undefined && !actions.locked && (
                  <div className="rounded border border-zinc-800">
                    <div className="px-2 py-1 text-[11px] text-zinc-400 border-b border-zinc-800">{t(`repo.suggestionHeader.${platform}`)}</div>
                    <div className="p-2"><CodeBlock text={inline.c.fix} tone="new" /></div>
                    <div className="px-2 pb-2">
                      <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => actions.apply(inline.c.id)}>
                        {t(`repo.applyLabel.${platform}`)}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`rounded-md border px-3 py-2 text-xs flex items-center gap-2 ${blocking > 0 ? 'border-rose-500/40 bg-rose-500/5 text-rose-300' : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300'}`}>
            {blocking > 0 ? <ExclamationTriangleIcon className="w-4 h-4 shrink-0" /> : <CheckCircleIcon className="w-4 h-4 shrink-0" />}
            {blocking > 0 ? t('repo.checkBlocked', { count: blocking }) : t('repo.checkOk')}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200" onClick={() => onCopy(botMarkdown(view, t, locale))}>
          <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />{t('repo.copyMarkdown')}
        </Button>
        <Button size="sm" variant="ghost" className="!text-zinc-300" asChild>
          <Link href="/services#otras-soluciones">{t('repo.viewPlans')}</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Métricas del equipo
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = ['security', 'privacy', 'bug', 'perf', 'tests', 'style'];
const STATUSES: PRStatus[] = ['open', 'inReview', 'changesRequested', 'approved', 'merged'];
const CALC_KEY = 'koptup-demo-code-review-calc-v1';

export function MetricsTab({
  views, t, locale, onExportCsv,
}: { views: PRView[]; t: T; locale: Locale; onExportCsv: () => void }) {
  const [devs, setDevs] = useState(20);
  const [prsPerDev, setPrsPerDev] = useState(3);
  const [minutes, setMinutes] = useState(20);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CALC_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { devs?: number; prsPerDev?: number; minutes?: number };
        if (typeof v.devs === 'number') setDevs(v.devs);
        if (typeof v.prsPerDev === 'number') setPrsPerDev(v.prsPerDev);
        if (typeof v.minutes === 'number') setMinutes(v.minutes);
      }
    } catch {
      /* sin almacenamiento: se usan los valores por defecto */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CALC_KEY, JSON.stringify({ devs, prsPerDev, minutes }));
    } catch {
      /* ignorar */
    }
  }, [devs, prsPerDev, minutes, hydrated]);

  const all = views.flatMap((v) => v.comments);
  const byCat = CATEGORIES.map((c) => ({
    c,
    open: all.filter((x) => x.c.category === c && x.status === 'open').length,
    done: all.filter((x) => x.c.category === c && x.status !== 'open').length,
  }));
  const maxCat = Math.max(1, ...byCat.map((x) => x.open + x.done));
  const byStatus = STATUSES.map((s) => ({ s, n: views.filter((v) => v.status === s).length }));
  const timed = views.filter((v) => v.pr.firstReviewMin !== undefined);
  const avgFirst = timed.length ? timed.reduce((a, v) => a + (v.pr.firstReviewMin ?? 0), 0) / timed.length : 0;
  const resolvedPct = all.length ? Math.round((all.filter((x) => x.status === 'applied' || x.status === 'resolved').length / all.length) * 100) : 0;
  const hoursPerMonth = (devs * prsPerDev * (52 / 12) * minutes) / 60;
  const clamp = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);

  return (
    <div className="space-y-5">
      <SectionTitle title={t('metrics.title')} subtitle={t('metrics.subtitle')} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <MiniMetric label={t('metrics.prs')} value={`${views.length}`} tone="text-zinc-100" />
        <MiniMetric label={t('metrics.findings')} value={`${all.length}`} tone="text-violet-300" />
        <MiniMetric label={t('metrics.resolvedPct')} value={`${resolvedPct}%`} tone="text-emerald-400" />
        <MiniMetric label={t('metrics.avgFirst')} value={t('metrics.minutes', { value: formatNumber(avgFirst, locale, 1) })} tone="text-sky-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
          <div className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5"><ChartBarIcon className="w-4 h-4" />{t('metrics.byCategory')}</div>
          <ul className="space-y-2">
            {byCat.map(({ c, open, done }) => (
              <li key={c} className="text-[11px]">
                <div className="flex justify-between text-zinc-400"><span>{t(`category.${c}`)}</span><span>{t('metrics.openDone', { open, done })}</span></div>
                <div className="flex h-2.5 bg-zinc-900 rounded overflow-hidden mt-1">
                  <div className="h-full bg-emerald-600" style={{ width: `${(done / maxCat) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(open / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 mt-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-600 rounded-sm" />{t('metrics.legendDone')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-sm" />{t('metrics.legendOpen')}</span>
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
          <div className="text-xs text-zinc-400 mb-3">{t('metrics.byStatus')}</div>
          <ul className="space-y-2">
            {byStatus.map(({ s, n }) => (
              <li key={s} className="flex items-center gap-2 text-[11px]">
                <span className="w-28 text-zinc-400 shrink-0">{t(`status.${s}`)}</span>
                <div className="flex-1 h-2.5 bg-zinc-900 rounded overflow-hidden"><div className="h-full bg-violet-500" style={{ width: `${(n / Math.max(1, views.length)) * 100}%` }} /></div>
                <span className="w-6 text-right text-zinc-300">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead className="bg-zinc-900/60 text-zinc-400">
            <tr>
              <th className="text-left px-3 py-2 font-medium">{t('metrics.colPr')}</th>
              <th className="text-left px-3 py-2 font-medium">{t('metrics.colStatus')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('metrics.colScore')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('metrics.colOpen')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('metrics.colDone')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('metrics.colFirst')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {views.map((v) => (
              <tr key={v.pr.id}>
                <td className="px-3 py-2 text-zinc-200"><span className="text-zinc-500">#{v.pr.number}</span> {tr(v.pr.title, locale)}</td>
                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{t(`status.${v.status}`)}</td>
                <td className="px-3 py-2 text-right text-zinc-200">{v.score}</td>
                <td className="px-3 py-2 text-right text-amber-300">{v.comments.filter((x) => x.status === 'open').length}</td>
                <td className="px-3 py-2 text-right text-emerald-300">{v.comments.filter((x) => x.status !== 'open').length}</td>
                <td className="px-3 py-2 text-right text-zinc-400 whitespace-nowrap">{v.pr.firstReviewMin !== undefined ? t('metrics.minutes', { value: v.pr.firstReviewMin }) : t('metrics.instant')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200" onClick={onExportCsv}>
        <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />{t('metrics.exportCsv')}
      </Button>

      <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><CalculatorIcon className="w-5 h-5 text-violet-300" />{t('metrics.calcTitle')}</div>
        <p className="text-xs text-zinc-400 mt-1">{t('metrics.calcSubtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <label className="text-xs text-zinc-400">
            {t('metrics.calcDevs')}
            <input type="number" min={1} max={1000} value={devs} onChange={(e) => setDevs(clamp(Number(e.target.value), 1, 1000))}
              className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400" />
          </label>
          <label className="text-xs text-zinc-400">
            {t('metrics.calcPrs')}
            <input type="number" min={0} max={50} value={prsPerDev} onChange={(e) => setPrsPerDev(clamp(Number(e.target.value), 0, 50))}
              className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400" />
          </label>
          <label className="text-xs text-zinc-400">
            {t('metrics.calcMinutes')}
            <input type="number" min={0} max={240} value={minutes} onChange={(e) => setMinutes(clamp(Number(e.target.value), 0, 240))}
              className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400" />
          </label>
        </div>
        <div className="mt-3 text-sm text-zinc-200">
          {t('metrics.calcResult', { hours: formatNumber(hoursPerMonth, locale, 0) })}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1">{t('metrics.calcFormula')}</p>
      </Card>
    </div>
  );
}

