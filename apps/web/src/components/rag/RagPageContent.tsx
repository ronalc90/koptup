'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import RagPlans from '@/components/rag/RagPlans';
import { RAG_SECTOR_ICONS, asRagCases } from '@/components/rag/RagSectorLanding';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CodeBracketIcon,
  CpuChipIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  QueueListIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  RAG_DEMO_PATH,
  RAG_FAQ_KEYS,
  RAG_PAGE_PLANS_ANCHOR,
  RAG_PILOT_CONTACT_PATH,
  RAG_SECTORS,
  getRagFaqValues,
} from '@/lib/rag-page';

type Icon = typeof DocumentTextIcon;

/** Encabezado centrado de sección (H2 + bajada), mismo estilo de las landings del sitio. */
function SectionHeader({ badge, title, subtitle }: { badge?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      {badge ? (
        <Badge variant="primary" size="md" className="mb-4">
          {badge}
        </Badge>
      ) : null}
      <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{title}</h2>
      {subtitle ? (
        <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{subtitle}</p>
      ) : null}
    </div>
  );
}

/**
 * Contenido de /rag (client component). La metadata y el JSON-LD (Service con
 * los planes como Offer, FAQPage y breadcrumb) se declaran en
 * `src/app/rag/page.tsx`.
 *
 * Secciones, en el orden de la especificación:
 *  1. Qué es RAG (con el H1)  2. Casos por sector  3. Cómo funciona
 *  4. Seguridad y privacidad  5. Cómo evitamos respuestas inventadas
 *  6. Integraciones  7. Planes y precios  8. Preguntas frecuentes  9. CTA
 */
