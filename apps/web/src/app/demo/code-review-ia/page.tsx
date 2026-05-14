'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CodeBracketIcon, ShieldCheckIcon, SparklesIcon, MagnifyingGlassIcon, CheckCircleIcon,
  DocumentTextIcon, BeakerIcon, ChartBarIcon, PuzzlePieceIcon, PaintBrushIcon,
  RocketLaunchIcon, ClockIcon, WrenchScrewdriverIcon, ScaleIcon,
} from '@heroicons/react/24/outline';
import {
  AIReviewTab, TestsTab, SecurityTab, PerfTab, DesignTab, DocsTab, SearchTab,
  RefactorTab, AnalyticsTab, ComplianceTab, DiffSideBySide,
  type FileChange, type AIComment,
} from './components/tabs';

// ---------- Types ----------
type PRStatus = 'open' | 'inReview' | 'approved' | 'merged' | 'changesRequested';
type PRSize = 'xs' | 's' | 'm' | 'l' | 'xl';
type TabKey = 'files' | 'aiReview' | 'tests' | 'security' | 'performance' | 'design'
  | 'docs' | 'search' | 'refactor' | 'analytics' | 'compliance';

interface PR { id: string; number: number; title: string; repo: string; author: string;
  status: PRStatus; score: number; size: PRSize; branch: string; reviewers: string[];
  hours: number; files: number; additions: number; deletions: number; commits: number;
  tags: { tests: boolean; security: boolean; perf: boolean; docs: boolean; design: boolean };
  description: string; }

// ---------- Mock data ----------
const PRS: PR[] = [
  { id: 'p1', number: 482, title: 'feat(auth): refresh-token rotation + revoke endpoint',
    repo: 'koptup/api-core', author: 'ronald', status: 'inReview', score: 86, size: 'm',
    branch: 'feat/auth-refresh-rotation', reviewers: ['lucia', 'mateo'], hours: 4,
    files: 7, additions: 214, deletions: 58, commits: 5,
    tags: { tests: true, security: true, perf: false, docs: true, design: false },
    description: 'Adds rotating refresh tokens, a /auth/revoke endpoint and a denylist backed by Redis. Includes Bean Validation and 12 new unit tests.' },
  { id: 'p2', number: 481, title: 'fix(payments): retry idempotency on webhook timeout',
    repo: 'koptup/payments-svc', author: 'mateo', status: 'changesRequested', score: 71, size: 's',
    branch: 'fix/payments-idempotency', reviewers: ['ronald'], hours: 9, files: 3,
    additions: 88, deletions: 22, commits: 3,
    tags: { tests: true, security: false, perf: true, docs: false, design: false },
    description: 'Wraps webhook handler with an Idempotency-Key cache (24h TTL) and fixes retry loop on Stripe timeouts.' },
  { id: 'p3', number: 480, title: 'feat(ui): semantic search palette + cross-repo results',
    repo: 'koptup/web', author: 'lucia', status: 'open', score: 92, size: 'l',
    branch: 'feat/ui-search-palette', reviewers: ['ronald', 'sofia'], hours: 2, files: 14,
    additions: 612, deletions: 33, commits: 9,
    tags: { tests: true, security: false, perf: true, docs: true, design: true },
    description: 'Cmd-K palette with cross-repo semantic search, recent files and keyboard navigation. Wired to /search/v2.' },
  { id: 'p4', number: 479, title: 'chore(deps): bump pg, drizzle, zod (security)',
    repo: 'koptup/api-core', author: 'sofia', status: 'approved', score: 95, size: 'xs',
    branch: 'chore/deps-security', reviewers: ['ronald'], hours: 22, files: 2,
    additions: 18, deletions: 18, commits: 1,
    tags: { tests: false, security: true, perf: false, docs: false, design: false },
    description: 'Patches 3 CVEs reported by SCA: pg 8.11.5 → 8.13.0, drizzle 0.29 → 0.33, zod 3.22 → 3.23.' },
  { id: 'p5', number: 478, title: 'perf(reports): stream large CSV exports',
    repo: 'koptup/api-core', author: 'ronald', status: 'merged', score: 89, size: 'm',
    branch: 'perf/reports-stream', reviewers: ['lucia'], hours: 48, files: 5,
    additions: 121, deletions: 96, commits: 4,
    tags: { tests: true, security: false, perf: true, docs: false, design: false },
    description: 'Replaces in-memory aggregation with a streaming pipeline. p95 export 14s → 2.1s for 500k rows.' },
];

