'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
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
  CurrencyDollarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  BanknotesIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import {
  SERVICES,
  PLANS,
  formatCOP,
  slugToNamespace,
  slugToPlanNamespace,
  type ServiceOffering,
  type SaasOffering,
  type ServicePlan,
  type SaasPlan,
  type ResourceLimits,
  type CostoAdicional,
  type IntegrationLevel,
  type UnlimitedOrNumber,
} from '@/lib/services-catalog';

type Mode = 'plans' | 'services';

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

/* -------------------------------------------------------------------------- */
/* Helpers compartidos                                                        */
/* -------------------------------------------------------------------------- */

function formatLimit(
  value: UnlimitedOrNumber,
  unlimitedLabel: string,
  notApplicableLabel: string,
): string {
  if (value === 'unlimited') return unlimitedLabel;
  if (value === 0) return notApplicableLabel;
  return new Intl.NumberFormat('es-CO').format(value);
}

function LimitsTable({ limits }: { limits: ResourceLimits }) {
  const tp = useTranslations('servicesCatalog');
  const u = tp('modal.limitsUnlimited');
  const na = tp('modal.limitsNotApplicable');
  const slaLabel = tp(`modal.supportSLA.${limits.supportSLA}`);
  const storage =
    limits.storageGB === 'unlimited'
      ? u
      : limits.storageGB === 0
      ? na
      : `${new Intl.NumberFormat('es-CO').format(limits.storageGB)} GB`;

  const rows: { label: string; value: string }[] = [
    { label: tp('modal.limitsAdminUsers'), value: formatLimit(limits.adminUsers, u, na) },
    { label: tp('modal.limitsEndUsers'), value: formatLimit(limits.endUsers, u, na) },
    { label: tp('modal.limitsAccounts'), value: formatLimit(limits.accounts, u, na) },
    { label: tp('modal.limitsVolume'), value: limits.volumeLabel },
    { label: tp('modal.limitsStorage'), value: storage },
    { label: tp('modal.limitsSupport'), value: slaLabel },
  ];

  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 0 ? 'bg-secondary-50 dark:bg-secondary-900/40' : ''}
            >
              <td className="px-3 py-2 text-secondary-600 dark:text-secondary-400 font-medium w-1/2">
                {row.label}
              </td>
              <td className="px-3 py-2 text-secondary-900 dark:text-white">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntegrationsBlock({ integraciones }: { integraciones: IntegrationLevel }) {
  const tp = useTranslations('servicesCatalog');
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <PuzzlePieceIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <p className="font-semibold text-secondary-900 dark:text-white text-sm">
          {tp('modal.integrationsTitle')}
        </p>
        <Badge variant="info" size="sm">
          {integraciones.nombre}
        </Badge>
      </div>
      <ul className="space-y-1">
        {integraciones.items.map((item, i) => (
          <li
            key={`${item}-${i}`}
            className="flex gap-1.5 text-secondary-700 dark:text-secondary-300"
          >
            <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CostsTable({
  costos,
  variant,
}: {
  costos: CostoAdicional[];
  variant: 'service' | 'plan';
}) {
  const tp = useTranslations('servicesCatalog');
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BanknotesIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="font-semibold text-secondary-900 dark:text-white text-sm">
          {tp('modal.costsTitle')}
        </p>
      </div>
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden mb-2">
        <table className="w-full text-xs">
          <thead className="bg-amber-50 dark:bg-amber-950/40">
            <tr>
              <th className="px-2 py-1.5 text-left text-amber-900 dark:text-amber-200 font-semibold">
                {tp('modal.costsResource')}
              </th>
              <th className="px-2 py-1.5 text-left text-amber-900 dark:text-amber-200 font-semibold whitespace-nowrap">
                {tp('modal.costsEstimate')}
              </th>
              <th className="px-2 py-1.5 text-left text-amber-900 dark:text-amber-200 font-semibold">
                {tp('modal.costsDetail')}
              </th>
            </tr>
          </thead>
          <tbody>
            {costos.map((c, i) => (
              <tr
                key={`${c.recurso}-${i}`}
                className="border-t border-amber-100 dark:border-amber-900"
              >
                <td className="px-2 py-1.5 text-secondary-900 dark:text-white font-medium align-top">
                  <div className="flex flex-col gap-0.5">
                    <span>{c.recurso}</span>
                    <Badge
                      variant={c.facturadoPor === 'cliente' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {c.facturadoPor === 'cliente'
                        ? tp('modal.costsBilledByClient')
                        : tp('modal.costsBilledByKoptup')}
                    </Badge>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-amber-900 dark:text-amber-200 font-mono whitespace-nowrap align-top">
                  {c.estimadoUSD}
                </td>
                <td className="px-2 py-1.5 text-secondary-700 dark:text-secondary-300 align-top">
                  {c.detalle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-amber-800 dark:text-amber-300 italic flex items-start gap-1.5">
        <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>
          {variant === 'service' ? tp('modal.costsNote') : tp('modal.costsNoteSaas')}
        </span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

function PlanCard({
  offering,
  onOpen,
}: {
  offering: SaasOffering;
  onOpen: (slug: string) => void;
}) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const starter = offering.plans[0];

  return (
    <Card
      variant="bordered"
      padding="none"
      className="overflow-hidden hover:shadow-large transition-all hover:-translate-y-0.5 flex flex-col"
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

      <div className="p-6 space-y-4 flex-1 flex flex-col">
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
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {formatCOP(starter.monthlyCOP)}
            <span className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
              {tp('plan.monthly')}
            </span>
          </p>
          {starter.setupCOP > 0 && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              + {formatCOP(starter.setupCOP)} {tp('plan.setupOnce').toLowerCase()}
            </p>
          )}
        </div>

        {starter.limits && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            <strong>{tp('modal.limitsVolume')}:</strong> {starter.limits.volumeLabel}
          </p>
        )}

        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{t('costoNote')}</span>
        </div>

        <div className="flex gap-2 pt-2 mt-auto">
          <Button size="sm" fullWidth onClick={() => onOpen(offering.slug)}>
            <InformationCircleIcon className="h-4 w-4 mr-1" />
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

function ServiceCard({
  offering,
  onOpen,
}: {
  offering: ServiceOffering;
  onOpen: (slug: string) => void;
}) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const inicial = offering.plans[0];

  return (
    <Card
      variant="bordered"
      padding="none"
      className="overflow-hidden hover:shadow-large transition-all hover:-translate-y-0.5 flex flex-col"
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

      <div className="p-6 space-y-4 flex-1 flex flex-col">
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

        {inicial.limits && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            <strong>{tp('modal.limitsVolume')}:</strong> {inicial.limits.volumeLabel}
          </p>
        )}

        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{t('costoNote')}</span>
        </div>

        <div className="flex gap-2 pt-2 mt-auto">
          <Button size="sm" fullWidth onClick={() => onOpen(offering.slug)}>
            <InformationCircleIcon className="h-4 w-4 mr-1" />
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
/* Modales                                                                     */
/* -------------------------------------------------------------------------- */

function PlanModal({ offering, onClose }: { offering: SaasOffering; onClose: () => void }) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const [activeTier, setActiveTier] = useState<'starter' | 'growth' | 'business'>('growth');
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const activePlan = offering.plans.find((p) => p.tier === activeTier) ?? offering.plans[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-secondary-900 sm:rounded-2xl max-w-5xl w-full sm:my-8 shadow-2xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col"
      >
        <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white sm:rounded-t-2xl`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
                  {t('categoryLabel')}
                </Badge>
                <h2 id="plan-modal-title" className="text-2xl md:text-3xl font-bold leading-tight">
                  {t('name')}
                </h2>
                <p className="mt-2 text-white/85">{t('tagline')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tp('modal.close')}
              className="rounded-full bg-white/15 hover:bg-white/25 p-2 text-white flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <p className="text-secondary-700 dark:text-secondary-300">{t('description')}</p>

          <div className="rounded-lg border border-primary-200 dark:border-primary-800 p-4 bg-primary-50 dark:bg-primary-950/30 flex items-start gap-3">
            <CloudArrowDownIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-1">
                {tp('modal.ownership')}
              </p>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {tp('modal.ownershipPlanBody')}
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={tp('modal.title')}
            className="inline-flex rounded-xl bg-secondary-100 dark:bg-secondary-900 p-1 flex-wrap gap-1"
          >
            {offering.plans.map((plan) => {
              const isActive = plan.tier === activeTier;
              const label = tp(
                `plan.tier${plan.tier.charAt(0).toUpperCase()}${plan.tier.slice(1)}`,
              );
              return (
                <button
                  key={plan.tier}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActiveTier(plan.tier)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-white shadow'
                      : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                  {plan.tier === 'growth' && (
                    <span className="ml-1 text-[10px] uppercase font-bold text-primary-600 dark:text-primary-300">
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <SaasTierDetail offering={offering} plan={activePlan} />
        </div>
      </div>
    </div>
  );
}

function SaasTierDetail({ offering, plan }: { offering: SaasOffering; plan: SaasPlan }) {
  const ns = slugToPlanNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const tierKey = plan.tier;
  const tierLabel = tp(`plan.tier${tierKey.charAt(0).toUpperCase()}${tierKey.slice(1)}`);
  const incluye = t.raw(`plans.${tierKey}.incluye`) as string[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{tierLabel}</h3>
            {tierKey === 'growth' && (
              <Badge variant="primary" size="sm">
                {tp('tier.recommended')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
            {t(`plans.${tierKey}.tagline`)}
          </p>
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
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="success" size="sm">
              {tp('plan.semestralBadge')}
            </Badge>
            <Badge variant="info" size="sm">
              {tp('plan.annualBadge')}
            </Badge>
          </div>
        </Card>

        {plan.limits && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CircleStackIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="font-semibold text-secondary-900 dark:text-white text-sm">
                {tp('modal.limits')}
              </p>
            </div>
            <LimitsTable limits={plan.limits} />
          </div>
        )}

        {plan.integraciones && <IntegrationsBlock integraciones={plan.integraciones} />}
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-2">
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

        {plan.costosAdicionales && plan.costosAdicionales.length > 0 && (
          <CostsTable costos={plan.costosAdicionales} variant="plan" />
        )}

        <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {tp('modal.idealPara')}
          </p>
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            {t(`plans.${tierKey}.idealPara`)}
          </p>
        </div>

        <Button fullWidth asChild>
          <Link href={`/contact?plan=${offering.slug}&tier=${tierKey}`}>{tp('modal.quote')}</Link>
        </Button>
      </div>
    </div>
  );
}

function ServiceModal({ offering, onClose }: { offering: ServiceOffering; onClose: () => void }) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const [activeTier, setActiveTier] = useState<'inicial' | 'profesional' | 'enterprise'>(
    'profesional',
  );
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;
  const activePlan = offering.plans.find((p) => p.tier === activeTier) ?? offering.plans[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-secondary-900 sm:rounded-2xl max-w-5xl w-full sm:my-8 shadow-2xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col"
      >
        <div className={`bg-gradient-to-br ${offering.gradient} p-6 text-white sm:rounded-t-2xl`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
                  {t('categoryLabel')}
                </Badge>
                <h2
                  id="service-modal-title"
                  className="text-2xl md:text-3xl font-bold leading-tight"
                >
                  {t('name')}
                </h2>
                <p className="mt-2 text-white/85">{t('tagline')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tp('modal.close')}
              className="rounded-full bg-white/15 hover:bg-white/25 p-2 text-white flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <p className="text-secondary-700 dark:text-secondary-300">{t('description')}</p>

          <div className="rounded-lg border border-primary-200 dark:border-primary-800 p-4 bg-primary-50 dark:bg-primary-950/30 flex items-start gap-3">
            <CodeBracketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-1">
                {tp('modal.ownership')}
              </p>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                {tp('modal.ownershipServiceBody')}
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={tp('modal.title')}
            className="inline-flex rounded-xl bg-secondary-100 dark:bg-secondary-900 p-1 flex-wrap gap-1"
          >
            {offering.plans.map((plan) => {
              const isActive = plan.tier === activeTier;
              const label = tp(
                `service.tier${plan.tier.charAt(0).toUpperCase()}${plan.tier.slice(1)}`,
              );
              return (
                <button
                  key={plan.tier}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActiveTier(plan.tier)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-white shadow'
                      : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                  {plan.tier === 'profesional' && (
                    <span className="ml-1 text-[10px] uppercase font-bold text-primary-600 dark:text-primary-300">
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ServiceTierDetail offering={offering} plan={activePlan} />
        </div>
      </div>
    </div>
  );
}

function ServiceTierDetail({
  offering,
  plan,
}: {
  offering: ServiceOffering;
  plan: ServicePlan;
}) {
  const ns = slugToNamespace(offering.slug);
  const tp = useTranslations('servicesCatalog');
  const t = useTranslations(ns);
  const tierKey = plan.tier;
  const tierLabel = tp(`service.tier${tierKey.charAt(0).toUpperCase()}${tierKey.slice(1)}`);
  const setupIncluye = t.raw(`plans.${tierKey}.setupIncluye`) as string[];
  const mantIncluye = t.raw(`plans.${tierKey}.mantenimientoIncluye`) as string[];
  const incluye = t.raw(`plans.${tierKey}.incluye`) as string[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{tierLabel}</h3>
            {tierKey === 'profesional' && (
              <Badge variant="primary" size="sm">
                {tp('tier.recommended')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
            {t(`plans.${tierKey}.description`)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('service.setupLabel')}
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatCOP(plan.setupCOP)}
              </p>
            </div>
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {tp('service.monthlyOptional')}
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatCOP(plan.monthlyCOP)}
                <span className="text-xs font-normal text-secondary-500 dark:text-secondary-400">
                  {tp('card.perMonth')}
                </span>
              </p>
            </div>
          </div>

          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            <strong>{tp('service.deliveryTime')}:</strong> {plan.duracionSemanas.min}-
            {plan.duracionSemanas.max} {tp('service.weeks')}
          </p>
        </Card>

        {plan.limits && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CircleStackIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="font-semibold text-secondary-900 dark:text-white text-sm">
                {tp('modal.limits')}
              </p>
            </div>
            <LimitsTable limits={plan.limits} />
          </div>
        )}

        {plan.integraciones && <IntegrationsBlock integraciones={plan.integraciones} />}
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-2">
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
          <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-2">
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

        {incluye && incluye.length > 0 && (
          <div>
            <p className="font-semibold text-secondary-900 dark:text-white text-sm mb-2">
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
        )}

        {plan.costosAdicionales && plan.costosAdicionales.length > 0 && (
          <CostsTable costos={plan.costosAdicionales} variant="service" />
        )}

        <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {tp('modal.idealPara')}
          </p>
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            {t(`plans.${tierKey}.idealPara`)}
          </p>
        </div>

        <Button fullWidth asChild>
          <Link href={`/contact?service=${offering.slug}&plan=${tierKey}`}>
            {tp('modal.quote')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Página de precios                                                          */
/* -------------------------------------------------------------------------- */

export default function PricingPage() {
  const t = useTranslations('pricingPage');
  const tc = useTranslations('servicesCatalog');
  const [mode, setMode] = useState<Mode>('plans');
  const [query, setQuery] = useState('');
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const faqs = [
    { question: t('faq.items.hosting.question'), answer: t('faq.items.hosting.answer') },
    { question: t('faq.items.changePlan.question'), answer: t('faq.items.changePlan.answer') },
    {
      question: t('faq.items.moreFeatures.question'),
      answer: t('faq.items.moreFeatures.answer'),
    },
    { question: t('faq.items.sourceCode.question'), answer: t('faq.items.sourceCode.answer') },
    { question: t('faq.items.guarantee.question'), answer: t('faq.items.guarantee.answer') },
    { question: t('faq.items.payment.question'), answer: t('faq.items.payment.answer') },
    { question: t('faq.items.training.question'), answer: t('faq.items.training.answer') },
    { question: t('faq.items.technologies.question'), answer: t('faq.items.technologies.answer') },
  ];

  useEffect(() => {
    setOpenSlug(null);
  }, [mode]);

  useEffect(() => {
    if (openSlug) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
    return undefined;
  }, [openSlug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSlug(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => (q ? s.slug.toLowerCase().includes(q) : true));
  }, [query]);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANS.filter((p) => (q ? p.slug.toLowerCase().includes(q) : true));
  }, [query]);

  const openPlan = mode === 'plans' ? PLANS.find((p) => p.slug === openSlug) : undefined;
  const openService = mode === 'services' ? SERVICES.find((s) => s.slug === openSlug) : undefined;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-primary-100">{t('hero.subtitle')}</p>
            <p className="text-sm text-primary-200 max-w-3xl mx-auto">
              {tc('servicesIntro.body')}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs + search */}
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
                aria-selected={mode === 'plans'}
                onClick={() => setMode('plans')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  mode === 'plans'
                    ? 'bg-white dark:bg-secondary-700 text-primary-700 dark:text-white shadow'
                    : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <CloudArrowDownIcon className="h-4 w-4" />
                {tc('tabs.plans')}
              </button>
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
                {tc('tabs.services')}
              </button>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tc('search')}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Aviso costos cliente */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              {mode === 'plans' ? tc('modal.costsNoteSaas') : tc('modal.costsNote')}
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mode === 'plans' ? (
            filteredPlans.length === 0 ? (
              <p className="text-center text-secondary-600 dark:text-secondary-400 py-12">
                {tc('noResults')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((p) => (
                  <PlanCard key={p.slug} offering={p} onOpen={setOpenSlug} />
                ))}
              </div>
            )
          ) : filteredServices.length === 0 ? (
            <p className="text-center text-secondary-600 dark:text-secondary-400 py-12">
              {tc('noResults')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((s) => (
                <ServiceCard key={s.slug} offering={s} onOpen={setOpenSlug} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              {t('faq.subtitle')}
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} variant="bordered">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-secondary-700 dark:text-secondary-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              {t('faq.moreQuestions')}
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">{t('faq.contactButton')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CurrencyDollarIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('customPlan.title')}</h2>
          <p className="text-xl mb-10 text-primary-100">{t('customPlan.subtitle')}</p>
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-primary-600 hover:bg-primary-50"
            asChild
          >
            <Link href="/contact">{t('customPlan.button')}</Link>
          </Button>
        </div>
      </section>

      {openPlan && <PlanModal offering={openPlan} onClose={() => setOpenSlug(null)} />}
      {openService && <ServiceModal offering={openService} onClose={() => setOpenSlug(null)} />}
    </>
  );
}