export default function RagPageContent() {
  const t = useTranslations('ragPage');
  const ts = useTranslations('ragSectors');
  const tp = useTranslations('ragPlans');
  const locale = useLocale();
  const values = getRagFaqValues(locale);

  const introPoints: { key: string; icon: Icon }[] = [
    { key: 'ask', icon: ChatBubbleLeftRightIcon },
    { key: 'search', icon: MagnifyingGlassIcon },
    { key: 'cite', icon: DocumentCheckIcon },
  ];

  const steps: { key: string; icon: Icon }[] = [
    { key: 'docs', icon: DocumentTextIcon },
    { key: 'index', icon: QueueListIcon },
    { key: 'search', icon: MagnifyingGlassIcon },
    { key: 'answer', icon: ChatBubbleBottomCenterTextIcon },
  ];

  const securityItems: { key: string; icon: Icon }[] = [
    { key: 'storage', icon: ServerStackIcon },
    { key: 'provider', icon: CpuChipIcon },
    { key: 'sent', icon: PaperAirplaneIcon },
    { key: 'training', icon: ShieldCheckIcon },
    { key: 'control', icon: LockClosedIcon },
    { key: 'demo', icon: ExclamationTriangleIcon },
  ];

  const accuracyRules: { key: string; icon: Icon }[] = [
    { key: 'onlyDocs', icon: DocumentMagnifyingGlassIcon },
    { key: 'cites', icon: DocumentCheckIcon },
    { key: 'notFound', icon: QuestionMarkCircleIcon },
  ];

  const integrations: { key: string; icon: Icon }[] = [
    { key: 'drive', icon: FolderIcon },
    { key: 'sharepoint', icon: BuildingOffice2Icon },
    { key: 'whatsapp', icon: ChatBubbleLeftRightIcon },
    { key: 'databases', icon: CircleStackIcon },
    { key: 'apis', icon: CodeBracketIcon },
  ];

  return (
    <>
      {/* 1. Qué es RAG (con el H1 de la página) */}
      <section
        id="que-es-rag"
        className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-padding">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <Badge variant="primary" size="lg" className="mb-6">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-400 mb-10 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href={RAG_DEMO_PATH}>{t('hero.ctaDemo')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={RAG_PILOT_CONTACT_PATH}>{t('hero.ctaPilot')}</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-400">{t('hero.pilotNote', values)}</p>
          </div>

          <div className="mt-20 md:mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('intro.title')}
              </h2>
              <p className="text-lg md:text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
                {t('intro.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {introPoints.map(({ key, icon: PointIcon }) => (
                <Card key={key} variant="bordered" className="h-full">
                  <CardContent>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                      <PointIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                      {t(`intro.points.${key}.title`)}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                      {t(`intro.points.${key}.desc`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-10 text-lg text-center text-secondary-700 dark:text-secondary-300 max-w-3xl mx-auto">
              {t('intro.analogy')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Casos por sector */}
      <section id="casos" className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t('sectors.title')} subtitle={t('sectors.subtitle')} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RAG_SECTORS.map((sector) => {
              const SectorIcon = RAG_SECTOR_ICONS[sector.id];
              const cases = asRagCases(ts.raw(`${sector.id}.cases`));
              return (
                <Card
                  key={sector.id}
                  variant="bordered"
                  className="h-full flex flex-col hover:shadow-medium hover:border-primary-400 dark:hover:border-primary-600 transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <SectorIcon className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                    {ts(`${sector.id}.name`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 mb-4">{ts(`${sector.id}.cardDesc`)}</p>
                  <ul className="space-y-2 mb-6">
                    {cases.map((c) => (
                      <li key={c.title} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                        <CheckCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>{c.title}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={sector.path}
                    className="mt-auto inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {ts(`${sector.id}.cardLink`)}
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Cómo funciona (diagrama) */}
      <section id="como-funciona" className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge={t('how.badge')} title={t('how.title')} subtitle={t('how.subtitle')} />

          {/* Diagrama: documentos → índice → búsqueda → respuesta con cita */}
          <ol aria-label={t('how.diagramLabel')} className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            {steps.map(({ key, icon: StepIcon }, i) => (
              <li
                key={key}
                className="relative rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-6 shadow-soft"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <StepIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {t(`how.steps.${key}.title`)}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`how.steps.${key}.desc`)}</p>
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute z-10 left-1/2 -bottom-9 -translate-x-1/2 md:left-auto md:bottom-auto md:top-1/2 md:-right-7 md:translate-x-0 md:-translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400"
                  >
                    <ArrowDownIcon className="h-4 w-4 md:hidden" />
                    <ArrowRightIcon className="hidden h-4 w-4 md:block" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          {/* Ejemplo de respuesta con cita */}
          <figure className="mt-12 max-w-3xl mx-auto rounded-2xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-6 md:p-8 shadow-soft">
            <figcaption className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-4">
              {t('how.example.title')}
            </figcaption>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('how.example.questionLabel')}</dt>
                <dd className="mt-1 text-secondary-700 dark:text-secondary-300">{t('how.example.question')}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('how.example.answerLabel')}</dt>
                <dd className="mt-1 text-secondary-700 dark:text-secondary-300">{t('how.example.answer')}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('how.example.sourceLabel')}</dt>
                <dd className="mt-1 rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 p-3">
                  <p className="font-semibold text-primary-800 dark:text-primary-200">{t('how.example.sourceName')}</p>
                  <p className="mt-1 text-primary-800/80 dark:text-primary-200/80">{t('how.example.sourceQuote')}</p>
                </dd>
              </div>
            </dl>
          </figure>
        </div>
      </section>

      {/* 4. Seguridad y privacidad */}
      <section id="seguridad" className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t('security.title')} subtitle={t('security.subtitle')} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityItems.map(({ key, icon: ItemIcon }) => (
              <Card key={key} variant="bordered" className="h-full">
                <CardContent>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                    <ItemIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {t(`security.items.${key}.title`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t(`security.items.${key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('security.privacyLink')}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* 5. Cómo evitamos respuestas inventadas */}
      <section id="sin-respuestas-inventadas" className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-950 rounded-2xl p-8 md:p-12">
            <SectionHeader title={t('accuracy.title')} subtitle={t('accuracy.subtitle')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {accuracyRules.map(({ key, icon: RuleIcon }) => (
                <div key={key} className="text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RuleIcon className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {t(`accuracy.rules.${key}.title`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{t(`accuracy.rules.${key}.desc`)}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 flex items-start justify-center gap-2 text-center font-medium text-secondary-800 dark:text-secondary-200">
              <ChartBarIcon className="h-6 w-6 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span>{t('accuracy.measure')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 6. Integraciones */}
      <section id="integraciones" className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t('integrations.title')} subtitle={t('integrations.subtitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {integrations.map(({ key, icon: IntegrationIcon }) => (
              <Card key={key} variant="bordered" className="h-full hover:shadow-medium transition-shadow">
                <CardContent>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                    <IntegrationIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {t(`integrations.items.${key}.title`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t(`integrations.items.${key}.desc`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
            {t('integrations.note')}
          </p>
        </div>
      </section>

      {/* 7. Planes y precios (misma tabla de /services#planes-rag) */}
      <section
        id={RAG_PAGE_PLANS_ANCHOR}
        className="section-padding bg-secondary-50 dark:bg-black scroll-mt-16 md:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('plans.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('plans.subtitle', values)}
            </p>
            <p className="mt-3 text-sm font-medium text-secondary-500 dark:text-secondary-400">{tp('taxNote')}</p>
          </div>
          <RagPlans />
        </div>
      </section>

      {/* 8. Preguntas frecuentes (mismo texto que el JSON-LD FAQPage) */}
      <section id="preguntas-frecuentes" className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-12 text-center">
            {t('faq.title')}
          </h2>
          <div className="space-y-4">
            {RAG_FAQ_KEYS.map((key) => (
              <Card key={key} variant="bordered">
                <CardContent>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-3">
                    {t(`faq.items.${key}.q`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{t(`faq.items.${key}.a`, values)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-primary-100 mb-10">{t('cta.subtitle', values)}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
              <Link href={RAG_DEMO_PATH}>{t('cta.demo')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href={RAG_PILOT_CONTACT_PATH}>{t('cta.pilot')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