const FILES: FileChange[] = [
  { path: 'src/auth/refresh.service.ts', additions: 84, deletions: 12,
    oldCode: ['export class RefreshService {', '  rotate(token: string) {',
      '    const payload = jwt.verify(token, SECRET);', '    return jwt.sign({ uid: payload.uid }, SECRET);',
      '  }', '}'],
    newCode: ['export class RefreshService {',
      '  constructor(private denylist: TokenDenylist, private clock: Clock) {}',
      '  async rotate(token: string): Promise<TokenPair> {',
      '    const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });',
      '    if (await this.denylist.has(payload.jti)) throw new RevokedTokenError();',
      '    await this.denylist.add(payload.jti, this.clock.now());',
      '    return this.issuePair(payload.uid);', '  }', '}'] },
  { path: 'src/auth/refresh.controller.ts', additions: 42, deletions: 8,
    oldCode: ['router.post("/refresh", (req, res) => { /* ... */ });'],
    newCode: ['router.post("/refresh", validate(RefreshDto), async (req, res, next) => {',
      '  try { res.json(await refreshService.rotate(req.body.token)); }',
      '  catch (e) { next(e); }', '});'] },
  { path: 'src/auth/refresh.service.spec.ts', additions: 64, deletions: 0, oldCode: [],
    newCode: ['describe("RefreshService", () => {',
      '  it("rotates a valid token and revokes the old jti", async () => {',
      '    // ... 12 cases', '  });', '});'] },
  { path: 'src/auth/denylist.redis.ts', additions: 24, deletions: 0, oldCode: [],
    newCode: ['export class RedisTokenDenylist implements TokenDenylist {',
      '  constructor(private redis: Redis) {}',
      '  has(jti: string) { return this.redis.exists(`deny:${jti}`).then(Boolean); }',
      '  add(jti: string) { return this.redis.set(`deny:${jti}`, "1", "EX", 86400); }', '}'] },
];

const AI_COMMENTS: AIComment[] = [
  { id: 'c1', file: 'src/auth/refresh.service.ts', line: 4, severity: 'blocking', category: 'security',
    message: 'JWT verificado sin algoritmo explícito permite ataques alg=none.',
    explanation: 'Si no se restringe el algoritmo, un atacante puede forjar un token alg=none. Fijar algorithms a HS256/RS256.',
    snippet: 'jwt.verify(token, SECRET);',
    fix: 'jwt.verify(token, SECRET, { algorithms: ["HS256"] });' },
  { id: 'c2', file: 'src/auth/refresh.service.ts', line: 6, severity: 'warning', category: 'bug',
    message: 'El jti previo no se invalida tras rotar el refresh token.',
    explanation: 'Rotación sin revocación permite reutilizar el token anterior si fue interceptado. Agregar a denylist con TTL = exp.',
    snippet: 'return jwt.sign({ uid: payload.uid }, SECRET);',
    fix: 'await this.denylist.add(payload.jti, this.clock.now()); return this.issuePair(payload.uid);' },
  { id: 'c3', file: 'src/auth/refresh.controller.ts', line: 1, severity: 'suggestion', category: 'style',
    message: 'Lógica de negocio dentro del controller — extraer a service.',
    explanation: 'Mantener controllers delgados (single responsibility). El servicio ya existe, sólo orquestar y mapear errores.',
    snippet: 'router.post("/refresh", (req, res) => { /* ... */ });',
    fix: 'router.post("/refresh", validate(RefreshDto), handler(refreshService.rotate));' },
  { id: 'c4', file: 'src/auth/refresh.service.ts', line: 2, severity: 'info', category: 'design',
    message: 'Inyectar Clock facilita testeo determinístico.',
    explanation: 'Evita new Date() embebido — recibí un Clock por constructor para tests.',
    snippet: 'constructor() {}',
    fix: 'constructor(private denylist: TokenDenylist, private clock: Clock) {}' },
];

// ---------- Helpers ----------
const statusColor = (s: PRStatus): 'info' | 'warning' | 'success' | 'primary' | 'danger' =>
  s === 'merged' ? 'primary' : s === 'approved' ? 'success'
  : s === 'changesRequested' ? 'danger' : s === 'inReview' ? 'warning' : 'info';

