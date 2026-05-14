'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ShieldCheckIcon, BugAntIcon, SparklesIcon, ArrowPathIcon, CheckCircleIcon,
  PaintBrushIcon, RocketLaunchIcon, LockClosedIcon, ArrowDownTrayIcon, PlayIcon,
  CommandLineIcon, CpuChipIcon, ClipboardDocumentIcon, CodeBracketIcon,
} from '@heroicons/react/24/outline';

// ---------- Types (mirror page.tsx) ----------
export type Severity = 'info' | 'suggestion' | 'warning' | 'blocking';
export type Category = 'style' | 'bug' | 'security' | 'perf' | 'design';
export interface FileChange { path: string; additions: number; deletions: number; oldCode: string[]; newCode: string[]; }
export interface AIComment { id: string; file: string; line: number; severity: Severity; category: Category; message: string; explanation: string; snippet: string; fix: string; }

// ---------- Mock data ----------
export const SEC_VULN = [
  { id: 'CVE-2024-21538', pkg: 'cross-spawn', version: '7.0.3', severity: 'high', vector: 'ReDoS', fixedIn: '7.0.5', type: 'sca' },
  { id: 'CVE-2024-37890', pkg: 'ws', version: '8.13.0', severity: 'medium', vector: 'DoS', fixedIn: '8.17.1', type: 'sca' },
  { id: 'SAST-A02', pkg: 'src/auth/refresh.service.ts', version: '—', severity: 'critical', vector: 'JWT alg=none', fixedIn: 'this PR', type: 'sast' },
  { id: 'DAST-XSS', pkg: '/search?q=', version: '—', severity: 'low', vector: 'Reflected XSS', fixedIn: 'sanitize input', type: 'dast' },
];
export const LICENSES = [
  { name: 'react', version: '18.3.1', license: 'MIT', compat: 'ok' },
  { name: 'next', version: '14.2.5', license: 'MIT', compat: 'ok' },
  { name: 'pg', version: '8.13.0', license: 'MIT', compat: 'ok' },
  { name: 'ffmpeg-static', version: '5.2.0', license: 'GPL-2.0', compat: 'blocked' },
  { name: 'sharp', version: '0.33.5', license: 'Apache-2.0', compat: 'ok' },
  { name: 'pdfkit', version: '0.15.0', license: 'MIT', compat: 'ok' },
  { name: 'jszip', version: '3.10.1', license: 'MIT/GPL-3.0', compat: 'warn' },
];
export const TESTS = [
  { id: 't1', name: 'rotates valid token and revokes old jti', type: 'unit', status: 'passing', file: 'refresh.service.spec.ts' },
  { id: 't2', name: 'rejects revoked refresh token', type: 'unit', status: 'passing', file: 'refresh.service.spec.ts' },
  { id: 't3', name: 'rejects alg=none forged token', type: 'unit', status: 'passing', file: 'refresh.service.spec.ts' },
  { id: 't4', name: 'POST /refresh issues new pair', type: 'integration', status: 'passing', file: 'refresh.e2e.spec.ts' },
  { id: 't5', name: 'POST /revoke invalidates token chain', type: 'integration', status: 'failing', file: 'refresh.e2e.spec.ts' },
  { id: 't6', name: 'browser flow: login → refresh → logout', type: 'e2e', status: 'skipped', file: 'auth.e2e.ts' },
];
export const PERF_METRICS = [
  { metric: 'p50 /refresh', before: '38 ms', after: '21 ms', delta: -45, kind: 'improvement' },
  { metric: 'p95 /refresh', before: '120 ms', after: '74 ms', delta: -38, kind: 'improvement' },
  { metric: 'memory RSS', before: '210 MB', after: '232 MB', delta: 10, kind: 'regression' },
  { metric: 'cold start', before: '1.4 s', after: '1.5 s', delta: 7, kind: 'regression' },
];
export const DESIGN_CHECKS = [
  { rule: 'Color tokens', passes: 18, fails: 2 },
  { rule: 'Spacing scale', passes: 24, fails: 0 },
  { rule: 'Contrast AA', passes: 12, fails: 1 },
  { rule: 'Typography', passes: 9, fails: 0 },
];
export const REFACTORS = [
  { id: 'r1', title: 'Extraer validación duplicada a guard', impact: 24,
    before: 'if (!user || !user.active) throw new Error("forbidden");', after: '@UseGuards(ActiveUserGuard)' },
  { id: 'r2', title: 'Reemplazar for-loop por reduce inmutable', impact: 12,
    before: 'let total = 0; for (const i of items) total += i.price;',
    after: 'const total = items.reduce((a, i) => a + i.price, 0);' },
  { id: 'r3', title: 'Mover try/catch repetido a interceptor', impact: 36,
    before: 'try { return await service.x(); } catch (e) { logger.error(e); throw e; }',
    after: '@UseInterceptors(LoggingInterceptor)' },
];
export const SEARCH_RESULTS = [
  { repo: 'koptup/api-core', file: 'src/auth/jwt.service.ts', line: 42, snippet: 'verifyRefresh(token: string): Promise<TokenPair>' },
  { repo: 'koptup/payments-svc', file: 'src/jwt/refresh.ts', line: 18, snippet: 'export async function rotate(t: string) { /* ... */ }' },
  { repo: 'koptup/web', file: 'src/lib/auth.ts', line: 7, snippet: 'export async function refresh(): Promise<Session>' },
];

