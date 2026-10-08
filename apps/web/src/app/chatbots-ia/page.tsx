'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import HomeHighlights from '@/components/home/HomeHighlights';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { CHATBOTS_FAQ_KEYS, CHATBOTS_USE_CASES, getChatbotsPageValues } from '@/lib/chatbots-page';
import { RAG_DEMO_PATH, RAG_PATH, getRagSector } from '@/lib/rag-page';
import { RAG_PLANS_PATH, ragPlanContactHref } from '@/lib/rag-plans';
import { trackPlanClick } from '@/lib/analytics';

const BENEFITS = [
  { key: 'docs', icon: DocumentTextIcon },
  { key: 'cites', icon: DocumentCheckIcon },
  { key: 'updates', icon: ArrowPathIcon },
  { key: 'notFound', icon: QuestionMarkCircleIcon },
  { key: 'anyHour', icon: ClockIcon },
  { key: 'sources', icon: FolderIcon },
] as const;

const CHANNELS = [
  { key: 'web', icon: ComputerDesktopIcon },
  { key: 'whatsapp', icon: ChatBubbleLeftRightIcon },
] as const;

const PROCESS_STEPS = ['pilot', 'implementation', 'launch', 'updates'] as const;

/**
 * /chatbots-ia — "Chatbots RAG para WhatsApp y web". La metadata y el JSON-LD
 * (Service, FAQPage y breadcrumb) se declaran en `layout.tsx`; los precios y
 * plazos salen de `rag-plans.ts` vía `getChatbotsPageValues`.
 */
export default function ChatbotsIAPage() {
  const t = useTranslations('chatbotsPage');
  const locale = useLocale();
  const values = getChatbotsPageValues(locale);
  const tRag = useTranslations('ragPlans');
  const pilotHref = ragPlanContactHref('piloto');
  // Los CTA "Agenda un piloto" llevan al plan Piloto RAG: cuentan como plan_click.
  const trackPilotClick = () =>
    trackPlanClick({
      plan_name: tRag('plans.piloto.name'),
      plan_id: 'piloto',
      plan_group: 'planes_rag',
      cta: 'quote',
    });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" asChild>
                <Link href={RAG_DEMO_PATH}>{t('hero.ctaDemo')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
                <Link href={pilotHref} onClick={trackPilotClick}>
                  {t('hero.ctaPilot')}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-purple-100">{t('hero.price', values)}</p>
            <Link
              href={RAG_PATH}
              className="mt-8 inline-flex items-center gap-1 text-base font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
            >
              {t('hero.ragLink')}
              <ArrowRightIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Datos verificables (sin cifras de resultados) */}
      <section className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <HomeHighlights />
        </div>
      </section>

      {/* Qué hace un chatbot RAG */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('benefits.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('benefits.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ key, icon: Icon }) => (
              <Card key={key} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {t(`benefits.items.${key}.title`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t(`benefits.items.${key}.desc`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Canales: sitio web y WhatsApp */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('channels.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('channels.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHANNELS.map(({ key, icon: Icon }) => (
              <Card key={key} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                        {t(`channels.${key}.title`)}
                      </h3>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {t(`channels.${key}.plan`)}
                      </p>
                    </div>
                  </div>
                  <p className="text-secondary-600 dark:text-secondary-400">{t(`channels.${key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-secondary-600 dark:text-secondary-400">
            {t('channels.metaNote')}
          </p>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('useCases.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('useCases.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHATBOTS_USE_CASES.map(({ key, sector }) => (
              <Card key={key} variant="bordered" className="flex flex-col hover:shadow-medium transition-shadow">
                <CardContent className="p-6 flex flex-1 flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <ChatBubbleBottomCenterTextIcon
                      className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                      {t(`useCases.items.${key}.title`)}
                    </h3>
                  </div>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t(`useCases.items.${key}.desc`)}
                  </p>
                  {sector ? (
                    <Link
                      href={getRagSector(sector).path}
                      className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      {t(`useCases.items.${key}.link`)}
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso (tiempos alineados con los planes) */}
      <section className="section-padding bg-gradient-to-br from-purple-50 to-secondary-50 dark:from-secondary-900 dark:to-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('process.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('process.subtitle', values)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS_STEPS.map((key) => (
              <div key={key} className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {t(`process.steps.${key}.title`, values)}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                  {t(`process.steps.${key}.desc`, values)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes (mismo texto que el JSON-LD FAQPage) */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-12 text-center">
            {t('faq.title')}
          </h2>
          <div className="space-y-4">
            {CHATBOTS_FAQ_KEYS.map((key) => (
              <Card key={key} variant="bordered">
                <CardContent className="p-6">
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

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-purple-600 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-purple-100 mb-10">{t('cta.subtitle', values)}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" asChild>
              <Link href={RAG_DEMO_PATH}>{t('cta.demo')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href={pilotHref} onClick={trackPilotClick}>
                {t('cta.pilot')}
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-purple-100">{t('hero.price', values)}</p>
          <Link
            href={RAG_PLANS_PATH}
            className="mt-4 inline-flex items-center gap-1 text-base font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
          >
            {t('cta.plans')}
            <ArrowRightIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
