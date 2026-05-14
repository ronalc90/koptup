'use client';
import { useTranslations } from 'next-intl';
import {
  ChartBarSquareIcon, CursorArrowRaysIcon, ClockIcon, GlobeAltIcon, ShieldCheckIcon,
  ArrowsRightLeftIcon, ServerStackIcon, ScaleIcon, CommandLineIcon, PlusIcon,
  SparklesIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon,
  CloudArrowUpIcon, CircleStackIcon, TableCellsIcon, BellAlertIcon, CpuChipIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

export type Status = 'running' | 'idle' | 'error' | 'paused';
export type FieldType = 'text' | 'number' | 'url' | 'image' | 'html' | 'list';
export type ProxyType = 'datacenter' | 'residential' | 'mobile';
export type ProxyStatus = 'healthy' | 'degraded' | 'down';
export type RunStatus = 'ok' | 'error' | 'partial';
export type Browser = 'chromium' | 'firefox' | 'webkit';
export type Provider = 'twoCaptcha' | 'antiCaptcha' | 'capsolver' | 'none';
export type Mode = 'single' | 'recurring' | 'onEvent';
export type Format = 'json' | 'csv' | 'parquet' | 'ndjson';
export type Device = 'desktop' | 'tablet' | 'mobile';

export interface Scraper { id: string; name: string; target: string; status: Status; itemsToday: number; lastRunMin: number; successRate: number; }
export interface Field { id: string; name: string; selector: string; type: FieldType; required: boolean; sample: string; }
export interface ProxyRow { id: string; country: string; flag: string; type: ProxyType; latencyMs: number; status: ProxyStatus; successRate: number; lastUsedMin: number; }
export interface RunLog { id: string; scraper: string; status: RunStatus; durationS: number; items: number; errors: number; }
export interface Worker { id: string; node: string; browser: Browser; load: number; jobs: number; }

export const PROXIES: ProxyRow[] = [
  { id: 'p1', country: 'United States', flag: '🇺🇸', type: 'datacenter', latencyMs: 42, status: 'healthy', successRate: 99.2, lastUsedMin: 0 },
  { id: 'p2', country: 'Peru', flag: '🇵🇪', type: 'residential', latencyMs: 110, status: 'healthy', successRate: 96.8, lastUsedMin: 1 },
  { id: 'p3', country: 'Colombia', flag: '🇨🇴', type: 'mobile', latencyMs: 165, status: 'degraded', successRate: 87.3, lastUsedMin: 3 },
  { id: 'p4', country: 'Mexico', flag: '🇲🇽', type: 'residential', latencyMs: 95, status: 'healthy', successRate: 95.1, lastUsedMin: 0 },
  { id: 'p5', country: 'Brazil', flag: '🇧🇷', type: 'datacenter', latencyMs: 78, status: 'healthy', successRate: 98.4, lastUsedMin: 2 },
  { id: 'p6', country: 'Argentina', flag: '🇦🇷', type: 'mobile', latencyMs: 220, status: 'down', successRate: 0, lastUsedMin: 25 },
  { id: 'p7', country: 'Germany', flag: '🇩🇪', type: 'datacenter', latencyMs: 38, status: 'healthy', successRate: 99.6, lastUsedMin: 1 },
  { id: 'p8', country: 'Spain', flag: '🇪🇸', type: 'residential', latencyMs: 88, status: 'healthy', successRate: 94.7, lastUsedMin: 4 },
];
export const WORKERS: Worker[] = [
  { id: 'w-01', node: 'k8s-pool-a/n-04', browser: 'chromium', load: 78, jobs: 12 },
  { id: 'w-02', node: 'k8s-pool-a/n-04', browser: 'chromium', load: 62, jobs: 9 },
  { id: 'w-03', node: 'k8s-pool-a/n-05', browser: 'firefox', load: 41, jobs: 5 },
  { id: 'w-04', node: 'k8s-pool-b/n-01', browser: 'chromium', load: 94, jobs: 18 },
  { id: 'w-05', node: 'k8s-pool-b/n-02', browser: 'webkit', load: 33, jobs: 4 },
  { id: 'w-06', node: 'k8s-pool-b/n-02', browser: 'chromium', load: 71, jobs: 11 },
  { id: 'w-07', node: 'k8s-pool-c/n-03', browser: 'firefox', load: 22, jobs: 2 },
  { id: 'w-08', node: 'k8s-pool-c/n-03', browser: 'chromium', load: 58, jobs: 8 },
];
export const RUNS: RunLog[] = [
  { id: 'r1', scraper: 'Amazon · Libros', status: 'ok', durationS: 42, items: 1284, errors: 0 },
  { id: 'r2', scraper: 'MercadoLibre · Tech', status: 'partial', durationS: 67, items: 921, errors: 4 },
  { id: 'r3', scraper: 'Linio · Moda', status: 'error', durationS: 18, items: 0, errors: 127 },
  { id: 'r4', scraper: 'Falabella · Electro', status: 'ok', durationS: 38, items: 642, errors: 0 },
  { id: 'r5', scraper: 'Ripley · Outlet', status: 'ok', durationS: 52, items: 412, errors: 1 },
  { id: 'r6', scraper: 'Amazon · Libros', status: 'ok', durationS: 39, items: 1198, errors: 0 },
];
export const DIFF = [
  { field: 'price', before: '129.90', after: '109.90', kind: 'modified' as const },
  { field: 'stock', before: '12', after: '3', kind: 'modified' as const },
  { field: 'badges', before: '—', after: 'Black Friday', kind: 'added' as const },
  { field: 'subtitle', before: 'A Craftsman Guide', after: '—', kind: 'removed' as const },
  { field: 'rating', before: '4.7', after: '4.7', kind: 'unchanged' as const },
];

type T = ReturnType<typeof useTranslations>;

export function StatusDot({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    running: 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60 animate-pulse',
    idle: 'bg-secondary-500', error: 'bg-red-400', paused: 'bg-yellow-400',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status]}`} />;
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} aria-pressed={value}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${value ? 'bg-emerald-500' : 'bg-secondary-700'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Section({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-semibold text-white">{title}</h1>{subtitle && <p className="text-sm text-secondary-400">{subtitle}</p>}</div>
        {right}
      </header>
      {children}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Card variant="bordered" padding="md" className={`!bg-secondary-900 !border-secondary-800 ${className}`}>{children}</Card>;
}

export function Dashboard({ sparkline, t }: { sparkline: number[]; t: T }) {
  const kpis = [
    { k: 'activeScrapers', v: '24', d: '+3', icon: CursorArrowRaysIcon, c: 'text-emerald-300', bg: 'bg-emerald-500/10' },
    { k: 'pagesPerDay', v: '482K', d: '+12.4%', icon: ChartBarSquareIcon, c: 'text-cyan-300', bg: 'bg-cyan-500/10' },
    { k: 'successRate', v: '96.8%', d: '+0.4 pp', icon: CheckCircleIcon, c: 'text-green-300', bg: 'bg-green-500/10' },
    { k: 'captchasSolved', v: '1,284', d: '+18%', icon: ShieldCheckIcon, c: 'text-yellow-300', bg: 'bg-yellow-500/10' },
    { k: 'proxyCost', v: '$ 342', d: '−6%', icon: GlobeAltIcon, c: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10' },
  ];
  const max = Math.max(...sparkline);
  const alerts: { i: typeof ArrowPathIcon; k: string; v: 'info' | 'warning' | 'danger' }[] = [
    { i: ArrowPathIcon, k: 'domChange', v: 'info' }, { i: BellAlertIcon, k: 'rateLimit', v: 'warning' },
    { i: XCircleIcon, k: 'proxyDown', v: 'danger' }, { i: ShieldCheckIcon, k: 'captchaSurge', v: 'warning' },
  ];
  return (
    <Section title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map(({ k, v, d, icon: Icon, c, bg }) => (
          <Card key={k} variant="bordered" padding="sm" className="!bg-secondary-900 !border-secondary-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-secondary-400">{t(`dashboard.kpis.${k}`)}</div>
                <div className="text-2xl font-semibold text-white mt-1">{v}</div>
                <div className={`text-xs mt-0.5 ${d.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{d}</div>
              </div>
              <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${c}`} /></div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div><h3 className="text-sm font-semibold text-white">{t('dashboard.chartTitle')}</h3><p className="text-xs text-secondary-400">{t('dashboard.chartLegend')}</p></div>
            <div className="flex items-center gap-3 text-[11px] text-secondary-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />OK</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />ERR</span>
            </div>
          </div>
          <div className="h-44 flex items-end gap-1">
            {sparkline.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-stretch gap-0.5">
                <div className="flex-1 bg-gradient-to-t from-emerald-500/80 to-emerald-400/30 rounded-sm transition-all" style={{ height: `${((v / max) * 100).toFixed(2)}%` }} />
                <div className="h-1 bg-rose-500/60 rounded-sm" style={{ opacity: ((i * 7) % 11) / 11 }} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="text-sm font-semibold text-white mb-3">{t('dashboard.recentAlerts')}</h3>
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const Icon = a.i;
              return (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-secondary-950/60 border border-secondary-800">
                  <Icon className="h-4 w-4 text-secondary-400 mt-0.5" />
                  <div className="flex-1 text-xs text-secondary-300">{t(`dashboard.alerts.${a.k}`)}</div>
                  <Badge variant={a.v} size="sm">●</Badge>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <Panel>
        <h3 className="text-sm font-semibold text-white mb-3">{t('dashboard.topScrapers')}</h3>
        <div className="space-y-2">
          {[{ n: 'Amazon · Libros', p: 92 }, { n: 'MercadoLibre · Tech', p: 78 }, { n: 'Falabella · Electro', p: 64 }, { n: 'Ripley · Outlet', p: 41 }].map((s) => (
            <div key={s.n} className="flex items-center gap-3 text-xs">
              <div className="w-44 truncate text-secondary-300">{s.n}</div>
              <div className="flex-1 h-2 bg-secondary-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${s.p}%` }} />
              </div>
              <div className="w-10 text-right text-secondary-400">{s.p}%</div>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