// ---------- Helpers ----------
export const sevColor = (s: Severity): 'info' | 'default' | 'warning' | 'danger' =>
  s === 'blocking' ? 'danger' : s === 'warning' ? 'warning' : s === 'suggestion' ? 'info' : 'default';
export const catIcon = (c: Category) =>
  c === 'security' ? ShieldCheckIcon : c === 'bug' ? BugAntIcon
  : c === 'perf' ? RocketLaunchIcon : c === 'design' ? PaintBrushIcon : SparklesIcon;
export const sevBgRing = (s: Severity) =>
  s === 'blocking' ? 'border-red-500/40 bg-red-500/5'
  : s === 'warning' ? 'border-amber-500/40 bg-amber-500/5'
  : s === 'suggestion' ? 'border-sky-500/40 bg-sky-500/5'
  : 'border-zinc-700 bg-zinc-800/40';
export function highlight(line: string): string {
  return line
    .replace(/(\/\/.*$)/g, '<span class="text-emerald-500/70">$1</span>')
    .replace(/(["'`].*?["'`])/g, '<span class="text-amber-300">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|await|async|class|extends|new|throw|try|catch|import|export|from|interface|type|public|private|implements|describe|it|expect)\b/g, '<span class="text-violet-400">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-pink-400">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]+)\b/g, '<span class="text-cyan-300">$1</span>');
}

// ---------- Components ----------
export function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-zinc-800 rounded-md p-2 bg-zinc-900/40">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
    </div>
  );
}

export function DiffSideBySide({ file }: { file: FileChange }) {
  const max = Math.max(file.oldCode.length, file.newCode.length);
  const renderPane = (lines: string[], kind: 'old' | 'new') => (
    <pre className="text-xs leading-relaxed font-mono bg-zinc-950 border border-zinc-800 rounded-md p-3 overflow-x-auto h-full">
      {Array.from({ length: max }).map((_, i) => {
        const l = lines[i] ?? '';
        const bg = l ? (kind === 'old' ? 'bg-rose-500/5' : 'bg-emerald-500/5') : '';
        const c = kind === 'old' ? 'text-rose-400' : 'text-emerald-400';
        return (
          <div key={i} className={`flex ${bg}`}>
            <span className="text-zinc-600 w-8 shrink-0 text-right pr-3">{l ? i + 1 : ''}</span>
            <span className={`w-3 shrink-0 ${c}`}>{l ? (kind === 'old' ? '-' : '+') : ' '}</span>
            <code className="flex-1" dangerouslySetInnerHTML={{ __html: l ? highlight(l) : '&nbsp;' }} />
          </div>
        );
      })}
    </pre>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><div className="text-[11px] uppercase text-zinc-500 mb-1">Before</div>{renderPane(file.oldCode, 'old')}</div>
      <div><div className="text-[11px] uppercase text-zinc-500 mb-1">After</div>{renderPane(file.newCode, 'new')}</div>
    </div>
  );
}

