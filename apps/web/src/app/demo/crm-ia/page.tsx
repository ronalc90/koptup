'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import AssistantView from './components/AssistantView';
import ConversationsView from './components/ConversationsView';
import Customer360Modal from './components/Customer360Modal';
import ForecastView from './components/ForecastView';
import SequencesView from './components/SequencesView';
import { CONTACTS } from './components/mockData';
import {
  Contact,
  ScoreTier,
  StageId,
  formatCurrency,
  scoreTier,
} from './components/types';

type TabId = 'pipeline' | 'contacts' | 'forecast' | 'assistant' | 'conversations' | 'sequences';

const STAGES: StageId[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed'];

const SCORE_VARIANT: Record<ScoreTier, 'danger' | 'warning' | 'info'> = {
  hot: 'danger',
  warm: 'warning',
  cold: 'info',
};

export default function CrmAiDemoPage() {
  const t = useTranslations('demoCrm');

  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | ScoreTier>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const metrics = useMemo(() => {
    const active = CONTACTS.filter((c) => c.stage !== 'closed');
    const pipelineValue = active.reduce(
      (sum, c) => sum + (c.dealValue * c.probability) / 100,
      0,
    );
    const wins = CONTACTS.filter((c) => c.stage === 'closed').length;
    const winRate = Math.round((wins / CONTACTS.length) * 100);
    return {
      activeDeals: active.length,
      pipelineValue,
      winRate,
      avgCycle: 42,
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return CONTACTS.filter((c) => {
      if (term) {
        const haystack = `${c.name} ${c.company} ${c.email}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (scoreFilter !== 'all' && scoreTier(c.score) !== scoreFilter) return false;
      return true;
    });
  }, [search, scoreFilter]);

  const dealsByStage = useMemo(() => {
    const map = new Map<StageId, Contact[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const c of CONTACTS) map.get(c.stage)?.push(c);
    return map;
  }, []);

  const stageValue = (stage: StageId) =>
    (dealsByStage.get(stage) ?? []).reduce((sum, c) => sum + c.dealValue, 0);

  const tabs: { id: TabId; label: string; icon: typeof ChartBarIcon }[] = [
    { id: 'pipeline', label: t('tabs.pipeline'), icon: Squares2X2Icon },
    { id: 'contacts', label: t('tabs.contacts'), icon: UserGroupIcon },
    { id: 'forecast', label: t('tabs.forecast'), icon: ChartBarIcon },
    { id: 'assistant', label: t('tabs.assistant'), icon: SparklesIcon },
    { id: 'conversations', label: t('tabs.conversations'), icon: PhoneIcon },
    { id: 'sequences', label: t('tabs.sequences'), icon: BoltIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-secondary-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-10 shadow-lg mb-8 sm:mb-12 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" aria-hidden="true" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">
              {t('pageTitle')}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-indigo-100 max-w-3xl mx-auto px-2">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard
            icon={BriefcaseIcon}
            label={t('metrics.dealsActive')}
            value={metrics.activeDeals.toString()}
            sub={t('metrics.dealsActiveSub')}
            trend={{ direction: 'up', value: '+12%', label: t('metrics.trendUp') }}
            tone="primary"
          />
          <MetricCard
            icon={CurrencyDollarIcon}
            label={t('metrics.pipelineValue')}
            value={formatCurrency(metrics.pipelineValue)}
            sub={t('metrics.pipelineValueSub')}
            trend={{ direction: 'up', value: '+8.4%', label: t('metrics.trendUp') }}
            tone="success"
          />
          <MetricCard
            icon={ChartBarIcon}
            label={t('metrics.winRate')}
            value={`${metrics.winRate}%`}
            sub={t('metrics.winRateSub')}
            trend={{ direction: 'up', value: '+3.1pp', label: t('metrics.trendUp') }}
            tone="warning"
          />
          <MetricCard
            icon={ClockIcon}
            label={t('metrics.avgCycle')}
            value={`${metrics.avgCycle}`}
            sub={t('metrics.avgCycleSub')}
            trend={{ direction: 'down', value: '-4d', label: t('metrics.trendDown') }}
            tone="info"
          />
        </div>

        {/* Tabs */}
        <Card variant="elevated" className="shadow-xl overflow-hidden">
          <CardHeader>
            <div className="flex border-b border-secondary-200 dark:border-secondary-700 overflow-x-auto -mx-6 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      active
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {activeTab === 'pipeline' && (
              <PipelineBoard
                dealsByStage={dealsByStage}
                stageValue={stageValue}
                onSelect={setSelectedContact}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsTable
                contacts={filteredContacts}
                search={search}
                onSearch={setSearch}
                scoreFilter={scoreFilter}
                onScoreFilter={setScoreFilter}
                onSelect={setSelectedContact}
              />
            )}

            {activeTab === 'forecast' && <ForecastView />}
            {activeTab === 'assistant' && <AssistantView />}
            {activeTab === 'conversations' && <ConversationsView />}
            {activeTab === 'sequences' && <SequencesView />}
          </CardContent>
        </Card>
      </div>

      {selectedContact && (
        <Customer360Modal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components defined within the page (small enough to keep here)
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: typeof ChartBarIcon;
  label: string;
  value: string;
  sub: string;
  trend: { direction: 'up' | 'down'; value: string; label: string };
  tone: 'primary' | 'success' | 'warning' | 'info';
}

function MetricCard({ icon: Icon, label, value, sub, trend, tone }: MetricCardProps) {
  const toneClass: Record<MetricCardProps['tone'], string> = {
    primary: 'text-primary-600 bg-primary-100 dark:bg-primary-950 dark:text-primary-400',
    success: 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400',
    warning: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
    info: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
  };
  const TrendIcon = trend.direction === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const trendColor =
    trend.direction === 'up'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <Card variant="bordered" className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneClass[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.value}
          </div>
        </div>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
        <p className="text-xs text-secondary-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

interface PipelineBoardProps {
  dealsByStage: Map<StageId, Contact[]>;
  stageValue: (stage: StageId) => number;
  onSelect: (c: Contact) => void;
}

function PipelineBoard({ dealsByStage, stageValue, onSelect }: PipelineBoardProps) {
  const t = useTranslations('demoCrm');
  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('pipeline.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('pipeline.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {STAGES.map((stage) => {
          const deals = dealsByStage.get(stage) ?? [];
          const total = stageValue(stage);
          return (
            <div
              key={stage}
              className="rounded-xl bg-secondary-50 dark:bg-secondary-900/60 border border-secondary-200 dark:border-secondary-800 p-3 flex flex-col"
            >
              <div className="mb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">
                    {t(`pipeline.stages.${stage}`)}
                  </p>
                  <Badge variant="outline" size="sm">
                    {deals.length}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-500">{formatCurrency(total)}</p>
              </div>

              <div className="space-y-2 flex-1 min-h-[120px]">
                {deals.length === 0 ? (
                  <div className="text-center py-6 text-xs text-secondary-400 italic">
                    {t('pipeline.emptyStage')}
                  </div>
                ) : (
                  deals.map((deal) => {
                    const tier = scoreTier(deal.score);
                    return (
                      <button
                        key={deal.id}
                        onClick={() => onSelect(deal)}
                        className="w-full text-left p-3 rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <p className="font-medium text-sm text-secondary-900 dark:text-white truncate">
                            {deal.company}
                          </p>
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                              tier === 'hot'
                                ? 'bg-red-500'
                                : tier === 'warm'
                                ? 'bg-yellow-500'
                                : 'bg-blue-400'
                            }`}
                            aria-hidden
                          />
                        </div>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate mb-2">
                          {deal.name}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(deal.dealValue)}
                          </span>
                          <span className="text-secondary-500">{deal.probability}%</span>
                        </div>
                        <div className="mt-2 h-1 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 dark:bg-primary-400 transition-all"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 py-2 border border-dashed border-secondary-300 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-lg transition-colors">
                <PlusIcon className="h-4 w-4" />
                {t('pipeline.addDeal')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ContactsTableProps {
  contacts: Contact[];
  search: string;
  onSearch: (v: string) => void;
  scoreFilter: 'all' | ScoreTier;
  onScoreFilter: (f: 'all' | ScoreTier) => void;
  onSelect: (c: Contact) => void;
}

function ContactsTable({
  contacts,
  search,
  onSearch,
  scoreFilter,
  onScoreFilter,
  onSelect,
}: ContactsTableProps) {
  const t = useTranslations('demoCrm');
  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('contacts.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('contacts.subtitle')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('contacts.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onScoreFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                scoreFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              {t(`contacts.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-secondary-500 mb-3">
        {t('contacts.results', { count: contacts.length })}
      </p>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-800">
        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-800">
          <thead className="bg-secondary-50 dark:bg-secondary-900/60">
            <tr>
              {(['name', 'company', 'score', 'dealValue', 'nextAction', 'lastContact', 'actions'] as const).map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                  >
                    {t(`contacts.columns.${col}`)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800 bg-white dark:bg-secondary-900">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-secondary-500">
                  {t('contacts.noResults')}
                </td>
              </tr>
            ) : (
              contacts.map((c) => {
                const tier = scoreTier(c.score);
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-secondary-50 dark:hover:bg-secondary-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-secondary-900 dark:text-white text-sm truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-secondary-500 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-300">
                      {c.company}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-secondary-900 dark:text-white">
                          {c.score}
                        </span>
                        <Badge variant={SCORE_VARIANT[tier]} size="sm">
                          {t(`contacts.scoreLabels.${tier}`)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                      {formatCurrency(c.dealValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-300">
                      {c.nextAction}
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary-500 whitespace-nowrap">
                      {c.lastContact}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => onSelect(c)}>
                        {t('contacts.viewProfile')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-sm text-secondary-500">
            {t('contacts.noResults')}
          </div>
        ) : (
          contacts.map((c) => {
            const tier = scoreTier(c.score);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left p-4 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-secondary-900 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold text-secondary-900 dark:text-white truncate">
                        {c.name}
                      </p>
                      <Badge variant={SCORE_VARIANT[tier]} size="sm">
                        {c.score}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-500 truncate">{c.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(c.dealValue)}
                      </span>
                      <span className="text-xs text-secondary-500 truncate ml-2">
                        {c.nextAction}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