export function Builder({ active, fields, setFields, addField, device, setDevice, aiMode, setAiMode, aiModel, setAiModel, schema, setSchema, t }: {
  active: Scraper; fields: Field[]; setFields: (f: Field[] | ((p: Field[]) => Field[])) => void; addField: () => void;
  device: Device; setDevice: (d: Device) => void; aiMode: boolean; setAiMode: (b: boolean) => void;
  aiModel: string; setAiModel: (m: string) => void; schema: string; setSchema: (s: string) => void; t: T;
}) {
  const widths: Record<Device, string> = { desktop: 'w-full', tablet: 'max-w-2xl mx-auto', mobile: 'max-w-sm mx-auto' };
  const upd = (id: string, p: Partial<Field>) => setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));
  return (
    <Section title={t('builder.title')} subtitle={t('builder.subtitle')} right={
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="!border-secondary-700 !text-secondary-200"><SparklesIcon className="h-4 w-4 mr-1.5" />{t('actions.testSelector')}</Button>
        <Button size="sm">{t('actions.save')}</Button>
      </div>
    }>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card variant="bordered" padding="sm" className="lg:col-span-2 !bg-secondary-900 !border-secondary-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{t('builder.previewTitle')}</h3>
              <div className="text-[11px] font-mono text-secondary-400">https://{active.target}/dp/B08X-PRODUCT</div>
            </div>
            <div className="flex gap-1 bg-secondary-950 rounded-md p-0.5 border border-secondary-800">
              {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
                <button key={d} onClick={() => setDevice(d)}
                  className={`px-2 py-1 text-[11px] rounded ${device === d ? 'bg-secondary-800 text-white' : 'text-secondary-400 hover:text-white'}`}>
                  {t(`builder.devices.${d}`)}
                </button>
              ))}
            </div>
          </div>
          <div className={`${widths[device]} bg-secondary-950 border border-secondary-800 rounded-lg overflow-hidden`}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-secondary-800 bg-secondary-900">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="flex-1 text-center text-[11px] font-mono text-secondary-500 truncate px-2">{active.target}</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-28 h-28 rounded bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 border border-dashed border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-300">{t('builder.fields.sample.image')}</div>
                <div className="flex-1 space-y-2">
                  <div className="px-2 py-1 rounded bg-emerald-500/10 border border-dashed border-emerald-500/40 text-emerald-200 text-sm font-semibold">Clean Architecture</div>
                  <div className="text-xs text-secondary-400">by <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-dashed border-cyan-500/40 text-cyan-200">Robert C. Martin</span></div>
                  <div className="flex items-baseline gap-2">
                    <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-dashed border-yellow-500/50 text-yellow-200 text-lg font-bold">S/ 129.90</span>
                    <span className="line-through text-xs text-secondary-500">S/ 159.90</span>
                  </div>
                  <div className="text-[11px] text-secondary-500">★ 4.7 · 2,481 reviews</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-secondary-800 rounded w-full" /><div className="h-2 bg-secondary-800 rounded w-5/6" /><div className="h-2 bg-secondary-800 rounded w-4/6" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded bg-secondary-800/60 border border-secondary-800" />)}</div>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm" className="!bg-secondary-900 !border-secondary-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">{t('builder.fieldsTitle')}</h3>
            <button onClick={addField} className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"><PlusIcon className="h-3.5 w-3.5" />{t('builder.fields.add')}</button>
          </div>
          {fields.length === 0 && <div className="text-xs text-secondary-500 italic">{t('builder.fieldsEmpty')}</div>}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {fields.map((f) => (
              <div key={f.id} className="p-2.5 rounded-md bg-secondary-950 border border-secondary-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <input value={f.name} onChange={(e) => upd(f.id, { name: e.target.value })} className="bg-transparent text-sm font-medium text-white outline-none flex-1 min-w-0" />
                  <select value={f.type} onChange={(e) => upd(f.id, { type: e.target.value as FieldType })} className="text-[10px] bg-secondary-900 border border-secondary-700 rounded px-1.5 py-0.5 text-secondary-300">
                    {(['text', 'number', 'url', 'image', 'html', 'list'] as FieldType[]).map((tp) => <option key={tp} value={tp}>{t(`builder.fields.types.${tp}`)}</option>)}
                  </select>
                  <button onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))} className="text-secondary-500 hover:text-rose-400"><TrashIcon className="h-3.5 w-3.5" /></button>
                </div>
                <input value={f.selector} onChange={(e) => upd(f.id, { selector: e.target.value })} className="block w-full bg-secondary-900 border border-secondary-800 rounded px-2 py-1 font-mono text-[11px] text-cyan-300 outline-none focus:border-emerald-500" />
                <div className="flex items-center justify-between text-[10px] text-secondary-500">
                  <span className="truncate">→ {f.sample}</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={f.required} onChange={(e) => upd(f.id, { required: e.target.checked })} className="h-3 w-3 accent-emerald-500" />{t('builder.fields.required')}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Panel>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500"><SparklesIcon className="h-4 w-4 text-white" /></div>
            <div>
              <div className="text-sm font-semibold text-white">{t('builder.ai.toggle')}</div>
              <div className="text-xs text-secondary-400 max-w-md">{t('builder.ai.toggleHint')}</div>
            </div>
          </div>
          <Toggle value={aiMode} onChange={setAiMode} />
        </div>
        {aiMode && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-secondary-300">{t('builder.ai.schemaTitle')}</div>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="text-[10px] bg-secondary-900 border border-secondary-700 rounded px-1.5 py-0.5 text-secondary-300">
                  <option value="claude-sonnet-4.7">claude-sonnet-4.7</option>
                  <option value="claude-opus-4.7">claude-opus-4.7</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </select>
              </div>
              <Textarea value={schema} onChange={(e) => setSchema(e.target.value)} rows={8} className="!bg-secondary-950 !border-secondary-800 !text-emerald-200 !font-mono !text-xs" />
            </div>
            <div>
              <div className="text-xs font-semibold text-secondary-300 mb-2">{t('builder.ai.previewTitle')}</div>
              <pre className="bg-secondary-950 border border-secondary-800 rounded-md p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto h-[212px]">
{`{
  "title": "Clean Architecture",
  "price": 129.9,
  "author": "Robert C. Martin",
  "images": [
    "https://m.media-amazon.com/.../I/91x.jpg"
  ],
  "rating": 4.7,
  "in_stock": true
}`}
              </pre>
              <p className="text-[10px] text-secondary-500 mt-1.5">{t('builder.ai.previewSubtitle')}</p>
            </div>
          </div>
        )}
      </Panel>
    </Section>
  );
}

