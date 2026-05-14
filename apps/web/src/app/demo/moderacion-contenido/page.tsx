'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  QueueListIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  HandRaisedIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  CodeBracketIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  HeartIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';

import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

import {
  QUEUE_ITEMS,
  DEFAULT_RULES,
  TRANSPARENCY_BY_CATEGORY,
  TRANSPARENCY_BY_MONTH,
  CATEGORY_COLORS,
  VERTICAL_RULES,
  type QueueItem,
  type ContentType,
  type Vertical,
  type RuleNode,
} from './components/mockData';
import { BarChart, MetricCard } from './components/Atoms';
import QueueTab from './components/QueueTab';
import WorkflowsTab from './components/WorkflowsTab';
import {
  ClassifiersTab,
  AppealsTab,
  AuditTab,
  TransparencyTab,
  MetricsTab,
  ApiTab,
} from './components/ReportTabs';

type TabKey =
  | 'dashboard'
  | 'queue'
  | 'classifiers'
  | 'workflows'
  | 'appeals'
  | 'audit'
  | 'transparency'
  | 'api'
  | 'metrics';

const TAB_ICONS: Record<TabKey, typeof ChartBarIcon> = {
  dashboard: ChartBarIcon,
  queue: QueueListIcon,
  classifiers: CpuChipIcon,
  workflows: AdjustmentsHorizontalIcon,
  appeals: HandRaisedIcon,
  audit: ClipboardDocumentListIcon,
  transparency: PresentationChartLineIcon,
  api: CodeBracketIcon,
  metrics: CheckBadgeIcon,
};

const TABS: TabKey[] = [
  'dashboard',
  'queue',
  'classifiers',
  'workflows',
  'appeals',
  'audit',
  'transparency',
  'metrics',
  'api',
];

export default function ModeracionContenidoPage() {
  const t = useTranslations('demoModeration');

  const [tab, setTab] = useState<TabKey>('dashboard');
  const [vertical, setVertical] = useState<Vertical>('social');

  // Queue state (shared with QueueTab)
  const [items, setItems] = useState<QueueItem[]>(QUEUE_ITEMS);
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(QUEUE_ITEMS[0]?.id ?? null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Workflows state (shared with WorkflowsTab)
  const [rules, setRules] = useState<RuleNode[]>(DEFAULT_RULES);

  const filteredItems = useMemo(() => {
    const allowed = VERTICAL_RULES[vertical];
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return items
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .filter((it) => allowed.includes(it.category))
      .sort((a, b) => order[a.priority] - order[b.priority]);
  }, [items, typeFilter, vertical]);

  const selected = useMemo(
    () => filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId]
  );

  const toggleReveal = (id: string) =>
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resolveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/demo">
            <Button variant="ghost" className="mb-4">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {t('backToCatalog')}
            </Button>
          </Link>

          <section className="rounded-2xl bg-gradient-to-br from-red-700 to-red-900 text-white p-6 md:p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {t('pageTitle')}
                </h1>
                <p className="text-lg text-red-50/90 max-w-3xl">
                  {t('pageSubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-3 py-1.5 bg-white/15 text-white rounded-full text-sm font-medium backdrop-blur">
                  {t('status')}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs uppercase tracking-wide text-red-100/80">
                    {t('verticals.label')}
                  </label>
                  <select
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value as Vertical)}
                    className="rounded-lg border border-white/30 bg-white/10 text-white text-sm px-3 py-1.5 backdrop-blur"
                  >
                    {(['social', 'gaming', 'dating', 'kids', 'finance'] as Vertical[]).map((v) => (
                      <option key={v} value={v} className="text-secondary-900">
                        {t(`verticals.${v}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Wellness banner */}
        <Card
          variant="bordered"
          padding="md"
          className="mb-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {t('wellness.title')}
                </p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-200/80 mt-0.5">
                  {t('wellness.message')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                    {t('wellness.nextBreak')}: 00:12:30
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                    {t('wellness.categoryRotation')}: spam → hate
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                    {t('wellness.blurByDefault')}: on
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500 text-emerald-700 dark:text-emerald-200"
              >
                <PauseCircleIcon className="h-5 w-5 mr-1" />
                {t('wellness.takeBreak')}
              </Button>
              <Button variant="ghost" size="sm" className="text-emerald-700 dark:text-emerald-200">
                {t('wellness.mentalHealthCheck')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6 border-b border-secondary-200 dark:border-secondary-800 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tk) => {
              const Icon = TAB_ICONS[tk];
              const active = tab === tk;
              return (
                <button
                  key={tk}
                  onClick={() => setTab(tk)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${
                    active
                      ? 'border-red-600 text-red-700 dark:text-red-300 bg-red-50/60 dark:bg-red-950/40'
                      : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(`tabs.${tk}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compliance */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mr-1">
            {t('compliance.title')}:
          </span>
          {(['dsa', 'coppa', 'gdpr', 'lgpd', 'localLaws', 'auditReady'] as const).map((k) => (
            <Badge key={k} variant="info" size="sm">
              <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
              {t(`compliance.${k}`)}
            </Badge>
          ))}
        </div>

        {/* ----- Tab content ----- */}
        {tab === 'dashboard' && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                {t('dashboard.title')}
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {t('dashboard.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard label={t('dashboard.moderatedToday')} value="38,412" trend="+8.2%" up />
              <MetricCard
                label={t('dashboard.queueNow')}
                value={`${filteredItems.length}`}
                trend="-12"
                up={false}
              />
              <MetricCard label={t('dashboard.accuracy')} value="95.4 / 91.2" trend="+0.4 pp" up />
              <MetricCard label={t('dashboard.avgTime')} value="34s" trend="-6s" up />
              <MetricCard label={t('dashboard.fpr')} value="1.3%" trend="-0.2 pp" up />
              <MetricCard label={t('dashboard.autoActioned')} value="71%" trend="+3 pp" up />
              <MetricCard label={t('dashboard.humanReviewed')} value="26%" />
              <MetricCard label={t('dashboard.sla')} value="98.7%" trend="+0.5 pp" up />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card variant="bordered" padding="md" className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">{t('transparency.byMonth')}</CardTitle>
                </CardHeader>
                <BarChart
                  data={TRANSPARENCY_BY_MONTH.map((m) => ({ label: m.month, value: m.takedowns }))}
                />
              </Card>

              <Card variant="bordered" padding="md">
                <CardHeader>
                  <CardTitle className="text-lg">{t('transparency.byCategory')}</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {TRANSPARENCY_BY_CATEGORY.slice(0, 6).map((c) => (
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
          </section>
        )}

        {tab === 'queue' && (
          <QueueTab
            items={filteredItems}
            selected={selected}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            revealedIds={revealedIds}
            toggleReveal={toggleReveal}
            resolveItem={resolveItem}
          />
        )}

        {tab === 'classifiers' && <ClassifiersTab />}
        {tab === 'workflows' && <WorkflowsTab rules={rules} setRules={setRules} />}
        {tab === 'appeals' && <AppealsTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'transparency' && <TransparencyTab />}
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'api' && <ApiTab />}
      </div>
    </div>
  );
}
