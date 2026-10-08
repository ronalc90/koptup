'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CodeBracketIcon, ShieldCheckIcon, SparklesIcon, MagnifyingGlassIcon, CheckCircleIcon,
  DocumentTextIcon, BeakerIcon, ChartBarIcon, PuzzlePieceIcon, ClockIcon, ExclamationTriangleIcon,
  ArrowPathIcon, TrashIcon, InformationCircleIcon, ClipboardDocumentListIcon, GlobeAltIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  effectiveNewLines, oldLines, diffRows, countChanges, displayLineOf, scoreFor, riskFor, sizeFor,
  analyzeParsed, findingsToComments, formatStamp, formatNumber, nowStamp, toCsv, buildCycloneDx, tr,
  type PR, type PRStatus, type CommentStatus, type PREvent, type Locale, type ParsedInput, type FileChange,
} from './components/analyzer';
import { SAMPLE_PRS, DEMO_USER, COMPANY, BASE_BRANCH } from './components/data';
import {
  SummaryTab, CommentsTab, DiffTab, SecurityTab, TestsTab, RepoTab, MetricsTab, riskTone,
  type TabKey, type PRView, type FileView, type CommentActions, type Platform,
} from './components/tabs';
import DiffModal from './components/DiffModal';

/** Solicitud de demo guiada: formulario de contacto con el producto preseleccionado. */
const RUTA_SOLICITAR_DEMO = '/contact?service=code-review-ia';
const STORAGE_KEY = 'koptup-demo-code-review-v1';
/** Autor de los PR creados con "Prueba con tu diff" (se muestra como "tú"). */
const YOU = '__you__';

interface PRState {
  status: PRStatus;
  comments: Record<string, CommentStatus>;
  addedTests: string[];
  events: PREvent[];
}
type StateMap = Record<string, PRState>;

const freshState = (pr: PR): PRState => ({
  status: pr.status,
  comments: { ...(pr.initialCommentStatus ?? {}) },
  addedTests: [],
  events: [],
});
const initialStates = (): StateMap => Object.fromEntries(SAMPLE_PRS.map((p) => [p.id, freshState(p)]));

const STATUSES: PRStatus[] = ['open', 'inReview', 'changesRequested', 'approved', 'merged'];
const COMMENT_STATUSES: CommentStatus[] = ['open', 'applied', 'dismissed', 'resolved'];
const EVENT_KINDS: PREvent['kind'][] = [
  'opened', 'aiReview', 'localReview', 'approved', 'changesRequested', 'merged',
  'applied', 'dismissed', 'resolved', 'reopened', 'testAdded', 'testRemoved',
];

/** Lee el estado guardado de los PR de ejemplo y descarta lo que no tenga la forma esperada. */
function readSaved(): StateMap | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { prs?: Record<string, Partial<PRState>> };
    if (!data || typeof data !== 'object' || !data.prs) return null;
    const out = initialStates();
    for (const pr of SAMPLE_PRS) {
      const s = data.prs[pr.id];
      if (!s) continue;
      if (s.status && STATUSES.includes(s.status)) out[pr.id].status = s.status;
      if (s.comments && typeof s.comments === 'object') {
        for (const c of pr.comments) {
          const v = (s.comments as Record<string, CommentStatus>)[c.id];
          if (v && COMMENT_STATUSES.includes(v)) out[pr.id].comments[c.id] = v;
        }
      }
      if (Array.isArray(s.addedTests)) {
        out[pr.id].addedTests = s.addedTests.filter((id) => pr.tests.some((x) => x.id === id));
      }
      if (Array.isArray(s.events)) {
        out[pr.id].events = s.events
          .filter((e) => e && typeof e.at === 'string' && EVENT_KINDS.includes(e.kind) && typeof e.who === 'string')
          .slice(-50);
      }
    }
    return out;
  } catch {
    return null;
  }
}