export function Schedule({ mode, setMode, cron, setCron, concurrency, setConcurrency, retries, setRetries, triggers, setTriggers, t }: {
  mode: Mode; setMode: (m: Mode) => void; cron: string; setCron: (c: string) => void;
  concurrency: number; setConcurrency: (n: number) => void; retries: number; setRetries: (n: number) => void;
  triggers: Record<string, boolean>; setTriggers: (t: Record<string, boolean>) => void; t: T;
}) {
  const next = ['10:00', '12:00', '14:00', '16:00', '18:00'].map((time, i) => ({ time, in: `${i * 2 + 1}h` }));
  return (
    <Section title={t('schedule.title')} subtitle={t('schedule.subtitle')}>
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-secondary-300 mb-2">{t('schedule.modeLabel')}</div>
              <div className="flex gap-1.5 flex-wrap">
                {(['single', 'recurring', 'onEvent'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs border ${mode === m ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10' : 'border-secondary-700 text-secondary-400 hover:text-white'}`}>
                    {t(`schedule.modes.${m}`)}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'recurring' && (
              <div>
                <label className="block text-xs font-semibold text-secondary-300 mb-1.5">{t('schedule.cronLabel')}</label>
                <input value={cron} onChange={(e) => setCron(e.target.value)} className="block w-full bg-secondary-950 border border-secondary-800 rounded-md px-3 py-2 font-mono text-sm text-emerald-200 outline-none focus:border-emerald-500" />
                <p className="text-[11px] text-secondary-500 mt-1">{t('schedule.cronHint')}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-secondary-300 mb-1.5">{t('schedule.concurrencyLabel')}</label>
                <input type="number" value={concurrency} onChange={(e) => setConcurrency(parseInt(e.target.value || '1', 10))} className="w-full bg-secondary-950 border border-secondary-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-300 mb-1.5">{t('schedule.retriesLabel')}</label>
                <input type="number" value={retries} onChange={(e) => setRetries(parseInt(e.target.value || '0', 10))} className="w-full bg-secondary-950 border border-secondary-800 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="pt-2 border-t border-secondary-800">
              <div className="text-xs font-semibold text-secondary-300">{t('schedule.triggers.title')}</div>
              <p className="text-[11px] text-secondary-500 mb-2">{t('schedule.triggers.subtitle')}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {(['priceChange', 'stockChange', 'newItem', 'removed'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 p-2 rounded-md bg-secondary-950 border border-secondary-800 cursor-pointer">
                    <input type="checkbox" checked={triggers[k]} onChange={(e) => setTriggers({ ...triggers, [k]: e.target.checked })} className="h-3.5 w-3.5 accent-emerald-500" />
                    <span className="text-xs text-secondary-300">{t(`schedule.triggers.${k}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Panel>
        <Panel>
          <h3 className="text-sm font-semibold text-white mb-3">{t('schedule.nextRunsTitle')}</h3>
          <div className="space-y-2">
            {next.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-secondary-950 border border-secondary-800">
                <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-emerald-400" /><span className="text-sm font-mono text-white">{r.time}</span></div>
                <Badge variant="secondary" size="sm">+{r.in}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Section>
  );
}

export function Proxies({ rotation, setRotation, t }: { rotation: boolean; setRotation: (b: boolean) => void; t: T }) {
  const counts = { datacenter: PROXIES.filter((p) => p.type === 'datacenter').length, residential: PROXIES.filter((p) => p.type === 'residential').length, mobile: PROXIES.filter((p) => p.type === 'mobile').length };
  const sv: Record<ProxyStatus, 'success' | 'warning' | 'danger'> = { healthy: 'success', degraded: 'warning', down: 'danger' };
  return (
    <Section title={t('proxies.title')} subtitle={t('proxies.subtitle')} right={
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-secondary-400">{t('proxies.rotation')}</div>
          <div className="text-[11px] text-secondary-500 max-w-[200px]">{t('proxies.rotationHint')}</div>
        </div>
        <Toggle value={rotation} onChange={setRotation} />
      </div>
    }>
      <div className="grid sm:grid-cols-3 gap-3">
        {(['datacenter', 'residential', 'mobile'] as const).map((tp) => (
          <Panel key={tp}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-secondary-400">{t(`proxies.types.${tp}`)}</div>
                <div className="text-3xl font-semibold text-white mt-1">{counts[tp]}</div>
              </div>
              <GlobeAltIcon className="h-8 w-8 text-emerald-400/60" />
            </div>
          </Panel>
        ))}
      </div>
      <Card variant="bordered" padding="none" className="!bg-secondary-900 !border-secondary-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary-950 text-[11px] uppercase tracking-wider text-secondary-400">
            <tr>
              <th className="text-left px-3 py-2">{t('proxies.table.country')}</th>
              <th className="text-left px-3 py-2">{t('proxies.table.type')}</th>
              <th className="text-right px-3 py-2">{t('proxies.table.latency')}</th>
              <th className="text-right px-3 py-2">{t('proxies.table.successRate')}</th>
              <th className="text-left px-3 py-2">{t('proxies.table.status')}</th>
              <th className="text-right px-3 py-2">{t('proxies.table.lastUsed')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-800">
            {PROXIES.map((p) => (
              <tr key={p.id} className="hover:bg-secondary-800/30">
                <td className="px-3 py-2.5 text-white"><span className="mr-2">{p.flag}</span>{p.country}</td>
                <td className="px-3 py-2.5 text-secondary-300">{t(`proxies.types.${p.type}`)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-secondary-300">{p.latencyMs}ms</td>
                <td className="px-3 py-2.5 text-right font-mono text-emerald-300">{p.successRate.toFixed(1)}%</td>
                <td className="px-3 py-2.5"><Badge variant={sv[p.status]} size="sm">{t(`proxies.status.${p.status}`)}</Badge></td>
                <td className="px-3 py-2.5 text-right text-secondary-400 text-xs">{p.lastUsedMin}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-secondary-400">{t('proxies.costLabel')}: <span className="text-emerald-300 font-semibold">$ 342.40 / mes</span></div>
    </Section>
  );
}

export function Antibot({ antibot, setAntibot, provider, setProvider, t }: {
  antibot: Record<string, boolean>; setAntibot: (a: Record<string, boolean>) => void;
  provider: Provider; setProvider: (p: Provider) => void; t: T;
}) {
  const opts: { k: string; i: typeof ShieldCheckIcon }[] = [
    { k: 'fingerprinting', i: SparklesIcon }, { k: 'stealth', i: ShieldCheckIcon },
    { k: 'humanLike', i: CursorArrowRaysIcon }, { k: 'tlsFingerprint', i: ServerStackIcon },
  ];
  return (
    <Section title={t('antibot.title')} subtitle={t('antibot.subtitle')}>
      <div className="grid md:grid-cols-2 gap-3">
        {opts.map(({ k, i: Icon }) => {
          const on = antibot[k];
          return (
            <Panel key={k}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${on ? 'bg-emerald-500/15 text-emerald-300' : 'bg-secondary-800 text-secondary-500'}`}><Icon className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t(`antibot.options.${k}`)}</div>
                    <div className="text-xs text-secondary-400 max-w-xs mt-0.5">{t(`antibot.options.${k}Hint`)}</div>
                  </div>
                </div>
                <Toggle value={on} onChange={(v) => setAntibot({ ...antibot, [k]: v })} />
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-500/15 text-fuchsia-300"><ShieldCheckIcon className="h-4 w-4" /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{t('antibot.captchaTitle')}</div>
            <div className="text-xs text-secondary-400">{t('antibot.captchaHint')}</div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-secondary-300 mb-1.5">{t('antibot.captchaProvider')}</label>
          <div className="flex flex-wrap gap-2">
            {(['twoCaptcha', 'antiCaptcha', 'capsolver', 'none'] as const).map((p) => (
              <button key={p} onClick={() => setProvider(p)}
                className={`px-3 py-1.5 rounded-md text-xs border ${provider === p ? 'border-fuchsia-500 text-fuchsia-300 bg-fuchsia-500/10' : 'border-secondary-700 text-secondary-400 hover:text-white'}`}>
                {t(`antibot.providers.${p}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-secondary-300 mb-1.5">{t('antibot.userAgentLabel')}</label>
          <pre className="bg-secondary-950 border border-secondary-800 rounded-md p-3 font-mono text-[11px] text-secondary-300 overflow-x-auto">
{`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ...
Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/124.0`}
          </pre>
        </div>
      </Panel>
    </Section>
  );
}

export function Outputs({ outputs, setOutputs, format, setFormat, t }: {
  outputs: Record<string, boolean>; setOutputs: (o: Record<string, boolean>) => void;
  format: Format; setFormat: (f: Format) => void; t: T;
}) {
  const ch: { k: string; i: typeof CloudArrowUpIcon; cfg: string; demo: string }[] = [
    { k: 'webhook', i: ArrowsRightLeftIcon, cfg: 'configWebhook', demo: 'https://api.tu-app.com/hooks/scraping' },
    { k: 's3', i: CloudArrowUpIcon, cfg: 'configS3Bucket', demo: 's3://scrape-bucket/products/' },
    { k: 'db', i: CircleStackIcon, cfg: 'configDbUrl', demo: 'postgres://user:***@db.host:5432/scrape' },
    { k: 'sheets', i: TableCellsIcon, cfg: 'configSheetsId', demo: '1bX-y7K_aZ...spreadsheetId' },
    { k: 'airtable', i: TableCellsIcon, cfg: 'configAirtableBase', demo: 'appXyZ123/tblProducts' },
  ];
  return (
    <Section title={t('outputs.title')} subtitle={t('outputs.subtitle')} right={
      <div className="flex items-center gap-2">
        <span className="text-xs text-secondary-400">{t('outputs.format')}:</span>
        <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="bg-secondary-900 border border-secondary-700 rounded px-2 py-1 text-xs text-secondary-200">
          {(['json', 'ndjson', 'csv', 'parquet'] as const).map((f) => <option key={f} value={f}>{t(`outputs.formats.${f}`)}</option>)}
        </select>
      </div>
    }>
      <div className="grid md:grid-cols-2 gap-3">
        {ch.map(({ k, i: Icon, cfg, demo }) => {
          const on = outputs[k];
          return (
            <Panel key={k} className={on ? '' : '!opacity-60'}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${on ? 'bg-cyan-500/15 text-cyan-300' : 'bg-secondary-800 text-secondary-500'}`}><Icon className="h-4 w-4" /></div>
                  <div className="text-sm font-semibold text-white">{t(`outputs.channels.${k}`)}</div>
                </div>
                <Toggle value={on} onChange={(v) => setOutputs({ ...outputs, [k]: v })} />
              </div>
              {on && (
                <div className="mt-3">
                  <label className="block text-[11px] text-secondary-400 mb-1">{t(`outputs.${cfg}`)}</label>
                  <input defaultValue={demo} className="w-full bg-secondary-950 border border-secondary-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-secondary-200 outline-none focus:border-emerald-500" />
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </Section>
  );
}

export function Diff({ t }: { t: T }) {
  const a = DIFF.filter((r) => r.kind === 'added').length;
  const r = DIFF.filter((r) => r.kind === 'removed').length;
  const m = DIFF.filter((r) => r.kind === 'modified').length;
  return (
    <Section title={t('diff.title')} subtitle={t('diff.subtitle')}>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="success" size="md">+ {a} {t('diff.added')}</Badge>
        <Badge variant="danger" size="md">− {r} {t('diff.removed')}</Badge>
        <Badge variant="warning" size="md">~ {m} {t('diff.modified')}</Badge>
      </div>
      <Card variant="bordered" padding="none" className="!bg-secondary-900 !border-secondary-800 overflow-hidden">
        <div className="grid grid-cols-2 border-b border-secondary-800 text-[11px] uppercase tracking-wider text-secondary-400">
          <div className="px-4 py-2 border-r border-secondary-800 bg-secondary-950">{t('diff.previous')}</div>
          <div className="px-4 py-2 bg-secondary-950">{t('diff.current')}</div>
        </div>
        {DIFF.map((d) => {
          const bc = d.kind === 'removed' || d.kind === 'modified' ? 'bg-rose-500/10 text-rose-200' : 'text-secondary-300';
          const ac = d.kind === 'added' || d.kind === 'modified' ? 'bg-emerald-500/10 text-emerald-200' : 'text-secondary-300';
          return (
            <div key={d.field} className="grid grid-cols-2 border-b border-secondary-800 font-mono text-xs">
              <div className={`px-4 py-2 border-r border-secondary-800 ${bc}`}>
                <span className="text-secondary-500 mr-2">{d.kind === 'removed' || d.kind === 'modified' ? '−' : ' '}</span>
                <span className="text-secondary-400">{d.field}:</span> {d.before}
              </div>
              <div className={`px-4 py-2 ${ac}`}>
                <span className="text-secondary-500 mr-2">{d.kind === 'added' || d.kind === 'modified' ? '+' : ' '}</span>
                <span className="text-secondary-400">{d.field}:</span> {d.after}
              </div>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

export function Monitoring({ logs, running, logsRef, t }: { logs: string[]; running: boolean; logsRef: React.RefObject<HTMLDivElement>; t: T }) {
  return (
    <Section title={t('monitoring.title')} subtitle={t('monitoring.subtitle')}>
      <Card variant="bordered" padding="md" className="!bg-gradient-to-r !from-violet-500/10 !to-fuchsia-500/10 !border-fuchsia-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-300"><SparklesIcon className="h-4 w-4" /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{t('monitoring.autoFixTitle')}</div>
            <div className="text-xs text-fuchsia-200/80">{t('monitoring.autoFixHint')}</div>
            <div className="text-[11px] text-emerald-300 mt-1.5 font-mono">{t('monitoring.notification')}</div>
          </div>
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card variant="bordered" padding="none" className="!bg-secondary-900 !border-secondary-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary-950 text-[11px] uppercase tracking-wider text-secondary-400">
              <tr>
                <th className="text-left px-3 py-2">{t('monitoring.table.scraper')}</th>
                <th className="text-left px-3 py-2">{t('monitoring.table.status')}</th>
                <th className="text-right px-3 py-2">{t('monitoring.table.duration')}</th>
                <th className="text-right px-3 py-2">{t('monitoring.table.items')}</th>
                <th className="text-right px-3 py-2">{t('monitoring.table.errors')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-800">
              {RUNS.map((r) => (
                <tr key={r.id} className="hover:bg-secondary-800/30">
                  <td className="px-3 py-2 text-white text-xs">{r.scraper}</td>
                  <td className="px-3 py-2"><Badge variant={r.status === 'ok' ? 'success' : r.status === 'partial' ? 'warning' : 'danger'} size="sm">{r.status}</Badge></td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-secondary-300">{r.durationS}s</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-emerald-300">{r.items}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-rose-300">{r.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card variant="bordered" padding="sm" className="!bg-black !border-secondary-800">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-semibold text-secondary-300 flex items-center gap-2"><CommandLineIcon className="h-3.5 w-3.5" />{t('monitoring.logsTitle')}</h3>
            <span className={`text-[10px] font-mono ${running ? 'text-emerald-400 animate-pulse' : 'text-secondary-600'}`}>{running ? '● LIVE' : '○ IDLE'}</span>
          </div>
          <div ref={logsRef} className="h-72 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5 px-1">
            {logs.length === 0 && <div className="text-secondary-600 italic">— run the scraper to stream logs —</div>}
            {logs.map((l, i) => (
              <div key={i} className={l.startsWith('[ERR') || l.startsWith('[WARN') ? 'text-rose-300' : l.startsWith('[OK') ? 'text-emerald-300' : l.startsWith('[AI') ? 'text-fuchsia-300' : 'text-secondary-300'}>
                <span className="text-secondary-600 mr-2">{String(i + 1).padStart(3, '0')}</span>{l}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}

export function Cluster({ t }: { t: T }) {
  const total = Math.round(WORKERS.reduce((s, w) => s + w.load, 0) / WORKERS.length);
  return (
    <Section title={t('cluster.title')} subtitle={t('cluster.subtitle')} right={
      <Badge variant="info" size="md"><CpuChipIcon className="h-3.5 w-3.5 mr-1" />{t('cluster.autoscale')} · {WORKERS.length} pods</Badge>
    }>
      <Panel>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">{t('cluster.loadLabel')}</h3>
          <span className="text-3xl font-bold text-emerald-300">{total}%</span>
        </div>
        <div className="h-3 bg-secondary-950 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500" style={{ width: `${total}%` }} />
        </div>
        <p className="text-[11px] text-secondary-500 mt-2">{t('cluster.autoscaleHint')}</p>
      </Panel>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WORKERS.map((w) => {
          const c = w.load > 85 ? 'bg-rose-500' : w.load > 60 ? 'bg-yellow-400' : 'bg-emerald-500';
          return (
            <Card key={w.id} variant="bordered" padding="sm" className="!bg-secondary-900 !border-secondary-800">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-white">{w.id}</div>
                <Badge variant="secondary" size="sm">{t(`cluster.browsers.${w.browser}`)}</Badge>
              </div>
              <div className="text-[10px] text-secondary-500 font-mono mb-2 truncate">{t('cluster.nodeLabel')}: {w.node}</div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-secondary-400">{t('cluster.loadLabel')}</span>
                <span className="text-white font-mono">{w.load}%</span>
              </div>
              <div className="h-1.5 bg-secondary-800 rounded-full overflow-hidden">
                <div className={`h-full ${c} transition-all`} style={{ width: `${w.load}%` }} />
              </div>
              <div className="text-[10px] text-secondary-500 mt-2">jobs: {w.jobs}</div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

export function Compliance({ robots, setRobots, respectRate, setRespectRate, retention, setRetention, pii, setPii, t }: {
  robots: boolean; setRobots: (b: boolean) => void; respectRate: boolean; setRespectRate: (b: boolean) => void;
  retention: number; setRetention: (n: number) => void; pii: boolean; setPii: (b: boolean) => void; t: T;
}) {
  const tc = (Icon: typeof ShieldCheckIcon, title: string, hint: string, v: boolean, on: (b: boolean) => void) => (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${v ? 'bg-emerald-500/15 text-emerald-300' : 'bg-secondary-800 text-secondary-500'}`}><Icon className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs text-secondary-400 max-w-xs mt-0.5">{hint}</div>
          </div>
        </div>
        <Toggle value={v} onChange={on} />
      </div>
    </Panel>
  );
  return (
    <Section title={t('compliance.title')} subtitle={t('compliance.subtitle')}>
      <div className="grid md:grid-cols-2 gap-3">
        {tc(ScaleIcon, t('compliance.robotsTitle'), t('compliance.robotsHint'), robots, setRobots)}
        {tc(PauseCircleIcon, t('compliance.rateLimitTitle'), t('compliance.rateLimitHint'), respectRate, setRespectRate)}
        {tc(ShieldCheckIcon, t('compliance.piiTitle'), t('compliance.piiHint'), pii, setPii)}
        <Panel>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300"><CircleStackIcon className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{t('compliance.retentionTitle')}</div>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" value={retention} onChange={(e) => setRetention(parseInt(e.target.value || '0', 10))} className="w-24 bg-secondary-950 border border-secondary-800 rounded-md px-2 py-1 text-sm text-white outline-none focus:border-emerald-500" />
                <span className="text-xs text-secondary-400">{t('compliance.retentionLabel')}</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Panel>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300"><CheckCircleIcon className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold text-white">{t('compliance.dsrTitle')}</div>
            <div className="text-xs text-secondary-400">{t('compliance.dsrHint')}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info" size="sm">DELETE /dsr/erase</Badge>
              <Badge variant="info" size="sm">GET /dsr/export</Badge>
              <Badge variant="info" size="sm">PATCH /dsr/rectify</Badge>
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="text-sm font-semibold text-white mb-2">{t('compliance.auditTitle')}</div>
        <pre className="bg-secondary-950 border border-secondary-800 rounded-md p-3 font-mono text-[11px] text-secondary-300 overflow-x-auto">
{`2026-05-14T08:01:12Z  scraper=amazon-libros  action=run.start    actor=scheduler
2026-05-14T08:01:54Z  scraper=amazon-libros  action=run.finish   items=1284
2026-05-14T08:14:01Z  scraper=ml-tech         action=dsr.erase    target=user:18272
2026-05-14T08:17:33Z  scraper=linio-moda      action=auto-fix     selectors=3`}
        </pre>
      </Panel>
    </Section>
  );
}
