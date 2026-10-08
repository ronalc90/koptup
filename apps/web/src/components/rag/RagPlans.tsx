'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { trackPlanClick } from '@/lib/analytics';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import {
  RAG_EXTRA_QUESTION_PRICE,
  RAG_PLANS,
  formatRagCOP,
  formatRagUSD,
  ragPlanContactHref,
  type RagPlan,
} from '@/lib/rag-plans';

/**
 * Tabla de planes RAG (Piloto, Esencial, Profesional, Empresarial) con las
 * notas de precios: IVA, pregunta adicional sobre el tope y tarifas de Meta
 * para WhatsApp. Se usa en /services#planes-rag y en /rag ("la misma tabla").
 *
 * Solo renderiza las tarjetas y las notas: el título de la sección y el `id`
 * del ancla los pone la página que la usa.
 */
export default function RagPlans({ className = '' }: { className?: string }) {
  const t = useTranslations('ragPlans');
  const locale = useLocale();

  return (
    <div className={className}>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {RAG_PLANS.map((plan) => (
          <RagPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-medium">
        <h3 className="text-sm font-bold text-secondary-900 dark:text-white">{t('notes.title')}</h3>
        <ul className="mt-3 grid md:grid-cols-3 gap-4">
          <li className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
            <ReceiptPercentIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span>{t('notes.tax')}</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
            <InformationCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span>
              {t('notes.extraQuestion', {
                cop: formatRagCOP(RAG_EXTRA_QUESTION_PRICE.cop, locale),
                usd: formatRagUSD(RAG_EXTRA_QUESTION_PRICE.usd, locale),
              })}
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span>{t('notes.whatsapp')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarjeta de plan (mismo estilo que las tarjetas del catálogo de /services)  */
/* -------------------------------------------------------------------------- */

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Tarjeta de un plan. Se exporta para mostrar el plan elegido fuera de la
 * tabla (p. ej. en /register), con `showCta={false}`.
 */
export function RagPlanCard({ plan, showCta = true }: { plan: RagPlan; showCta?: boolean }) {
  const t = useTranslations('ragPlans');
  const locale = useLocale();
  const key = `plans.${plan.id}`;

  const features = asStringList(t.raw(`${key}.features`));
  const monthlyIncludes = plan.hasMonthlyIncludes
    ? asStringList(t.raw(`${key}.monthlyIncludes`))
    : [];

  const duration =
    plan.monthlyMode === 'none'
      ? t('duration.pilot', { weeks: plan.weeks.max })
      : t('duration.implementation', { min: plan.weeks.min, max: plan.weeks.max });

  const setupLabel =
    plan.monthlyMode === 'none'
      ? t('price.oneTime')
      : plan.setupIsFrom
      ? t('price.setupFrom')
      : t('price.setup');

  return (
    <Card
      variant="bordered"
      padding="none"
      className="overflow-hidden hover:shadow-large transition-all hover:-translate-y-0.5 flex flex-col"
    >
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
        <Badge variant="outline" size="sm" className="border-white/30 text-white mb-2">
          {duration}
        </Badge>
        <h3 className="text-xl font-bold leading-tight">{t(`${key}.name`)}</h3>
        <p className="text-sm text-white/90 mt-1">{t(`${key}.tagline`)}</p>
      </div>

      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* Precio */}
        <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 bg-secondary-50 dark:bg-secondary-900/40 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 dark:text-secondary-400">
              {setupLabel}
            </p>
            <p className="text-xl font-bold text-secondary-900 dark:text-white">
              {formatRagCOP(plan.setup.cop, locale)}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {formatRagUSD(plan.setup.usd, locale)}
            </p>
          </div>

          {plan.monthlyMode !== 'none' ? (
            <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 dark:text-secondary-400">
                {t('price.monthly')}
              </p>
              {plan.monthlyMode === 'fixed' && plan.monthly ? (
                <>
                  <p className="text-xl font-bold text-secondary-900 dark:text-white">
                    {formatRagCOP(plan.monthly.cop, locale)}
                    <span className="text-sm font-normal text-secondary-500 dark:text-secondary-400">
                      {' '}
                      {t('price.perMonth')}
                    </span>
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {formatRagUSD(plan.monthly.usd, locale)} {t('price.perMonth')}
                  </p>
                </>
              ) : (
                <p className="text-xl font-bold text-secondary-900 dark:text-white">
                  {t('price.monthlyBySla')}
                </p>
              )}
            </div>
          ) : null}

          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('price.tax')}</p>
        </div>

        {/* Alcance */}
        <FeatureList title={t('featuresTitle')} items={features} />

        {/* Lo que cubre la mensualidad */}
        {monthlyIncludes.length > 0 ? (
          <FeatureList title={t('monthlyIncludesTitle')} items={monthlyIncludes} />
        ) : null}

        {plan.hasNote ? (
          <p className="rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 p-3 text-xs text-primary-800 dark:text-primary-200">
            {t(`${key}.note`)}
          </p>
        ) : null}

        {showCta ? (
          <div className="mt-auto pt-2">
            <Button variant="primary" size="sm" fullWidth asChild>
              <Link
                href={ragPlanContactHref(plan.id)}
                data-plan={plan.id}
                onClick={() =>
                  trackPlanClick({
                    plan_name: t(`${key}.name`),
                    plan_id: plan.id,
                    plan_group: 'planes_rag',
                    cta: 'quote',
                  })
                }
              >
                {t(`${key}.cta`)}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function FeatureList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4 className="text-sm font-bold text-secondary-900 dark:text-white mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300"
          >
            <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