function buildView(pr: PR, st: PRState): PRView {
  const statusOf = (id: string): CommentStatus => {
    const c = pr.comments.find((x) => x.id === id);
    const s = st.comments[id] ?? 'open';
    // El comentario "faltan pruebas" se da por resuelto al agregar una prueba sugerida.
    if (c && c.category === 'tests' && s === 'open' && st.addedTests.length > 0) return 'resolved';
    return s;
  };
  const applied = pr.comments.filter((c) => c.fix !== undefined && statusOf(c.id) === 'applied');
  const toView = (f: FileChange, isAddedTest: boolean): FileView => {
    const oldL = oldLines(f);
    const newL = effectiveNewLines(f, isAddedTest ? [] : applied);
    const rows = diffRows(oldL, newL);
    const { additions, deletions } = countChanges(rows);
    return { path: f.path, oldL, newL, rows, additions, deletions, isNew: f.oldCode.length === 0, isAddedTest };
  };
  const files = pr.files.map((f) => toView(f, false));
  const groups = new Map<string, string[]>();
  for (const tt of pr.tests) {
    if (st.addedTests.includes(tt.id)) groups.set(tt.file, [...(groups.get(tt.file) ?? []), tt.code]);
  }
  groups.forEach((codes, path) => {
    files.push(toView({ path, oldCode: [], newCode: codes.join('\n\n').split('\n') }, true));
  });
  const comments = pr.comments.map((c) => {
    const f = files.find((x) => x.path === c.file);
    return { c, status: statusOf(c.id), line: f ? displayLineOf(f.newL, c.line) : c.line };
  });
  const openSeverities = comments.filter((x) => x.status === 'open').map((x) => x.c.severity);
  const additions = files.reduce((a, f) => a + f.additions, 0);
  const deletions = files.reduce((a, f) => a + f.deletions, 0);
  const deps = (pr.dependencies ?? []).map((d) => {
    const fixed = d.fixCommentId ? statusOf(d.fixCommentId) === 'applied' : false;
    const current = fixed && d.fixedTo ? d.fixedTo : d.to;
    const resolved = d.advisory ? (d.fixCommentId ? fixed : true) : true;
    return { ...d, current, resolved };
  });
  return {
    pr,
    status: st.status,
    comments,
    files,
    openSeverities,
    score: scoreFor(openSeverities),
    risk: riskFor(openSeverities),
    additions,
    deletions,
    events: [...pr.events, ...st.events],
    addedTests: st.addedTests,
    deps,
  };
}

const statusColor = (s: PRStatus): 'info' | 'warning' | 'success' | 'primary' | 'danger' =>
  s === 'merged' ? 'primary' : s === 'approved' ? 'success'
    : s === 'changesRequested' ? 'danger' : s === 'inReview' ? 'warning' : 'info';

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Toast = { id: number; text: string; tone: 'ok' | 'warn' | 'error' };