export function AIReviewTab({ comments, fixed, onFix, onDismiss, t }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{t('aiReview.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('aiReview.subtitle')}</p>
      </div>
      {comments.length === 0 && <div className="text-xs text-zinc-500 italic">— —</div>}
      <ul className="space-y-3">
        {comments.map((c: AIComment) => {
          const Icon = catIcon(c.category);
          const isFixed = fixed.has(c.id);
          return (
            <li key={c.id} className={`rounded-lg border ${sevBgRing(c.severity)} p-3`}>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-zinc-900/70 border border-zinc-800">
                  <Icon className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={sevColor(c.severity)} size="sm">{t(`aiReview.severities.${c.severity}`)}</Badge>
                    <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">{t(`aiReview.categories.${c.category}`)}</Badge>
                    <span className="text-[11px] text-zinc-500 font-mono">{c.file}:{c.line}</span>
                    {isFixed && <Badge variant="success" size="sm"><CheckCircleIcon className="w-3 h-3 mr-1" />{t('aiReview.fixed')}</Badge>}
                  </div>
                  <div className="text-sm text-zinc-100 mt-2">{c.message}</div>
                  <div className="text-xs text-zinc-400 mt-1">{c.explanation}</div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('files.oldVersion')}</div>
                      <pre className="text-xs font-mono bg-zinc-950 border border-rose-500/20 rounded p-2 overflow-x-auto">
                        <code dangerouslySetInnerHTML={{ __html: highlight(c.snippet) }} />
                      </pre>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('aiReview.suggestion')}</div>
                      <pre className="text-xs font-mono bg-zinc-950 border border-emerald-500/20 rounded p-2 overflow-x-auto">
                        <code dangerouslySetInnerHTML={{ __html: highlight(c.fix) }} />
                      </pre>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700" onClick={() => onFix(c.id)} disabled={isFixed}>
                      <SparklesIcon className="w-3.5 h-3.5 mr-1" />{isFixed ? t('aiReview.openPr') : t('aiReview.applyFix')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDismiss(c.id)} className="!text-zinc-400">{t('aiReview.dismiss')}</Button>
                    <Button size="sm" variant="ghost" className="!text-zinc-400"><ArrowPathIcon className="w-3.5 h-3.5 mr-1" />{t('aiReview.regen')}</Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TestsTab({ t }: any) {
  const counts = TESTS.reduce((acc: any, x) => ({ ...acc, [x.status]: (acc[x.status] || 0) + 1 }), { passing: 0, failing: 0, skipped: 0 });
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('tests.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('tests.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <MiniMetric label={t('tests.addedTests')} value={`${TESTS.length}`} tone="text-violet-300" />
        <MiniMetric label={t('tests.passing')} value={`${counts.passing}`} tone="text-emerald-400" />
        <MiniMetric label={t('tests.failing')} value={`${counts.failing}`} tone="text-rose-400" />
        <MiniMetric label={t('tests.coverageDelta')} value="+6.2%" tone="text-amber-400" />
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-zinc-400">{t('tests.coverageBefore')}: <span className="text-zinc-200">78.1%</span></span>
        <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ width: '84%' }} />
        </div>
        <span className="text-zinc-400">{t('tests.coverageAfter')}: <span className="text-emerald-400">84.3%</span></span>
      </div>
      <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md overflow-hidden">
        {TESTS.map((tt) => (
          <li key={tt.id} className="flex items-center gap-3 px-3 py-2 text-xs bg-zinc-900/40">
            <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700 capitalize">{t(`tests.${tt.type}`)}</Badge>
            <span className="flex-1 text-zinc-100 truncate">{tt.name}</span>
            <span className="font-mono text-[10px] text-zinc-500">{tt.file}</span>
            <Badge variant={tt.status === 'passing' ? 'success' : tt.status === 'failing' ? 'danger' : 'default'} size="sm">
              {t(`tests.${tt.status}`)}
            </Badge>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700">
          <PlayIcon className="w-4 h-4 mr-1.5" />{t('tests.runAll')}
        </Button>
        <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200">{t('tests.addToPr')}</Button>
      </div>
    </div>
  );
}

export function SecurityTab({ t }: any) {
  const sv = (s: string): 'danger' | 'warning' | 'info' | 'default' =>
    s === 'critical' || s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'info';
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('security.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('security.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['sast', 'dast', 'sca', 'secrets'] as const).map((s) => (
          <Badge key={s} variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">
            <ShieldCheckIcon className="w-3 h-3 mr-1" />{t(`security.scanTypes.${s}`)}
          </Badge>
        ))}
      </div>
      <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md overflow-hidden">
        {SEC_VULN.map((v) => (
          <li key={v.id} className="px-3 py-2.5 bg-zinc-900/40">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={sv(v.severity)} size="sm">{t(`security.${v.severity}`)}</Badge>
              <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700 uppercase">{v.type}</Badge>
              <span className="font-mono text-xs text-violet-300">{v.id}</span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-200 font-mono truncate">{v.pkg} {v.version !== '—' && `@${v.version}`}</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <span><span className="text-zinc-500">{t('security.vector')}:</span> {v.vector}</span>
              <span><span className="text-zinc-500">{t('security.fixedIn')}:</span> <span className="text-emerald-400">{v.fixedIn}</span></span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="ghost" className="!text-zinc-300">{t('security.openAdvisory')}</Button>
              <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700">{t('security.applyUpgrade')}</Button>
            </div>
          </li>
        ))}
      </ul>

      <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-medium">{t('security.secrets')}</div>
              <div className="text-xs text-zinc-400">{t('security.noSecrets')}</div>
            </div>
          </div>
          <Badge variant="success" size="sm">0</Badge>
        </div>
      </Card>

      <div className="pt-2">
        <h4 className="text-sm font-semibold">{t('license.title')}</h4>
        <p className="text-xs text-zinc-400 mt-1">{t('license.subtitle')}</p>
        <p className="text-[11px] text-zinc-500 mt-1">{t('license.policy')}</p>
        <div className="mt-3 border border-zinc-800 rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left px-3 py-2 font-medium">{t('license.dep')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('license.version')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('license.licenseCol')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('license.compat')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {LICENSES.map((l) => (
                <tr key={l.name}>
                  <td className="px-3 py-2 font-mono text-zinc-200">{l.name}</td>
                  <td className="px-3 py-2 text-zinc-400">{l.version}</td>
                  <td className="px-3 py-2 text-zinc-300">{l.license}</td>
                  <td className="px-3 py-2">
                    <Badge variant={l.compat === 'ok' ? 'success' : l.compat === 'warn' ? 'warning' : 'danger'} size="sm">
                      {t(`license.${l.compat}`)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button size="sm" variant="outline" className="mt-3 !border-zinc-700 !text-zinc-200">
          <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />{t('license.downloadSbom')}
        </Button>
      </div>
    </div>
  );
}

export function PerfTab({ t }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('performance.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('performance.subtitle')}</p>
      </div>
      <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md overflow-hidden">
        {PERF_METRICS.map((m) => (
          <li key={m.metric} className="px-3 py-2.5 bg-zinc-900/40 flex items-center gap-3 text-xs">
            <span className="flex-1 text-zinc-200">{m.metric}</span>
            <span className="text-zinc-500 font-mono">{m.before}</span>
            <span className="text-zinc-500">→</span>
            <span className="text-zinc-200 font-mono">{m.after}</span>
            <Badge variant={m.kind === 'improvement' ? 'success' : 'danger'} size="sm">{m.delta > 0 ? '+' : ''}{m.delta}%</Badge>
          </li>
        ))}
      </ul>
      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
        <div className="text-xs text-zinc-400 mb-2">{t('performance.viewFlamegraph')}</div>
        <div className="space-y-1">
          {[
            { name: 'jwt.verify', w: 90, color: 'bg-violet-600' },
            { name: 'redis.exists', w: 60, color: 'bg-sky-600' },
            { name: 'issuePair', w: 35, color: 'bg-emerald-600' },
            { name: 'json.parse', w: 18, color: 'bg-amber-600' },
          ].map((b) => (
            <div key={b.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-24 text-zinc-400 font-mono">{b.name}</span>
              <div className="flex-1 h-4 bg-zinc-900 rounded"><div className={`h-full ${b.color} rounded`} style={{ width: `${b.w}%` }} /></div>
              <span className="w-10 text-right text-zinc-500">{b.w}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignTab({ t }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('design.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('design.subtitle')}</p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {DESIGN_CHECKS.map((c) => (
          <li key={c.rule} className="border border-zinc-800 rounded-md p-3 bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-100">{c.rule}</span>
              <Badge variant={c.fails === 0 ? 'success' : 'warning'} size="sm">{c.passes}/{c.passes + c.fails}</Badge>
            </div>
            <div className="mt-2 flex gap-1.5 text-[11px]">
              <span className="text-emerald-400">{t('design.passes')}: {c.passes}</span>
              <span className="text-rose-400">{t('design.fails')}: {c.fails}</span>
            </div>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200">
        <PaintBrushIcon className="w-4 h-4 mr-1.5" />{t('design.viewFigma')}
      </Button>
    </div>
  );
}

export function DocsTab({ t }: any) {
  const readme = `# Auth · Refresh Token Rotation\n\nThis module issues short-lived access tokens and rotating refresh\ntokens backed by a Redis denylist.\n\n## Endpoints\n- \`POST /auth/refresh\` — exchanges a refresh token for a new pair.\n- \`POST /auth/revoke\` — adds the current jti to the denylist.\n\n## Security\n- Algorithm pinned to HS256.\n- Old jti is revoked on every rotation (replay-safe).`;
  const jsdoc = `/**\n * Rotates a refresh token, revoking the previous jti.\n * @param token - signed JWT refresh token\n * @returns a fresh {access, refresh} pair\n * @throws RevokedTokenError when the jti is denylisted\n */\nasync rotate(token: string): Promise<TokenPair>`;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">{t('docs.title')}</h3>
          <p className="text-xs text-zinc-400 mt-1">{t('docs.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="!text-zinc-300"><ArrowPathIcon className="w-4 h-4 mr-1.5" />{t('docs.regenerate')}</Button>
          <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200"><ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />{t('docs.copy')}</Button>
          <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700">{t('docs.commit')}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase text-zinc-500 mb-1">{t('docs.readme')}</div>
          <pre className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-md p-3 whitespace-pre-wrap leading-relaxed">{readme}</pre>
        </div>
        <div>
          <div className="text-[11px] uppercase text-zinc-500 mb-1">{t('docs.jsdoc')}</div>
          <pre className="text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-md p-3 whitespace-pre-wrap leading-relaxed">{jsdoc}</pre>
        </div>
      </div>
    </div>
  );
}

export function SearchTab({ t, q, setQ }: any) {
  const results = q.trim().length === 0 ? SEARCH_RESULTS : SEARCH_RESULTS.filter((r) => (r.file + r.snippet).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('search.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('search.subtitle')}</p>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} className="!bg-zinc-900 !border-zinc-700 !text-zinc-100" />
      <div className="text-xs text-zinc-500">{t('search.results')}: {results.length}</div>
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={i} className="border border-zinc-800 rounded-md p-3 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" size="sm" className="!text-zinc-300 !border-zinc-700">{r.repo}</Badge>
                <span className="font-mono text-zinc-400">{r.file}:{r.line}</span>
              </div>
              <Button size="sm" variant="ghost" className="!text-violet-300"><CommandLineIcon className="w-4 h-4 mr-1.5" />{t('search.openInIde')}</Button>
            </div>
            <pre className="mt-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded p-2 overflow-x-auto">
              <code dangerouslySetInnerHTML={{ __html: highlight(r.snippet) }} />
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RefactorTab({ t }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('refactor.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('refactor.subtitle')}</p>
      </div>
      <ul className="space-y-3">
        {REFACTORS.map((r) => (
          <li key={r.id} className="border border-zinc-800 rounded-md p-3 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-zinc-100">{r.title}</div>
              <Badge variant="info" size="sm">-{r.impact} {t('refactor.lines')}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('refactor.before')}</div>
                <pre className="text-xs font-mono bg-zinc-950 border border-rose-500/20 rounded p-2 overflow-x-auto">
                  <code dangerouslySetInnerHTML={{ __html: highlight(r.before) }} />
                </pre>
              </div>
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">{t('refactor.after')}</div>
                <pre className="text-xs font-mono bg-zinc-950 border border-emerald-500/20 rounded p-2 overflow-x-auto">
                  <code dangerouslySetInnerHTML={{ __html: highlight(r.after) }} />
                </pre>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="primary" className="!bg-violet-600 hover:!bg-violet-700">{t('refactor.apply')}</Button>
              <Button size="sm" variant="ghost" className="!text-zinc-300">{t('refactor.previewPr')}</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsTab({ t }: any) {
  const items = [
    { k: 'leadTime', v: '6.2h', accent: 'text-violet-300' },
    { k: 'reviewDepth', v: '4.8', accent: 'text-sky-300' },
    { k: 'busFactor', v: '3', accent: 'text-amber-300' },
    { k: 'mttm', v: '7.4', accent: 'text-emerald-300' },
    { k: 'throughput', v: '34', accent: 'text-pink-300' },
    { k: 'rework', v: '12%', accent: 'text-rose-300' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('analytics.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('analytics.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <Card key={it.k} variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t(`analytics.${it.k}`)}</div>
            <div className={`text-2xl font-bold mt-1 ${it.accent}`}>{it.v}</div>
            <div className="text-[11px] text-zinc-500">{t(`analytics.${it.k}Sub`)}</div>
          </Card>
        ))}
      </div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
        <div className="text-xs text-zinc-400 mb-3">PRs / week</div>
        <div className="flex items-end gap-2 h-32">
          {[18, 22, 27, 24, 31, 29, 34].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-sm" style={{ height: `${(v / 35) * 100}%` }} />
              <span className="text-[10px] text-zinc-500">W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComplianceTab({ t }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('compliance.title')}</h3>
        <p className="text-xs text-zinc-400 mt-1">{t('compliance.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-emerald-400" /><span className="text-sm font-medium">{t('compliance.slsa')}</span></div>
          <div className="text-3xl font-bold text-emerald-300 mt-1">3</div>
          <Badge variant="success" size="sm" className="mt-1">{t('compliance.verified')}</Badge>
        </Card>
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="flex items-center gap-2"><LockClosedIcon className="w-5 h-5 text-violet-400" /><span className="text-sm font-medium">{t('compliance.attestation')}</span></div>
          <div className="text-3xl font-bold text-violet-300 mt-1">12</div>
          <Badge variant="info" size="sm" className="mt-1">{t('compliance.signed')}</Badge>
        </Card>
        <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
          <div className="flex items-center gap-2"><CpuChipIcon className="w-5 h-5 text-sky-400" /><span className="text-sm font-medium">{t('compliance.provenance')}</span></div>
          <div className="text-sm text-zinc-200 mt-2 font-mono">sha256:9f3a…b1e7</div>
          <Button size="sm" variant="ghost" className="!text-zinc-300 mt-1 !px-0">{t('compliance.viewBundle')}</Button>
        </Card>
      </div>
      <div>
        <div className="text-[11px] uppercase text-zinc-500 mb-2">{t('compliance.integrations')}</div>
        <div className="flex flex-wrap gap-2">
          {['GitHub', 'GitLab', 'Bitbucket', 'Azure DevOps'].map((it) => (
            <Badge key={it} variant="outline" size="md" className="!text-zinc-200 !border-zinc-700">
              <CodeBracketIcon className="w-4 h-4 mr-1.5" />{it}
            </Badge>
          ))}
        </div>
      </div>
      <Card variant="bordered" padding="sm" className="!bg-zinc-900 !border-zinc-800">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-violet-500/10 text-violet-300"><CommandLineIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-medium">{t('compliance.ide')}</div>
              <div className="text-xs text-zinc-400">{t('compliance.vscode')} · {t('compliance.jetbrains')}</div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="!border-zinc-700 !text-zinc-200">
            <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />VS Code Marketplace
          </Button>
        </div>
      </Card>
    </div>
  );
}