// ---------- Component ----------
export default function CodeReviewIAPage() {
  const t = useTranslations('demoCodeReview');
  const [selectedId, setSelectedId] = useState<string>(PRS[0].id);
  const [tab, setTab] = useState<TabKey>('aiReview');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [fixed, setFixed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'mine' | 'review'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [openDiff, setOpenDiff] = useState<string | null>(FILES[0].path);

  const pr = useMemo(() => PRS.find((p) => p.id === selectedId)!, [selectedId]);
  const filteredPrs = useMemo(() => {
    if (filter === 'mine') return PRS.filter((p) => p.author === 'ronald');
    if (filter === 'review') return PRS.filter((p) => p.reviewers.includes('ronald'));
    return PRS;
  }, [filter]);
  const visibleComments = useMemo(() => AI_COMMENTS.filter((c) => !dismissed.has(c.id)), [dismissed]);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'files', label: t('tabs.files'), icon: DocumentTextIcon },
    { key: 'aiReview', label: t('tabs.aiReview'), icon: SparklesIcon },
    { key: 'tests', label: t('tabs.tests'), icon: BeakerIcon },
    { key: 'security', label: t('tabs.security'), icon: ShieldCheckIcon },
    { key: 'performance', label: t('tabs.performance'), icon: RocketLaunchIcon },
    { key: 'design', label: t('tabs.design'), icon: PaintBrushIcon },
    { key: 'docs', label: t('tabs.docs'), icon: DocumentTextIcon },
    { key: 'search', label: t('tabs.search'), icon: MagnifyingGlassIcon },
    { key: 'refactor', label: t('tabs.refactor'), icon: WrenchScrewdriverIcon },
    { key: 'analytics', label: t('tabs.analytics'), icon: ChartBarIcon },
    { key: 'compliance', label: t('tabs.compliance'), icon: ScaleIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-neutral-800 bg-gradient-to-r from-neutral-700 to-neutral-900 backdrop-blur sticky top-0 z-30 shadow-lg">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <CodeBracketIcon className="w-6 h-6 text-neutral-200" />
            <span className="font-semibold tracking-tight text-zinc-100">{t('pageTitle')}</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input placeholder={t('header.search')} className="w-full bg-neutral-900/60 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-neutral-400" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{t('header.syncing')}
            </span>
            <Button size="sm" variant="primary">
              <PuzzlePieceIcon className="w-4 h-4 mr-1.5" />{t('header.newPr')}
            </Button>
          </div>
        </div>
        <p className="max-w-[1500px] mx-auto px-4 pb-3 text-sm text-neutral-200/90">{t('pageSubtitle')}</p>
      </header>

      <div className="max-w-[1500px] mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={PuzzlePieceIcon} label={t('stats.openPrs')} value="12" sub={t('stats.openPrsSub')} accent="text-neutral-200" />
          <StatCard icon={SparklesIcon} label={t('stats.avgScore')} value="87" sub={t('stats.avgScoreSub')} accent="text-emerald-400" />
          <StatCard icon={ClockIcon} label={t('stats.leadTime')} value="6.2" sub={t('stats.leadTimeSub')} accent="text-sky-400" />
          <StatCard icon={BeakerIcon} label={t('stats.coverage')} value="84%" sub={t('stats.coverageSub')} accent="text-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_320px_1fr] gap-4">
          <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden h-fit">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-semibold text-sm">{t('sidebar.title')}</span>
              <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{filteredPrs.length}</Badge>
            </div>
            <div className="flex border-b border-zinc-800 text-xs">
              {(['all', 'mine', 'review'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-2 transition-colors ${filter === f ? 'text-neutral-200 border-b-2 border-neutral-400 bg-neutral-800/40' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  {t(`sidebar.${f}`)}
                </button>
              ))}
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              {filteredPrs.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-3 py-3 border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors ${selectedId === p.id ? 'bg-zinc-800/60 border-l-4 border-l-neutral-300' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">#{p.number}</span>
                    <Badge variant={statusColor(p.status)} size="sm">{t(`pr.statuses.${p.status}`)}</Badge>
                  </div>
                  <div className="text-sm font-medium mt-1 line-clamp-2 text-zinc-100">{p.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{p.repo} · {p.author}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">
                      <SparklesIcon className="w-3 h-3 mr-1" />{p.score}
                    </Badge>
                    <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{t(`pr.sizes.${p.size}`)}</Badge>
                    {p.tags.tests && <Badge variant="success" size="sm">{t('pr.tags.tests')}</Badge>}
                    {p.tags.security && <Badge variant="danger" size="sm">{t('pr.tags.security')}</Badge>}
                    {p.tags.perf && <Badge variant="info" size="sm">{t('pr.tags.perf')}</Badge>}
                    {p.tags.docs && <Badge variant="default" size="sm" className="!bg-zinc-800 !text-zinc-300">{t('pr.tags.docs')}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden h-fit hidden xl:block">
            <div className="p-3 border-b border-zinc-800">
              <div className="text-xs text-zinc-500">#{pr.number} · {pr.repo}</div>
              <div className="text-sm font-semibold mt-1 text-zinc-100 line-clamp-2">{pr.title}</div>
              <div className="text-[11px] text-zinc-500 mt-1">{pr.branch}</div>
            </div>
            <div className="p-3 border-b border-zinc-800 text-xs space-y-1.5">
              <Row label={t('pr.author')} value={pr.author} />
              <Row label={t('pr.reviewers')} value={pr.reviewers.join(', ')} />
              <Row label={t('pr.commits')} value={`${pr.commits}`} />
              <Row label={t('pr.filesChanged')} value={`${pr.files}`} />
              <Row label={`${t('pr.additions')} / ${t('pr.deletions')}`} value={<span><span className="text-emerald-400">+{pr.additions}</span> / <span className="text-rose-400">-{pr.deletions}</span></span>} />
              <Row label={t('pr.createdAt')} value={`${pr.hours}${t('pr.hoursAgo')}`} />
            </div>
            <div className="p-3 border-b border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">{t('files.title')}</div>
              <ul className="space-y-1">
                {FILES.map((f) => (
                  <li key={f.path}>
                    <button onClick={() => setOpenDiff(openDiff === f.path ? null : f.path)}
                      className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-zinc-800/60 ${openDiff === f.path ? 'bg-zinc-800/60 text-neutral-100' : 'text-zinc-300'}`}>
                      <span className="truncate text-left">{f.path}</span>
                      <span className="shrink-0 ml-2"><span className="text-emerald-400">+{f.additions}</span> <span className="text-rose-400">-{f.deletions}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 flex gap-2 flex-wrap">
              <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700">
                <CheckCircleIcon className="w-4 h-4 mr-1.5" />{t('pr.approve')}
              </Button>
              <Button size="sm" variant="danger">{t('pr.requestChanges')}</Button>
              <Button size="sm" variant="outline" className="!border-neutral-400 !text-neutral-200">{t('pr.merge')}</Button>
            </div>
          </Card>

          <Card variant="bordered" padding="none" className="!bg-zinc-900 !border-zinc-800 overflow-hidden">
            <div className="border-b border-zinc-800 overflow-x-auto">
              <div className="flex min-w-max">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? 'border-neutral-300 text-neutral-100 bg-neutral-800/40' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {tab === 'files' && <FilesTab pr={pr} openDiff={openDiff} setOpenDiff={setOpenDiff} t={t} />}
              {tab === 'aiReview' && <AIReviewTab comments={visibleComments} fixed={fixed}
                onFix={(id: string) => setFixed((s) => new Set([...Array.from(s), id]))}
                onDismiss={(id: string) => setDismissed((s) => new Set([...Array.from(s), id]))} t={t} />}
              {tab === 'tests' && <TestsTab t={t} />}
              {tab === 'security' && <SecurityTab t={t} />}
              {tab === 'performance' && <PerfTab t={t} />}
              {tab === 'design' && <DesignTab t={t} />}
              {tab === 'docs' && <DocsTab t={t} />}
              {tab === 'search' && <SearchTab t={t} q={searchQ} setQ={setSearchQ} />}
              {tab === 'refactor' && <RefactorTab t={t} />}
              {tab === 'analytics' && <AnalyticsTab t={t} />}
              {tab === 'compliance' && <ComplianceTab t={t} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent: string }) {
  return (
    <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-zinc-800/60 ${accent}`}><Icon className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="text-xs text-zinc-400">{label}</div>
          <div className="text-2xl font-bold text-zinc-100 leading-tight">{value}</div>
          <div className="text-[11px] text-zinc-500">{sub}</div>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 text-right truncate">{value}</span>
    </div>
  );
}

function FilesTab({ pr, openDiff, setOpenDiff, t }: any) {
  const file = FILES.find((f) => f.path === openDiff) ?? FILES[0];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{pr.title}</h3>
        <p className="text-xs text-zinc-400 mt-1">{pr.description}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {FILES.map((f) => (
          <button key={f.path} onClick={() => setOpenDiff(f.path)}
            className={`px-2.5 py-1 rounded border ${openDiff === f.path ? 'border-neutral-300 text-neutral-100 bg-neutral-500/10' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
            {f.path}
          </button>
        ))}
      </div>
      <div className="text-xs text-zinc-400 flex items-center gap-3">
        <span className="text-emerald-400">+{file.additions}</span>
        <span className="text-rose-400">-{file.deletions}</span>
        <span className="text-zinc-500">{t('files.diffTitle')}</span>
      </div>
      <DiffSideBySide file={file} />
    </div>
  );
}