export default function CodeReviewIAPage() {
  const t = useTranslations('demoCodeReview');
  const locale: Locale = useLocale() === 'en' ? 'en' : 'es';

  const [states, setStates] = useState<StateMap>(initialStates);
  const [userPrs, setUserPrs] = useState<PR[]>([]);
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_PRS[0].id);
  const [tab, setTab] = useState<TabKey>('summary');
  const [filter, setFilter] = useState<'all' | 'mine' | 'review'>('all');
  const [query, setQuery] = useState('');
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('github');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const toastSeq = useRef(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Estado guardado (solo de los PR de ejemplo). Se lee después de montar para
  // que el HTML del servidor y el primer render del cliente coincidan.
  useEffect(() => {
    const saved = readSaved();
    if (saved) setStates(saved);
    setHydrated(true);
  }, []);
  useEffect(() => {
    // No se guarda hasta haber leído lo guardado (si no, se pisaría con el estado inicial).
    if (!hydrated) return;
    try {
      const prs = Object.fromEntries(SAMPLE_PRS.map((p) => [p.id, states[p.id]]));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, prs }));
    } catch {
      /* sin almacenamiento: la demo funciona igual, solo no recuerda los cambios */
    }
  }, [states, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);
  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, text, tone });
  }, []);

  const allPrs = useMemo(() => [...userPrs, ...SAMPLE_PRS], [userPrs]);
  const views = useMemo(
    () => allPrs.map((p) => buildView(p, states[p.id] ?? freshState(p))),
    [allPrs, states],
  );
  const view = views.find((v) => v.pr.id === selectedId) ?? views[0];
  const pr = view.pr;
  const isOwn = !!pr.userDiff || pr.author === DEMO_USER;
  const locked = view.status === 'merged';
  const pendingBlocking = view.openSeverities.filter((s) => s === 'blocking').length;

  const filteredViews = useMemo(() => {
    const q = query.trim().toLowerCase();
    return views.filter((v) => {
      if (filter === 'mine' && !(v.pr.userDiff || v.pr.author === DEMO_USER)) return false;
      if (filter === 'review' && !(v.pr.reviewers.includes(DEMO_USER) && ['open', 'inReview', 'changesRequested'].includes(v.status))) return false;
      if (!q) return true;
      const hay = [
        `#${v.pr.number}`, tr(v.pr.title, locale), v.pr.repo, v.pr.author, v.pr.branch, ...v.files.map((f) => f.path),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [views, filter, query, locale]);

  // ---------- Acciones ----------
  const stamp = () => nowStamp(new Date());
  const updatePr = useCallback((id: string, fn: (s: PRState) => PRState) => {
    setStates((prev) => {
      const base = prev[id];
      if (!base) return prev;
      return { ...prev, [id]: fn(base) };
    });
  }, []);
  const prOfComment = (commentId: string) => allPrs.find((p) => p.comments.some((c) => c.id === commentId));

  const setCommentStatus = (commentId: string, next: CommentStatus, kind: PREvent['kind'], toastKey: string) => {
    const owner = prOfComment(commentId);
    if (!owner) return;
    const v = views.find((x) => x.pr.id === owner.id);
    if (v?.status === 'merged') {
      notify(t('toasts.locked'), 'warn');
      return;
    }
    const cv = v?.comments.find((x) => x.c.id === commentId);
    const who = owner.userDiff ? YOU : DEMO_USER;
    updatePr(owner.id, (s) => ({
      ...s,
      comments: { ...s.comments, [commentId]: next },
      events: [...s.events, { at: stamp(), kind, who, detail: cv ? `${cv.c.file}:${cv.line}` : undefined }],
    }));
    notify(t(toastKey));
  };

  const actions: CommentActions = {
    locked,
    apply: (id) => setCommentStatus(id, 'applied', 'applied', 'toasts.applied'),
    dismiss: (id) => setCommentStatus(id, 'dismissed', 'dismissed', 'toasts.dismissed'),
    resolve: (id) => setCommentStatus(id, 'resolved', 'resolved', 'toasts.resolved'),
    reopen: (id) => setCommentStatus(id, 'open', 'reopened', 'toasts.reopened'),
    showInDiff: (id) => {
      const owner = prOfComment(id);
      const c = owner?.comments.find((x) => x.id === id);
      if (!c) return;
      setOpenFile(c.file);
      setFocusId(id);
      setTab('diff');
    },
  };

  const approve = () => {
    if (locked || isOwn) return;
    if (pendingBlocking > 0) {
      notify(t('toasts.approveBlocked', { count: pendingBlocking }), 'error');
      return;
    }
    updatePr(pr.id, (s) => ({ ...s, status: 'approved', events: [...s.events, { at: stamp(), kind: 'approved', who: DEMO_USER }] }));
    notify(t('toasts.approved', { number: pr.number }));
  };
  const requestChanges = () => {
    if (locked || isOwn) return;
    updatePr(pr.id, (s) => ({ ...s, status: 'changesRequested', events: [...s.events, { at: stamp(), kind: 'changesRequested', who: DEMO_USER }] }));
    notify(t('toasts.changesRequested', { number: pr.number }), 'warn');
  };
  const merge = () => {
    if (locked || pr.userDiff) return;
    if (view.status !== 'approved') {
      notify(t('toasts.mergeNeedsApproval'), 'warn');
      return;
    }
    if (pendingBlocking > 0) {
      notify(t('toasts.approveBlocked', { count: pendingBlocking }), 'error');
      return;
    }
    updatePr(pr.id, (s) => ({ ...s, status: 'merged', events: [...s.events, { at: stamp(), kind: 'merged', who: DEMO_USER }] }));
    notify(t('toasts.merged', { number: pr.number }));
  };

  const addTest = (testId: string) => {
    if (locked) return;
    const tt = pr.tests.find((x) => x.id === testId);
    if (!tt) return;
    updatePr(pr.id, (s) => (s.addedTests.includes(testId) ? s : {
      ...s,
      addedTests: [...s.addedTests, testId],
      events: [...s.events, { at: stamp(), kind: 'testAdded', who: DEMO_USER, detail: tt.file }],
    }));
    notify(t('toasts.testAdded', { file: tt.file }));
  };
  const removeTest = (testId: string) => {
    if (locked) return;
    const tt = pr.tests.find((x) => x.id === testId);
    if (!tt) return;
    updatePr(pr.id, (s) => ({
      ...s,
      addedTests: s.addedTests.filter((x) => x !== testId),
      events: [...s.events, { at: stamp(), kind: 'testRemoved', who: DEMO_USER, detail: tt.file }],
    }));
    notify(t('toasts.testRemoved'));
  };

  const copy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (!ok) throw new Error('copy');
      }
      notify(t('toasts.copied'));
    } catch {
      notify(t('toasts.copyFailed'), 'error');
    }
  };

  const exportSecurityCsv = () => {
    const rows: (string | number)[][] = [[
      t('csv.pr'), t('csv.id'), t('csv.severity'), t('csv.category'), t('csv.origin'), t('csv.file'), t('csv.line'), t('csv.status'), t('csv.finding'),
    ]];
    for (const cv of view.comments.filter((x) => x.c.category === 'security' || x.c.category === 'privacy')) {
      rows.push([
        `#${pr.number}`, cv.c.id, t(`severity.${cv.c.severity}`), t(`category.${cv.c.category}`),
        cv.c.origin === 'ai-sample' ? t('comments.originAi') : t('comments.originLocal'),
        cv.c.file, cv.line, t(`comments.statuses.${cv.status}`), tr(cv.c.message, locale),
      ]);
    }
    for (const d of view.deps.filter((x) => x.advisory)) {
      rows.push([
        `#${pr.number}`, d.advisory?.id ?? '', t(`security.sev.${d.advisory?.severity ?? 'high'}`), t('category.security'), t('csv.dependencyScan'),
        'package.json', '', d.resolved ? t('security.resolved') : t('security.pending'), `${d.name} ${d.current}`,
      ]);
    }
    download(`code-review-pr-${pr.number}-seguridad.csv`, `﻿${toCsv(rows)}`, 'text/csv;charset=utf-8');
    notify(t('toasts.exported'));
  };

  const exportSbom = () => {
    const bom = buildCycloneDx({
      appName: pr.repo.split('/')[1] ?? pr.repo,
      timestamp: new Date().toISOString(),
      dependencies: view.deps.map((d) => ({ name: d.name, version: d.current, license: d.license })),
      vulnerabilities: view.deps
        .filter((d) => d.advisory && !d.resolved)
        .map((d) => ({
          id: d.advisory?.id ?? '', name: d.name, version: d.current, severity: d.advisory?.severity ?? 'high',
          fixedIn: d.advisory?.fixedIn ?? '', url: d.advisory?.url ?? '',
        })),
    });
    download(`sbom-pr-${pr.number}.cdx.json`, JSON.stringify(bom, null, 2), 'application/json');
    notify(t('toasts.exported'));
  };

  const exportMetricsCsv = () => {
    const rows: (string | number)[][] = [[
      t('csv.pr'), t('csv.title'), t('csv.repo'), t('csv.author'), t('csv.status'), t('csv.score'), t('csv.open'), t('csv.done'), t('csv.firstReview'),
    ]];
    for (const v of views) {
      rows.push([
        `#${v.pr.number}`, tr(v.pr.title, locale), v.pr.userDiff ? t('pr.userRepo') : v.pr.repo, v.pr.userDiff ? t('pr.userAuthor') : v.pr.author,
        t(`status.${v.status}`), v.score, v.comments.filter((x) => x.status === 'open').length,
        v.comments.filter((x) => x.status !== 'open').length, v.pr.firstReviewMin ?? '',
      ]);
    }
    download('code-review-metricas-equipo.csv', `﻿${toCsv(rows)}`, 'text/csv;charset=utf-8');
    notify(t('toasts.exported'));
  };

  const createUserPr = (parsed: ParsedInput) => {
    const seq = userPrs.length + 1;
    const number = Math.max(...allPrs.map((p) => p.number)) + 1;
    const id = `u${number}`;
    const comments = findingsToComments(id, analyzeParsed(parsed));
    const at = stamp();
    const newPr: PR = {
      id,
      number,
      title: { es: `Tu diff ${seq} · análisis local`, en: `Your diff ${seq} · local analysis` },
      summary: { es: '', en: '' },
      repo: '',
      branch: '',
      author: '',
      reviewers: [],
      status: 'open',
      openedAt: at,
      commits: 1,
      files: parsed.files,
      comments,
      tests: [],
      events: [
        { at, kind: 'opened', who: YOU },
        { at, kind: 'localReview', who: 'revisor-local', detail: String(comments.length) },
      ],
      userDiff: true,
    };
    setUserPrs((prev) => [newPr, ...prev]);
    setStates((prev) => ({ ...prev, [id]: freshState(newPr) }));
    setSelectedId(id);
    setFilter('all');
    setQuery('');
    setOpenFile(null);
    setFocusId(null);
    setTab('comments');
    setModalOpen(false);
    notify(comments.length ? t('toasts.userPrCreated', { count: comments.length }) : t('toasts.userPrClean'));
  };

  const deleteUserPr = () => {
    if (!pr.userDiff) return;
    const id = pr.id;
    setUserPrs((prev) => prev.filter((p) => p.id !== id));
    setStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedId(SAMPLE_PRS[0].id);
    setTab('summary');
    notify(t('toasts.userPrDeleted'));
  };

  const resetDemo = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorar */
    }
    setStates(initialStates());
    setUserPrs([]);
    setSelectedId(SAMPLE_PRS[0].id);
    setTab('summary');
    setFilter('all');
    setQuery('');
    setOpenFile(null);
    setFocusId(null);
    notify(t('toasts.reset'));
  };

  const selectPr = (id: string) => {
    setSelectedId(id);
    setOpenFile(null);
    setFocusId(null);
  };
  const goTab = (k: TabKey) => {
    setTab(k);
    setFocusId(null);
  };
  const openFileInDiff = (path: string) => {
    setOpenFile(path);
    setFocusId(null);
    setTab('diff');
    tabsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  const closeModal = useCallback(() => setModalOpen(false), []);

  // ---------- Indicadores de cabecera (calculados con los datos) ----------
  const openCount = views.filter((v) => v.status !== 'merged').length;
  const blockingTotal = views
    .filter((v) => v.status !== 'merged')
    .reduce((a, v) => a + v.openSeverities.filter((s) => s === 'blocking').length, 0);
  const avgScore = views.reduce((a, v) => a + v.score, 0) / Math.max(1, views.length);
  const timed = views.filter((v) => v.pr.firstReviewMin !== undefined);
  const avgFirst = timed.reduce((a, v) => a + (v.pr.firstReviewMin ?? 0), 0) / Math.max(1, timed.length);

  const tabs: { key: TabKey; label: string; icon: typeof DocumentTextIcon; count?: number }[] = [
    { key: 'summary', label: t('tabs.summary'), icon: ClipboardDocumentListIcon },
    { key: 'comments', label: t('tabs.comments'), icon: SparklesIcon, count: view.openSeverities.length },
    { key: 'diff', label: t('tabs.diff'), icon: DocumentTextIcon },
    { key: 'security', label: t('tabs.security'), icon: ShieldCheckIcon },
    { key: 'tests', label: t('tabs.tests'), icon: BeakerIcon },
    { key: 'repo', label: t('tabs.repo'), icon: GlobeAltIcon },
    { key: 'metrics', label: t('tabs.metrics'), icon: ChartBarIcon },
  ];

  const repoLabel = pr.userDiff ? t('pr.userRepo') : pr.repo;
  const authorLabel = pr.userDiff ? t('pr.userAuthor') : pr.author;
  const currentDiffFile = openFile ?? view.files[0]?.path;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-neutral-800 bg-gradient-to-r from-neutral-700 to-neutral-900 shadow-lg">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2 min-w-0">
            <CodeBracketIcon className="w-6 h-6 text-neutral-200 shrink-0" />
            <h1 className="font-semibold tracking-tight text-zinc-100">{t('header.title')}</h1>
            <Badge variant="warning" size="sm" className="shrink-0">{t('header.sampleBadge')}</Badge>
          </div>
          <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                aria-label={t('header.searchPlaceholder')}
                className="w-full bg-neutral-900/60 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
              <PuzzlePieceIcon className="w-4 h-4 mr-1.5" />{t('header.tryDiff')}
            </Button>
            <Button size="sm" variant="outline" className="!border-neutral-300 !text-neutral-100 hover:!bg-neutral-800" asChild>
              <Link href={RUTA_SOLICITAR_DEMO}>{t('header.requestDemo')}</Link>
            </Button>
            <Button size="sm" variant="ghost" className="!text-neutral-300 hover:!bg-neutral-800" onClick={resetDemo} title={t('header.resetHint')}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />{t('header.reset')}
            </Button>
          </div>
        </div>
        <p className="max-w-[1500px] mx-auto px-4 pb-3 text-sm text-neutral-200/90">{t('header.subtitle', { company: COMPANY })}</p>
      </header>

      <div className="max-w-[1500px] mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={PuzzlePieceIcon} label={t('stats.openPrs')} value={`${openCount}`} sub={t('stats.openPrsSub', { total: views.length })} accent="text-neutral-200" />
          <StatCard icon={ExclamationTriangleIcon} label={t('stats.blocking')} value={`${blockingTotal}`} sub={t('stats.blockingSub')} accent="text-rose-400" />
          <StatCard icon={SparklesIcon} label={t('stats.avgScore')} value={formatNumber(avgScore, locale, 0)} sub={t('stats.avgScoreSub')} accent="text-emerald-400" />
          <StatCard icon={ClockIcon} label={t('stats.firstReview')} value={t('stats.minutes', { value: formatNumber(avgFirst, locale, 1) })} sub={t('stats.firstReviewSub')} accent="text-sky-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[280px_300px_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4 xl:contents min-w-0">
            {/* Lista de PR */}
            <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden h-fit">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-sm">{t('sidebar.title')}</span>
                <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{filteredViews.length}</Badge>
              </div>
              <div className="flex border-b border-zinc-800 text-xs" role="group" aria-label={t('sidebar.filterLabel')}>
                {(['all', 'mine', 'review'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2 transition-colors ${filter === f ? 'text-neutral-200 border-b-2 border-neutral-400 bg-neutral-800/40' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    {t(`sidebar.${f}`)}
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 text-[11px] text-zinc-500 border-b border-zinc-800">{t('sidebar.viewingAs', { user: DEMO_USER })}</div>
              <div className="max-h-[420px] lg:max-h-[640px] overflow-y-auto">
                {filteredViews.length === 0 && (
                  <div className="p-4 text-xs text-zinc-400 space-y-2">
                    <p>{t('sidebar.empty')}</p>
                    <Button size="sm" variant="ghost" className="!text-zinc-300 !px-0" onClick={() => { setQuery(''); setFilter('all'); }}>
                      <XMarkIcon className="w-4 h-4 mr-1" />{t('sidebar.clear')}
                    </Button>
                  </div>
                )}
                {filteredViews.map((v) => {
                  const cats = new Set(v.comments.filter((x) => x.status === 'open').map((x) => x.c.category));
                  return (
                    <button
                      key={v.pr.id}
                      type="button"
                      onClick={() => selectPr(v.pr.id)}
                      aria-current={selectedId === v.pr.id ? 'true' : undefined}
                      className={`w-full text-left px-3 py-3 border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors ${selectedId === v.pr.id ? 'bg-zinc-800/60 border-l-4 border-l-neutral-300' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-zinc-500">#{v.pr.number}</span>
                        <Badge variant={statusColor(v.status)} size="sm">{t(`status.${v.status}`)}</Badge>
                      </div>
                      <div className="text-sm font-medium mt-1 line-clamp-2 text-zinc-100">{tr(v.pr.title, locale)}</div>
                      <div className="text-[11px] text-zinc-500 mt-1 truncate">
                        {v.pr.userDiff ? t('pr.userRepo') : v.pr.repo} · {v.pr.userDiff ? t('pr.userAuthor') : v.pr.author}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700" title={t('pr.scoreTitle')}>
                          <SparklesIcon className="w-3 h-3 mr-1" />{v.score}
                        </Badge>
                        <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{t(`sizes.${sizeFor(v.additions + v.deletions)}`)}</Badge>
                        {v.pr.userDiff && <Badge variant="info" size="sm">{t('tags.local')}</Badge>}
                        {cats.has('security') && <Badge variant="danger" size="sm">{t('tags.security')}</Badge>}
                        {cats.has('privacy') && <Badge variant="warning" size="sm">{t('tags.privacy')}</Badge>}
                        {cats.has('perf') && <Badge variant="info" size="sm">{t('tags.perf')}</Badge>}
                        {cats.has('tests') && <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{t('tags.tests')}</Badge>}
                        {cats.size === 0 && <Badge variant="success" size="sm">{t('tags.clean')}</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Detalle del PR */}
            <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden h-fit">
              <div className="p-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-500 truncate">#{pr.number} · {repoLabel}</div>
                <h2 className="text-sm font-semibold mt-1 text-zinc-100">{tr(pr.title, locale)}</h2>
                {!pr.userDiff && <div className="text-[11px] text-zinc-500 mt-1 font-mono break-all">{t('pr.branchInto', { branch: pr.branch, base: BASE_BRANCH })}</div>}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant={statusColor(view.status)} size="sm">{t(`status.${view.status}`)}</Badge>
                  <span className={`text-xs ${riskTone(view.risk)}`}>{t('pr.risk', { risk: t(`summary.riskLevels.${view.risk}`) })}</span>
                  <span className="text-xs text-zinc-400">· {t('pr.score', { score: view.score })}</span>
                </div>
              </div>
              <div className="p-3 border-b border-zinc-800 text-xs space-y-1.5">
                <Row label={t('pr.author')} value={authorLabel} />
                {!pr.userDiff && <Row label={t('pr.reviewers')} value={pr.reviewers.join(', ')} />}
                <Row label={t('pr.commits')} value={`${pr.commits}`} />
                <Row label={t('pr.filesChanged')} value={`${view.files.length}`} />
                <Row label={t('pr.changes')} value={<span><span className="text-emerald-400">+{view.additions}</span> / <span className="text-rose-400">-{view.deletions}</span></span>} />
                <Row label={t('pr.openedAt')} value={formatStamp(pr.openedAt, locale)} />
                <Row
                  label={t('pr.firstReview')}
                  value={pr.firstReviewMin !== undefined ? t('pr.firstReviewValue', { min: pr.firstReviewMin }) : t('pr.firstReviewLocal')}
                />
              </div>
              <div className="p-3 border-b border-zinc-800">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{t('pr.files')}</div>
                <ul className="space-y-1">
                  {view.files.map((f) => (
                    <li key={f.path}>
                      <button
                        type="button"
                        onClick={() => openFileInDiff(f.path)}
                        className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-zinc-800/60 ${tab === 'diff' && currentDiffFile === f.path ? 'bg-zinc-800/60 text-neutral-100' : 'text-zinc-300'}`}
                      >
                        <span className="truncate text-left font-mono">{f.path}</span>
                        <span className="shrink-0 ml-2"><span className="text-emerald-400">+{f.additions}</span> <span className="text-rose-400">-{f.deletions}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 space-y-2">
                {pr.userDiff ? (
                  <>
                    <p className="text-[11px] text-zinc-400 flex gap-1.5"><InformationCircleIcon className="w-4 h-4 shrink-0" />{t('pr.userNote')}</p>
                    <Button size="sm" variant="ghost" className="!text-rose-300 hover:!bg-zinc-800" onClick={deleteUserPr}>
                      <TrashIcon className="w-4 h-4 mr-1.5" />{t('pr.deleteUserPr')}
                    </Button>
                  </>
                ) : locked ? (
                  <p className="text-xs text-zinc-400 flex gap-1.5"><CheckCircleIcon className="w-4 h-4 text-violet-300 shrink-0" />{t('pr.mergedNote')}</p>
                ) : (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={approve} disabled={isOwn || view.status === 'approved'}>
                        <CheckCircleIcon className="w-4 h-4 mr-1.5" />{t('pr.approve')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={requestChanges} disabled={isOwn || view.status === 'changesRequested'}>{t('pr.requestChanges')}</Button>
                      <Button size="sm" variant="outline" className="!border-neutral-400 !text-neutral-200 hover:!bg-neutral-800" onClick={merge} disabled={view.status !== 'approved'}>{t('pr.merge')}</Button>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      {isOwn && view.status !== 'approved' ? t('pr.ownNote')
                        : pendingBlocking > 0 ? t('pr.blockedNote', { count: pendingBlocking })
                          : view.status === 'approved' ? t('pr.readyNote')
                            : t('pr.approveNote')}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Pestañas */}
          <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden min-w-0">
            <div ref={tabsRef} className="border-b border-zinc-800 overflow-x-auto scroll-mt-24">
              <div className="flex min-w-max" role="tablist" aria-label={t('tabs.label')}>
                {tabs.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => goTab(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? 'border-neutral-300 text-neutral-100 bg-neutral-800/40' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <Icon className="w-4 h-4" />{label}
                    {count !== undefined && count > 0 && <span className="ml-0.5 rounded-full bg-zinc-700 px-1.5 text-[10px] text-zinc-200">{count}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5" role="tabpanel">
              {tab === 'summary' && (
                <SummaryTab view={view} t={t} locale={locale} onGo={goTab} onOpenFile={openFileInDiff} onTryDiff={() => setModalOpen(true)} />
              )}
              {tab === 'comments' && <CommentsTab view={view} t={t} locale={locale} actions={actions} focusId={focusId} />}
              {tab === 'diff' && (
                <DiffTab
                  view={view} t={t} locale={locale} actions={actions} file={openFile}
                  setFile={(p) => { setOpenFile(p); setFocusId(null); }} focusId={focusId}
                />
              )}
              {tab === 'security' && (
                <SecurityTab view={view} t={t} locale={locale} actions={actions} onExportCsv={exportSecurityCsv} onSbom={exportSbom} />
              )}
              {tab === 'tests' && (
                <TestsTab view={view} t={t} locale={locale} onAdd={addTest} onRemove={removeTest} onCopy={copy} />
              )}
              {tab === 'repo' && (
                <RepoTab view={view} t={t} locale={locale} platform={platform} setPlatform={setPlatform} actions={actions} onCopy={copy} />
              )}
              {tab === 'metrics' && <MetricsTab views={views} t={t} locale={locale} onExportCsv={exportMetricsCsv} />}
            </div>
          </Card>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <p className="flex gap-2"><InformationCircleIcon className="w-4 h-4 shrink-0 text-zinc-500" />{t('footer.sampleNote', { company: COMPANY })}</p>
          <Button size="sm" variant="outline" className="!border-neutral-400 !text-neutral-200 hover:!bg-neutral-800 shrink-0" asChild>
            <Link href={RUTA_SOLICITAR_DEMO}>{t('footer.cta')}</Link>
          </Button>
        </div>
      </div>

      <DiffModal open={modalOpen} onClose={closeModal} onAnalyze={createUserPr} t={t} locale={locale} />

      <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[120] flex justify-end pointer-events-none">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto max-w-sm rounded-lg border px-4 py-3 text-sm shadow-xl ${toast.tone === 'error' ? 'border-rose-500/50 bg-rose-950 text-rose-100' : toast.tone === 'warn' ? 'border-amber-500/50 bg-amber-950 text-amber-100' : 'border-emerald-500/50 bg-emerald-950 text-emerald-100'}`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: typeof DocumentTextIcon; label: string; value: string; sub: string; accent: string }) {
  return (
    <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-zinc-800/60 ${accent} shrink-0`}><Icon className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="text-xs text-zinc-400">{label}</div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-100 leading-tight whitespace-nowrap">{value}</div>
          <div className="text-[11px] text-zinc-500">{sub}</div>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-200 text-right truncate">{value}</span>
    </div>
  );
}
