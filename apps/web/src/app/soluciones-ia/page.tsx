'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import HomeHighlights from '@/components/home/HomeHighlights';
import {
  CpuChipIcon,
  ChartBarIcon,
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
  ClockIcon,
  LightBulbIcon,
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { AI_SOLUTIONS, AI_SOLUTIONS_FAQ_KEYS, getAiSolutionsPageValues } from '@/lib/ai-solutions-page';

const SOLUTION_ICONS: Record<string, typeof CpuChipIcon> = {
  rag: DocumentMagnifyingGlassIcon,
  chatbots: ChatBubbleBottomCenterTextIcon,
  automation: ArrowPathIcon,
  predictive: ChartBarIcon,
  documents: DocumentTextIcon,
  expert: CpuChipIcon,
  content: SparklesIcon,
};

const WHY_REASONS = [
  { key: 'time', icon: ClockIcon },
  { key: 'scale', icon: UsersIcon },
  { key: 'decisions', icon: LightBulbIcon },
  { key: 'advantage', icon: TrophyIcon },
] as const;

/**
 * /soluciones-ia — soluciones de IA para empresas, con los sistemas RAG como
 * primera solución (enlazada a /rag). La metadata y el JSON-LD (Service,
 * FAQPage y breadcrumb) se declaran en `layout.tsx`; los precios y plazos que
 * citan los textos salen de `rag-plans.ts` vía `getAiSolutionsPageValues`.
 */
export default function SolucionesIAPage() {
  const t = useTranslations('aiSolutionsPage');
  const locale = useLocale();
  const values = getAiSolutionsPageValues(locale);

  // Plataformas que implementamos (los sistemas RAG ya no van aquí: son la
  // primera solución de la lista).
  const techStack = [
    { name: 'GPT-4 / ChatGPT', desc: 'OpenAI' },
    { name: 'Claude AI', desc: 'Anthropic' },
    { name: 'Gemini', desc: 'Google' },
    { name: 'LangChain', desc: t('tech.orchestration') },
    { name: 'Python ML', desc: 'Machine Learning' },
    { name: 'TensorFlow', desc: 'Deep Learning' },
    { name: 'n8n / Make', desc: t('tech.automation') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
                <Link href="/demo">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
                <Link href="/contact">{t('hero.cta2')}</Link>
              </Button>
            </div>
            <Link
              href="/rag"
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

      {/* Solutions Grid (sistemas RAG primero) */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('solutions.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('solutions.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_SOLUTIONS.map(({ key, href }) => {
              const Icon = SOLUTION_ICONS[key];

              // Primera solución: sistemas RAG, destacada a todo el ancho.
              if (key === 'rag' && href) {
                return (
                  <Card
                    key={key}
                    variant="bordered"
                    className="md:col-span-2 lg:col-span-3 border-blue-300 dark:border-blue-800 hover:shadow-medium transition-shadow"
                  >
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="info" size="sm" className="mb-2">
                          {t('solutions.items.rag.badge')}
                        </Badge>
                        <h3 className="text-xl md:text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                          {t('solutions.items.rag.title')}
                        </h3>
                        <p className="text-secondary-600 dark:text-secondary-400">
                          {t('solutions.items.rag.desc', values)}
                        </p>
                      </div>
                      <Button className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" asChild>
                        <Link href={href}>
                          {t('solutions.items.rag.link')}
                          <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={key} variant="bordered" className="flex flex-col hover:shadow-medium transition-shadow">
                  <CardContent className="p-6 flex flex-1 flex-col">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                      {t(`solutions.items.${key}.title`)}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                      {t(`solutions.items.${key}.desc`)}
                    </p>
                    {href ? (
                      <Link
                        href={href}
                        className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {t(`solutions.items.${key}.link`)}
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why IA */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('why.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {WHY_REASONS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-secondary-900 dark:to-secondary-800">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {t(`why.items.${key}.title`)}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t(`why.items.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('tech.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('tech.subtitle')}</p>
          </div>
          {/* 7 tarjetas: flex centrado para que la última fila no quede cargada a la izquierda. */}
          <div className="flex flex-wrap justify-center gap-6">
            {techStack.map((tech) => (
              <Card
                key={tech.name}
                variant="bordered"
                className="w-[calc(50%-0.75rem)] md:w-[calc(25%-1.125rem)] text-center hover:shadow-medium transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="font-bold text-secondary-900 dark:text-white text-sm mb-1">{tech.name}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{tech.desc}</div>
                </CardContent>
              </Card>
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
            {AI_SOLUTIONS_FAQ_KEYS.map((key) => (
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
      <section className="section-padding bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-blue-100 mb-10">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
              <Link href="/contact">{t('cta.button')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href="/demo">{t('cta.demos')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
