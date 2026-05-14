'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChartBarSquareIcon, CursorArrowRaysIcon, ClockIcon, GlobeAltIcon, ShieldCheckIcon,
  ArrowsRightLeftIcon, EyeIcon, ServerStackIcon, ScaleIcon, CommandLineIcon,
  PlusIcon, PlayIcon, StopIcon, Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Antibot, Builder, Cluster, Compliance, Dashboard, Diff, Monitoring, Outputs, Proxies, Schedule,
  StatusDot, type Device, type Field, type Format, type Mode, type Provider, type Scraper, type Status,
} from './components/views';

type Tab = 'dashboard' | 'builder' | 'schedule' | 'proxies' | 'antibot' | 'outputs' | 'diff' | 'monitoring' | 'cluster' | 'compliance';

export default function ScrapingDemoPage() {
  const t = useTranslations('demoScraping');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ethical, setEthical] = useState(true);
  const [running, setRunning] = useState(false);
  const [scrapers] = useState<Scraper[]>([
    { id: 's1', name: 'Amazon · Libros', target: 'amazon.com.pe', status: 'running', itemsToday: 12480, lastRunMin: 2, successRate: 98.4 },
    { id: 's2', name: 'MercadoLibre · Tech', target: 'mercadolibre.com.co', status: 'running', itemsToday: 8742, lastRunMin: 5, successRate: 96.1 },
    { id: 's3', name: 'Linio · Moda', target: 'linio.com', status: 'error', itemsToday: 1203, lastRunMin: 18, successRate: 71.2 },
    { id: 's4', name: 'Falabella · Electro', target: 'falabella.com', status: 'idle', itemsToday: 0, lastRunMin: 60, successRate: 94.8 },
    { id: 's5', name: 'Ripley · Outlet', target: 'ripley.com.pe', status: 'paused', itemsToday: 542, lastRunMin: 120, successRate: 88.7 },
  ]);
  const [activeId, setActiveId] = useState('s1');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const [fields, setFields] = useState<Field[]>([
    { id: 'f1', name: t('builder.fields.sample.title'), selector: 'h1.product-title', type: 'text', required: true, sample: 'Clean Architecture' },
    { id: 'f2', name: t('builder.fields.sample.price'), selector: 'span.a-price-whole', type: 'number', required: true, sample: '129.90' },
    { id: 'f3', name: t('builder.fields.sample.author'), selector: 'a.contributorNameID', type: 'text', required: false, sample: 'Robert C. Martin' },
    { id: 'f4', name: t('builder.fields.sample.image'), selector: 'img#landingImage', type: 'image', required: false, sample: 'https://m.media.../I/91x.jpg' },
  ]);
  const [device, setDevice] = useState<Device>('desktop');
  const [aiMode, setAiMode] = useState(true);
  const [aiModel, setAiModel] = useState('claude-sonnet-4.7');
  const [schema, setSchema] = useState(
    'class Product(BaseModel):\n    title: str\n    price: float\n    author: Optional[str]\n    images: list[HttpUrl]\n    rating: Optional[float] = Field(ge=0, le=5)\n    in_stock: bool'
  );
  const [mode, setMode] = useState<Mode>('recurring');
  const [cron, setCron] = useState('0 */2 * * *');
  const [concurrency, setConcurrency] = useState(8);
  const [retries, setRetries] = useState(3);
  const [triggers, setTriggers] = useState<Record<string, boolean>>({ priceChange: true, stockChange: true, newItem: false, removed: false });
  const [rotation, setRotation] = useState(true);
  const [antibot, setAntibot] = useState<Record<string, boolean>>({ fingerprinting: true, stealth: true, humanLike: true, tlsFingerprint: false });
  const [provider, setProvider] = useState<Provider>('twoCaptcha');
  const [outputs, setOutputs] = useState<Record<string, boolean>>({ webhook: true, s3: true, db: false, sheets: false, airtable: false });
  const [format, setFormat] = useState<Format>('ndjson');
  const [robots, setRobots] = useState(true);
  const [respectRate, setRespectRate] = useState(true);
  const [retention, setRetention] = useState(90);
  const [pii, setPii] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  const active = scrapers.find((s) => s.id === activeId) ?? scrapers[0];
  const filtered = scrapers.filter((s) =>
    (filter === 'all' || s.status === filter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.target.includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (!running) return;
    const lines = [
      `${t('logs.starting')} amazon.com.pe/dp/B08X`, `${t('logs.proxy')} 🇵🇪 residential · 110ms`,
      `${t('logs.request')} /dp/B08X → 200 OK (482ms)`, `${t('logs.parse')} 24 ${t('scrapers.items')}`,
      `${t('logs.request')} /dp/B08X?page=2 → 200 OK (511ms)`, `${t('logs.captcha')} 2Captcha (resolved in 12s)`,
      `${t('logs.retry')} (backoff 1.2s)`, `${t('logs.parse')} 24 ${t('scrapers.items')}`,
      `${t('logs.autofix')}`, `${t('logs.success')} · 248 items · 18.4s`,
    ];
    let i = 0;
    const id = setInterval(() => { setLogs((p) => [...p.slice(-40), lines[i % lines.length]]); i++; }, 700);
    return () => clearInterval(id);
  }, [running, t]);
  useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, [logs]);

  // Sparkline determinista: tabla hardcoded para evitar drift de precisión float entre SSR y cliente
  // (Math.sin/cos no garantiza resultados bit-exact entre Node y navegadores). Mock visual estático.
  const sparkline = useMemo<number[]>(() => [
    68, 81, 92, 87, 74, 58, 44, 36, 32, 38, 51, 66,
    79, 88, 91, 85, 72, 56, 42, 34, 31, 40, 54, 70,
  ], []);

  const TABS: { key: Tab; icon: typeof ChartBarSquareIcon }[] = [
    { key: 'dashboard', icon: ChartBarSquareIcon }, { key: 'builder', icon: CursorArrowRaysIcon },
    { key: 'schedule', icon: ClockIcon }, { key: 'proxies', icon: GlobeAltIcon },
    { key: 'antibot', icon: ShieldCheckIcon }, { key: 'outputs', icon: ArrowsRightLeftIcon },
    { key: 'diff', icon: EyeIcon }, { key: 'monitoring', icon: CommandLineIcon },
    { key: 'cluster', icon: ServerStackIcon }, { key: 'compliance', icon: ScaleIcon },
  ];

  const addField = () => setFields((p) => [...p, {
    id: `f-${Date.now()}`, name: t('builder.fields.sample.rating'),
    selector: '.review-rating .a-icon-alt', type: 'number', required: false, sample: '4.7',
  }]);

  return (
    <div className="min-h-screen bg-secondary-950 text-secondary-100">
      <header className="sticky top-0 z-30 border-b border-secondary-800 bg-secondary-950/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="lg:hidden p-2 rounded-md hover:bg-secondary-800" onClick={() => setSidebarOpen((x) => !x)} aria-label={t('meta.menu')}>
            {sidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-800"><CursorArrowRaysIcon className="h-5 w-5 text-white" /></div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight tracking-tight">{t('meta.title')}</div>
              <div className="text-xs text-secondary-400 hidden sm:block max-w-xl truncate">{t('meta.subtitle')}</div>
            </div>
          </div>
          <div className="flex-1" />
          <Badge variant={ethical ? 'success' : 'outline'} size="sm" className="hidden md:inline-flex cursor-pointer" onClick={() => setEthical((x) => !x)}>
            <ScaleIcon className="h-3.5 w-3.5 mr-1" />{t('meta.ethicalMode')}
          </Badge>
          <Badge variant="danger" size="sm" className="hidden md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse" />{t('meta.live')}
          </Badge>
          <Button size="sm" variant={running ? 'danger' : 'primary'} onClick={() => setRunning((x) => !x)}>
            {running ? <StopIcon className="h-4 w-4 mr-1.5" /> : <PlayIcon className="h-4 w-4 mr-1.5" />}
            {running ? t('actions.running') : t('actions.run')}
          </Button>
        </div>
        <nav className="px-2 pb-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                  tab === key ? 'bg-zinc-100/10 text-zinc-100 border-zinc-400/40' : 'text-secondary-400 hover:text-white hover:bg-secondary-800 border-transparent'
                }`}>
                <Icon className="h-3.5 w-3.5" />{t(`tabs.${key}`)}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-72 shrink-0 border-r border-secondary-800 bg-secondary-900/40 min-h-[calc(100vh-105px)]`}>
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary-400">{t('scrapers.listTitle')}</h2>
              <button className="p-1 rounded hover:bg-secondary-800 text-zinc-300" title={t('actions.newScraper')}><PlusIcon className="h-4 w-4" /></button>
            </div>
            <Input placeholder={t('scrapers.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="!py-1.5 !text-xs bg-secondary-900 border-secondary-700" />
            <div className="flex gap-1 flex-wrap text-[10px]">
              {(['all', 'running', 'idle', 'error'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded-full border ${filter === f ? 'border-zinc-400 text-zinc-100 bg-zinc-100/10' : 'border-secondary-700 text-secondary-400 hover:text-white'}`}>
                  {t(`scrapers.filter${f === 'all' ? 'All' : f === 'running' ? 'Running' : f === 'idle' ? 'Idle' : 'Error'}`)}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {filtered.map((s) => (
                <button key={s.id} onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg border-l-4 transition-colors ${
                    activeId === s.id ? 'bg-zinc-100/5 border-zinc-300 border-y border-r border-y-zinc-400/40 border-r-zinc-400/40' : 'bg-secondary-900/60 border-secondary-800 hover:border-secondary-700'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-white truncate">{s.name}</div>
                    <StatusDot status={s.status} />
                  </div>
                  <div className="text-[11px] text-secondary-400 font-mono truncate">{s.target}</div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-secondary-500">
                    <span>{s.itemsToday.toLocaleString()} {t('scrapers.items')}</span>
                    <span>{s.lastRunMin}m {t('scrapers.lastRun')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-6 space-y-6">
          <section className="rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-800 text-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <CursorArrowRaysIcon className="h-8 w-8 shrink-0 opacity-90" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('meta.title')}</h1>
                <p className="text-lg text-zinc-100/85 mt-2 max-w-3xl">{t('meta.subtitle')}</p>
              </div>
            </div>
          </section>
          {tab === 'dashboard' && <Dashboard sparkline={sparkline} t={t} />}
          {tab === 'builder' && <Builder active={active} fields={fields} setFields={setFields} addField={addField} device={device} setDevice={setDevice} aiMode={aiMode} setAiMode={setAiMode} aiModel={aiModel} setAiModel={setAiModel} schema={schema} setSchema={setSchema} t={t} />}
          {tab === 'schedule' && <Schedule mode={mode} setMode={setMode} cron={cron} setCron={setCron} concurrency={concurrency} setConcurrency={setConcurrency} retries={retries} setRetries={setRetries} triggers={triggers} setTriggers={setTriggers} t={t} />}
          {tab === 'proxies' && <Proxies rotation={rotation} setRotation={setRotation} t={t} />}
          {tab === 'antibot' && <Antibot antibot={antibot} setAntibot={setAntibot} provider={provider} setProvider={setProvider} t={t} />}
          {tab === 'outputs' && <Outputs outputs={outputs} setOutputs={setOutputs} format={format} setFormat={setFormat} t={t} />}
          {tab === 'diff' && <Diff t={t} />}
          {tab === 'monitoring' && <Monitoring logs={logs} running={running} logsRef={logsRef} t={t} />}
          {tab === 'cluster' && <Cluster t={t} />}
          {tab === 'compliance' && <Compliance robots={robots} setRobots={setRobots} respectRate={respectRate} setRespectRate={setRespectRate} retention={retention} setRetention={setRetention} pii={pii} setPii={setPii} t={t} />}
        </main>
      </div>
    </div>
  );
}
