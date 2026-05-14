'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  AcademicCapIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  CommandLineIcon,
  CodeBracketIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  HeartIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MicrophoneIcon,
  PencilIcon,
  PencilSquareIcon,
  PuzzlePieceIcon,
  RectangleStackIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  StarIcon,
  TruckIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  OFFERINGS,
  TIER_ORDER,
  TRM_FALLBACK,
  copToUsd,
  formatCOP,
  formatMoney,
  formatUSD,
  slugToOfferingNamespace,
  type DisplayCurrency,
  type Offering,
  type OfferingCategory,
  type Tier,
  type TierKey,
  type TierLimits,
  type UnlimitedOrNumber,
} from '@/lib/services-catalog';

type Modality = 'compra' | 'saas';

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

const CATEGORY_FILTERS: (OfferingCategory | 'all')[] = [
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
/* Hook: TRM en vivo                                                           */
/* -------------------------------------------------------------------------- */

interface TrmState {
  rate: number;
  source: 'live' | 'fallback';
}

function useLiveTRM(): TrmState {
  const [state, setState] = useState<TrmState>({ rate: TRM_FALLBACK, source: 'fallback' });
  useEffect(() => {
    let alive = true;
    fetch('/api/trm')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rate?: number; source?: string } | null) => {
        if (!alive || !data || typeof data.rate !== 'number') return;
        setState({
          rate: data.rate,
          source: data.source === 'fallback' ? 'fallback' : 'live',
        });
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatLimit(value: UnlimitedOrNumber, unlimitedLabel: string, naLabel: string): string {
  if (value === 'unlimited') return unlimitedLabel;
  if (value === 0) return naLabel;
  return new Intl.NumberFormat('es-CO').format(value);
}

function getTierAccent(idx: number): string {
  // Profesional es la opción recomendada por defecto.
  if (idx === 1) return 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500/30';
  return 'border-secondary-200 dark:border-secondary-700';
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

interface OfferingCardProps {
  offering: Offering;
  globalModality: Modality;
  currency: DisplayCurrency;
  trmRate: number;
  onOpen: (slug: string) => void;
}

function OfferingCard({ offering, globalModality, currency, trmRate, onOpen }: OfferingCardProps) {
  const ns = slugToOfferingNamespace(offering.slug);
  const tp = useTranslations('offeringsCatalog');
  const t = useTranslations(ns);
  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;

  // Por defecto mostramos el tier "profesional" como gancho.
  const featured = offering.tiers[1];

  const setupCOP =
    globalModality === 'compra' ? featured.compra.setupCOP : featured.saas.setupCOP;
  const recurringCOP =
    globalModality === 'compra' ? featured.compra.mantenimientoCOP : featured.saas.monthlyCOP;

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

        <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 bg-secondary-50 dark:bg-secondary-900/40 space-y-2">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 dark:text-secondary-400">
            {globalModality === 'compra'
              ? tp('modality.compra')
              : tp('modality.saas')}{' '}
            · {tp(`tier.${featured.key}`)}
          </p>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                {tp('card.fromPrice')}
              </p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatMoney(setupCOP, currency, trmRate)}
              </p>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                {tp('card.setupOnce')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {recurringCOP > 0 ? formatMoney(recurringCOP, currency, trmRate) : '—'}
              </p>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                {tp('card.perMonth')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={() => onOpen(offering.slug)}>
            {tp('card.viewMore')}
          </Button>
          {offering.demoSlug ? (
            <Link href={`/demo/${offering.demoSlug}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                {tp('card.viewDemo')}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

interface OfferingModalProps {
  offering: Offering;
  initialModality: Modality;
  currency: DisplayCurrency;
  trmRate: number;
  onClose: () => void;
}

function OfferingModal({
  offering,
  initialModality,
  currency,
  trmRate,
  onClose,
}: OfferingModalProps) {
  const ns = slugToOfferingNamespace(offering.slug);
  const tp = useTranslations('offeringsCatalog');
  const t = useTranslations(ns);

  const [modality, setModality] = useState<Modality>(initialModality);
  const [activeTier, setActiveTier] = useState<TierKey>('profesional');

  const tier: Tier =
    offering.tiers.find((tier) => tier.key === activeTier) ?? offering.tiers[1];

  const setupCOP = modality === 'compra' ? tier.compra.setupCOP : tier.saas.setupCOP;
  const recurringCOP =
    modality === 'compra' ? tier.compra.mantenimientoCOP : tier.saas.monthlyCOP;

  const Icon = ICONS[offering.icon] ?? RocketLaunchIcon;

  // Bloquear scroll del body mientras el modal está abierto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-5xl bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative bg-gradient-to-br ${offering.gradient} p-6 text-white rounded-t-2xl`}>
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/15 hover:bg-white/25 transition"
              onClick={onClose}
              aria-label={tp('modal.close')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-4 pr-12">
              <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Icon className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
                  {t('categoryLabel')}
                </Badge>
                <h3 className="text-2xl font-bold leading-tight">{t('name')}</h3>
                <p className="text-sm text-white/90 mt-1">{t('tagline')}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('description')}</p>

            {/* Modality toggle */}
            <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-1 flex flex-col sm:flex-row gap-1">
              <button
                type="button"
                className={`flex-1 px-4 py-3 rounded-lg text-left transition ${
                  modality === 'compra'
                    ? 'bg-primary-600 text-white'
                    : 'bg-transparent text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
                onClick={() => setModality('compra')}
              >
                <span className="block text-sm font-semibold">{tp('modality.compra')}</span>
                <span className="block text-xs opacity-90 mt-0.5">
                  {tp('modality.compraDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-3 rounded-lg text-left transition ${
                  modality === 'saas'
                    ? 'bg-primary-600 text-white'
                    : 'bg-transparent text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
                onClick={() => setModality('saas')}
              >
                <span className="block text-sm font-semibold">{tp('modality.saas')}</span>
                <span className="block text-xs opacity-90 mt-0.5">{tp('modality.saasDesc')}</span>
              </button>
            </div>

            {/* Tier tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIER_ORDER.map((tk, idx) => {
                const isActive = tk === activeTier;
                return (
                  <button
                    key={tk}
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600'
                        : `bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 ${getTierAccent(idx)}`
                    }`}
                    onClick={() => setActiveTier(tk)}
                  >
                    {tp(`tier.${tk}`)}
                  </button>
                );
              })}
            </div>

            {/* Pricing block */}
            <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-5 bg-secondary-50 dark:bg-secondary-900/40">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 dark:text-secondary-400">
                    {tp('card.setupOnce')}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {formatMoney(setupCOP, currency, trmRate)}
                  </p>
                  {currency === 'COP' ? (
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      ≈ {formatUSD(copToUsd(setupCOP, trmRate))}
                    </p>
                  ) : (
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      ≈ {formatCOP(setupCOP)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 dark:text-secondary-400">
                    {modality === 'compra'
                      ? tp('modal.maintenanceLabel')
                      : tp('modal.monthlyLabel')}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                    {recurringCOP > 0 ? formatMoney(recurringCOP, currency, trmRate) : '—'}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {modality === 'compra'
                      ? tp('modal.maintenanceNote')
                      : tp('modal.monthlyNote')}
                  </p>
                </div>
              </div>
            </div>

            {/* Incluye */}
            <section>
              <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                {tp('modal.incluye')}
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2">
                {Array.from({ length: tier.incluyeCount }).map((_, i) => {
                  const key = `tiers.${tier.key}.incluye.${i}`;
                  let val: string;
                  try {
                    val = t(key);
                  } catch {
                    val = '';
                  }
                  if (!val || val === key) return null;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                      <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <span>{val}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Límites + soporte + implementación */}
            <section className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
                <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-3">
                  {tp('modal.limits')}
                </h4>
                <LimitsTable limits={tier.limits} />
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
                  <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-2 flex items-center gap-2">
                    <PuzzlePieceIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    {tp('modal.support')}
                  </h4>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">
                    {tp(`supportSLA.${tier.soporte}`)}
                  </p>
                </div>
                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
                  <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-2 flex items-center gap-2">
                    <InformationCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    {tp('modal.implementacion')}
                  </h4>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">
                    {tier.implementacionSemanas.min}-{tier.implementacionSemanas.max}{' '}
                    {tp('modal.weeks')} · {tier.mantenimientoHoras} {tp('modal.hours')}/
                    {tp('modal.month')}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    {tp(`integraciones.${tier.integraciones}`)}
                  </p>
                </div>
              </div>
            </section>

            {/* Costos cliente */}
            <section className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
              <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-2 flex items-center gap-2">
                <CodeBracketIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                {tp('modal.costosCliente')}
              </h4>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                ${tier.costosClienteUSD.min.toLocaleString('en-US')}–$
                {tier.costosClienteUSD.max.toLocaleString('en-US')} USD/{tp('modal.month')} —{' '}
                {tier.costosClienteUSD.detalle}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                {tp('modal.costosClienteNote')}
              </p>
            </section>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href={`/contact?service=${offering.slug}&tier=${tier.key}&modality=${modality}`} className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  {tp('modal.quote')}
                </Button>
              </Link>
              {offering.demoSlug ? (
                <Link href={`/demo/${offering.demoSlug}`} className="flex-1">
                  <Button variant="outline" size="md" className="w-full">
                    {tp('card.viewDemo')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitsTable({ limits }: { limits: TierLimits }) {
  const tp = useTranslations('offeringsCatalog');
  const unlimited = tp('modal.limitsUnlimited');
  const na = tp('modal.limitsNotApplicable');

  const rows: Array<[string, string]> = [
    [tp('modal.limitsAdminUsers'), formatLimit(limits.adminUsers, unlimited, na)],
    [tp('modal.limitsEndUsers'), formatLimit(limits.endUsers, unlimited, na)],
    [tp('modal.limitsAccounts'), formatLimit(limits.accounts, unlimited, na)],
    [tp('modal.limitsVolume'), limits.volumeLabel],
    [
      tp('modal.limitsStorage'),
      limits.storageGB === 'unlimited'
        ? unlimited
        : limits.storageGB === 0
        ? na
        : `${limits.storageGB} GB`,
    ],
  ];

  return (
    <dl className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-secondary-500 dark:text-secondary-400">{k}</dt>
          <dd className="font-medium text-secondary-900 dark:text-white text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Página catálogo                                                            */
/* -------------------------------------------------------------------------- */

export default function OfferingsCatalog() {
  const tp = useTranslations('offeringsCatalog');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<OfferingCategory | 'all'>('all');
  const [modality, setModality] = useState<Modality>('saas');
  const [currency, setCurrency] = useState<DisplayCurrency>('COP');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const { rate, source } = useLiveTRM();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OFFERINGS.filter((o) => {
      if (category !== 'all' && o.category !== category) return false;
      if (!q) return true;
      return o.slug.replace(/-/g, ' ').includes(q) || o.category.toLowerCase().includes(q);
    });
  }, [query, category]);

  const openOffering = openSlug ? OFFERINGS.find((o) => o.slug === openSlug) : null;

  const trmLabel =
    source === 'live'
      ? tp('currency.trmLive', { value: formatCOP(rate) })
      : tp('currency.trmCached', { value: formatCOP(rate) });

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {tp('hero.title')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl">
            {tp('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Banner cómo escalamos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-medium">
          <h2 className="text-sm font-bold text-secondary-900 dark:text-white">
            {tp('banner.title')}
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            {tp('banner.body')}
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="relative">
            <Input
              placeholder={tp('search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
          </div>

          {/* Modality (global default for cards) */}
          <div className="inline-flex rounded-lg border border-secondary-200 dark:border-secondary-700 p-1 bg-white dark:bg-secondary-900">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                modality === 'compra'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              }`}
              onClick={() => setModality('compra')}
            >
              {tp('modality.compra')}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                modality === 'saas'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              }`}
              onClick={() => setModality('saas')}
            >
              {tp('modality.saas')}
            </button>
          </div>

          {/* Currency */}
          <div className="inline-flex rounded-lg border border-secondary-200 dark:border-secondary-700 p-1 bg-white dark:bg-secondary-900">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                currency === 'COP'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              }`}
              onClick={() => setCurrency('COP')}
            >
              {tp('currency.cop')}
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                currency === 'USD'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              }`}
              onClick={() => setCurrency('USD')}
            >
              {tp('currency.usd')}
            </button>
          </div>
        </div>

        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">{trmLabel}</p>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-5">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                {tp(`categories.${cat}`)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="text-center text-secondary-500 dark:text-secondary-400 py-16">
            {tp('noResults')}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((offering) => (
              <OfferingCard
                key={offering.slug}
                offering={offering}
                globalModality={modality}
                currency={currency}
                trmRate={rate}
                onOpen={setOpenSlug}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-secondary-900 to-secondary-700 dark:from-secondary-800 dark:to-secondary-900 text-white p-8 shadow-large">
          <h2 className="text-2xl font-bold">{tp('cta.title')}</h2>
          <p className="mt-2 text-white/90">{tp('cta.body')}</p>
          <div className="mt-4">
            <Link href="/contact">
              <Button variant="primary" size="md">
                {tp('cta.button')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {openOffering ? (
        <OfferingModal
          offering={openOffering}
          initialModality={modality}
          currency={currency}
          trmRate={rate}
          onClose={() => setOpenSlug(null)}
        />
      ) : null}
    </div>
  );
}
