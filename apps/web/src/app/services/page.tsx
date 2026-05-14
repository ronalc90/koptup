'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  LifebuoyIcon,
  AcademicCapIcon,
  HeartIcon,
  DocumentCheckIcon,
  TruckIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  BoltIcon,
  Squares2X2Icon,
  MicrophoneIcon,
  PencilIcon,
  GlobeAltIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  MapIcon,
  StarIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
  CloudArrowDownIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import {
  SERVICES,
  PLANS,
  formatCOP,
  slugToNamespace,
  slugToPlanNamespace,
  type ServiceCategory,
  type ServiceOffering,
  type SaasOffering,
  type ServicePlan,
  type SaasPlan,
} from '@/lib/services-catalog';

type Mode = 'services' | 'plans';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  LifebuoyIcon,
  AcademicCapIcon,
  HeartIcon,
  DocumentCheckIcon,
  TruckIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  BoltIcon,
  Squares2X2Icon,
  MicrophoneIcon,
  PencilIcon,
  GlobeAltIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  MapIcon,
  StarIcon,
  CheckBadgeIcon,
};

const CATEGORIES: (ServiceCategory | 'all')[] = [
  'all',
  'sales',
  'finance',
  'operations',
  'productivity',
  'aiPlatform',
  'security',
  'healthcare',
  'education',
  'commerce',
  'support',
  'devTools',
  'voice',
  'data',
  'engagement',
];

/* -------------------------------------------------------------------------- */
/* Card components                                                            */
/* -------------------------------------------------------------------------- */

interface ServiceCardProps {
  offering: ServiceOffering;
  onOpen: (slug: string) => void;
}

function ServiceCard({ offering, onOpen }: ServiceCardProps) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const inicial = offering.plans[0];

  return (
    <Card
      variant="bordered"
      padding="none"
      className="overflow-hidden hover:shadow-large transition-all hover:-translate-y-0.5"
    >
      <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
              {t('categoryLabel')}
            </Badge>
            <h3 className="text-xl font-bold leading-tight">{t('name')}</h3>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">
          {t('tagline')}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-3">
          {t('description')}
        </p>

        <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 bg-secondary-50 dark:bg-secondary-900/40">
          <div className="flex items-start gap-2 mb-2">
            <CodeBracketIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary-700 dark:text-secondary-300">
              {tp('service.ownership')}
            </p>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('card.fromPrice')}
              </p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCOP(inicial.setupCOP)}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('service.setupLabel')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                + {formatCOP(inicial.monthlyCOP)}
                {tp('card.perMonth')}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('service.monthlyOptional')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" fullWidth onClick={() => onOpen(offering.slug)}>
            {tp('card.viewDetails')}
          </Button>
          {offering.demoSlug && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/demo/${offering.demoSlug}`}>{tp('card.viewDemo')}</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface PlanCardProps {
  offering: SaasOffering;
  onOpen: (slug: string) => void;
}

function PlanCard({ offering, onOpen }: PlanCardProps) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const starter = offering.plans[0];

  return (
    <Card
      variant="bordered"
      padding="none"
      className="overflow-hidden hover:shadow-large transition-all hover:-translate-y-0.5"
    >
      <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
              {t('categoryLabel')}
            </Badge>
            <h3 className="text-xl font-bold leading-tight">{t('name')}</h3>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">
          {t('tagline')}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-3">
          {t('description')}
        </p>

        <div className="rounded-lg border border-primary-200 dark:border-primary-700 p-3 bg-primary-50 dark:bg-primary-950/40">
          <div className="flex items-start gap-2 mb-2">
            <CloudArrowDownIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary-700 dark:text-secondary-300">
              {tp('plan.noOwnership')}
            </p>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('card.fromPrice')}
              </p>
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {formatCOP(starter.monthlyCOP)}
                <span className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                  {tp('plan.monthly')}
                </span>
              </p>
            </div>
            {starter.setupCOP > 0 && (
              <div className="text-right">
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  + {formatCOP(starter.setupCOP)}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {tp('plan.setupOnce')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" fullWidth onClick={() => onOpen(offering.slug)}>
            {tp('card.viewDetails')}
          </Button>
          {offering.demoSlug && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/demo/${offering.demoSlug}`}>{tp('card.viewDemo')}</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal components                                                           */
/* -------------------------------------------------------------------------- */

interface ServiceModalProps {
  offering: ServiceOffering;
  onClose: () => void;
}

function ServiceModal({ offering, onClose }: ServiceModalProps) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-secondary-900 rounded-2xl max-w-5xl w-full my-8 shadow-2xl"
      >
        <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white rounded-t-2xl`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
                {t('categoryLabel')}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{t('name')}</h2>
              <p className="mt-2 text-white/85">{t('tagline')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tp('modal.close')}
              className="rounded-full bg-white/15 hover:bg-white/25 p-2 text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-secondary-700 dark:text-secondary-300">{t('description')}</p>

          <div className="rounded-lg border border-primary-200 dark:border-primary-800 p-4 bg-primary-50 dark:bg-primary-950/30 flex items-start gap-3">
            <CodeBracketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary-800 dark:text-secondary-200">
              {tp('service.ownership')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offering.plans.map((plan) => (
              <ServicePlanColumn key={plan.tier} offering={offering} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicePlanColumn({
  offering,
  plan,
}: {
  offering: ServiceOffering;
  plan: ServicePlan;
}) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const tierKey = plan.tier; // 'inicial' | 'profesional' | 'enterprise'
  const tierLabel = tp(`service.tier${tierKey.charAt(0).toUpperCase()}${tierKey.slice(1)}`);
  const incluye = t.raw(`plans.${tierKey}.incluye`) as string[];
  const setupIncluye = t.raw(`plans.${tierKey}.setupIncluye`) as string[];
  const mantIncluye = t.raw(`plans.${tierKey}.mantenimientoIncluye`) as string[];
  const isPro = plan.tier === 'profesional';

  return (
    <Card
      variant="bordered"
      padding="md"
      className={isPro ? 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500/30' : ''}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{tierLabel}</h3>
        {isPro && (
          <Badge variant="primary" size="sm">
            {tp('tier.recommended')}
          </Badge>
        )}
      </div>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
        {t(`plans.${tierKey}.description`)}
      </p>
      <div className="mb-3">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          {tp('service.setupLabel')}
        </p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-white">
          {formatCOP(plan.setupCOP)}
        </p>
      </div>
      <div className="mb-3">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          {tp('service.monthlyOptional')}
        </p>
        <p className="text-base font-semibold text-secondary-800 dark:text-secondary-200">
          {formatCOP(plan.monthlyCOP)}
          <span className="text-xs font-normal text-secondary-500 dark:text-secondary-400">
            {tp('card.perMonth')}
          </span>
        </p>
      </div>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
        {tp('service.deliveryTime')}: {plan.duracionSemanas.min}-{plan.duracionSemanas.max}{' '}
        {tp('service.weeks')}
      </p>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white mb-1">
            {tp('modal.incluye')}
          </p>
          <ul className="space-y-1">
            {incluye.map((item, i) => (
              <li key={i} className="flex gap-1.5 text-secondary-700 dark:text-secondary-300">
                <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white mb-1">
            {tp('modal.setupIncluye')}
          </p>
          <ul className="space-y-1">
            {setupIncluye.map((item, i) => (
              <li key={i} className="flex gap-1.5 text-secondary-700 dark:text-secondary-300">
                <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white mb-1">
            {tp('modal.mantenimientoIncluye')}
          </p>
          <ul className="space-y-1">
            {mantIncluye.map((item, i) => (
              <li key={i} className="flex gap-1.5 text-secondary-700 dark:text-secondary-300">
                <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {tp('modal.idealPara')}
          </p>
          <p className="text-xs text-secondary-700 dark:text-secondary-300">
            {t(`plans.${tierKey}.idealPara`)}
          </p>
        </div>
      </div>
      <Button size="sm" fullWidth className="mt-3" asChild>
        <Link href="/contact">{tp('modal.quote')}</Link>
      </Button>
    </Card>
  );
}

interface PlanModalProps {
  offering: SaasOffering;
  onClose: () => void;
}

function PlanModal({ offering, onClose }: PlanModalProps) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-secondary-900 rounded-2xl max-w-5xl w-full my-8 shadow-2xl"
      >
        <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white rounded-t-2xl`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
                {t('categoryLabel')}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{t('name')}</h2>
              <p className="mt-2 text-white/85">{t('tagline')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tp('modal.close')}
              className="rounded-full bg-white/15 hover:bg-white/25 p-2 text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-secondary-700 dark:text-secondary-300">{t('description')}</p>

          <div className="rounded-lg border border-primary-200 dark:border-primary-800 p-4 bg-primary-50 dark:bg-primary-950/30 flex items-start gap-3">
            <CloudArrowDownIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary-800 dark:text-secondary-200">
              {tp('plan.noOwnership')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offering.plans.map((plan) => (
              <SaasPlanColumn key={plan.tier} offering={offering} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SaasPlanColumn({ offering, plan }: { offering: SaasOffering; plan: SaasPlan }) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const tierKey = plan.tier; // 'starter' | 'growth' | 'business'
  const tierLabel = tp(`plan.tier${tierKey.charAt(0).toUpperCase()}${tierKey.slice(1)}`);
  const incluye = t.raw(`plans.${tierKey}.incluye`) as string[];
  const isGrowth = plan.tier === 'growth';

  return (
    <Card
      variant="bordered"
      padding="md"
      className={
        isGrowth ? 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500/30' : ''
      }
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{tierLabel}</h3>
        {isGrowth && (
          <Badge variant="primary" size="sm">
            {tp('tier.recommended')}
          </Badge>
        )}
      </div>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
        {t(`plans.${tierKey}.tagline`)}
      </p>
      <div className="mb-3">
        <p className="text-3xl font-extrabold text-primary-700 dark:text-primary-300">
          {formatCOP(plan.monthlyCOP)}
          <span className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
            {tp('plan.monthly')}
          </span>
        </p>
        {plan.setupCOP > 0 && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
            + {formatCOP(plan.setupCOP)} {tp('plan.setupOnce').toLowerCase()}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="success" size="sm">
          {tp('plan.semestralBadge')}
        </Badge>
        <Badge variant="info" size="sm">
          {tp('plan.annualBadge')}
        </Badge>
      </div>
      <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-1">
        {tp('modal.incluye')}
      </p>
      <ul className="space-y-1 mb-3">
        {incluye.map((item, i) => (
          <li key={i} className="flex gap-1.5 text-secondary-700 dark:text-secondary-300">
            <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs">{item}</span>
          </li>
        ))}
      </ul>
      <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700 mb-3">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          {tp('modal.idealPara')}
        </p>
        <p className="text-xs text-secondary-700 dark:text-secondary-300">
          {t(`plans.${tierKey}.idealPara`)}
        </p>
      </div>
      <Button size="sm" fullWidth asChild>
        <Link href="/contact">{tp('modal.quote')}</Link>
      </Button>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ServicesPage() {
  const t = useTranslations('servicesCatalog');
  const [mode, setMode] = useState<Mode>('services');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // Close modal when switching mode
  useEffect(() => {
    setOpenSlug(null);
  }, [mode]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (openSlug) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [openSlug]);

  // ESC closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSlug(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (!q) return true;
      return s.slug.toLowerCase().includes(q);
    });
  }, [query, category]);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return p.slug.toLowerCase().includes(q);
    });
  }, [query, category]);

  const openService = mode === 'services' ? SERVICES.find((s) => s.slug === openSlug) : undefined;
  const openPlan = mode === 'plans' ? PLANS.find((p) => p.slug === openSlug) : undefined;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{t('hero.title')}</h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div
              role="tablist"
              aria-label={t('hero.title')}
              className="inline-flex rounded-xl bg-secondary-100 dark:bg-secondary-900 p-1 self-start sm:self-auto"
            >
              <button
                role="tab"
                type="button"
                aria-selected={mode === 'services'}
                onClick={() => setMode('services')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  mode === 'services'
                    ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-white shadow'
                    : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <CodeBracketIcon className="h-4 w-4" />
                {t('tabs.services')}
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={mode === 'plans'}
                onClick={() => setMode('plans')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  mode === 'plans'
                    ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-white shadow'
                    : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <CloudArrowDownIcon className="h-4 w-4" />
                {t('tabs.plans')}
              </button>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search')}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Intro per tab */}
      <section className="bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              variant={mode === 'services' ? 'elevated' : 'bordered'}
              padding="md"
              className={mode === 'services' ? 'ring-2 ring-primary-500/40' : ''}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <CodeBracketIcon className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">
                    {t('servicesIntro.title')}
                  </h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('servicesIntro.body')}
                  </p>
                </div>
              </div>
            </Card>
            <Card
              variant={mode === 'plans' ? 'elevated' : 'bordered'}
              padding="md"
              className={mode === 'plans' ? 'ring-2 ring-primary-500/40' : ''}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <CloudArrowDownIcon className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">
                    {t('plansIntro.title')}
                  </h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('plansIntro.body')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  category === cat
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400'
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {mode === 'services' ? (
            filteredServices.length === 0 ? (
              <p className="text-center text-secondary-600 dark:text-secondary-400 py-12">
                {t('noResults')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((s) => (
                  <ServiceCard key={s.slug} offering={s} onOpen={setOpenSlug} />
                ))}
              </div>
            )
          ) : filteredPlans.length === 0 ? (
            <p className="text-center text-secondary-600 dark:text-secondary-400 py-12">
              {t('noResults')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((p) => (
                <PlanCard key={p.slug} offering={p} onOpen={setOpenSlug} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <CursorArrowRaysIcon className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('ctaTitle')}</h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">{t('ctaBody')}</p>
          <Button size="lg" variant="outline" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
            <Link href="/contact">{t('ctaButton')}</Link>
          </Button>
        </div>
      </section>

      {/* Modal */}
      {openService && <ServiceModal offering={openService} onClose={() => setOpenSlug(null)} />}
      {openPlan && <PlanModal offering={openPlan} onClose={() => setOpenSlug(null)} />}
    </>
  );
}
