'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import HomeHighlights from '@/components/home/HomeHighlights';
import { DEMO_COUNT } from '@/lib/demos';
import { MEDICAL_ACCOUNTS_DEMO_PATH } from '@/lib/rag-page';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { demoSlugFromPath, gatedInfo, useDemoCatalog } from '@/lib/use-demo-catalog';
import {
  ShoppingCartIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CloudIcon,
  CubeIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Contenido de la home (client component). La metadata y el JSON-LD de la home
 * se declaran en `src/app/page.tsx` (server component).
 */
export default function HomeContent() {
  const t = useTranslations();
  // Modo de acceso real de cada demo (las que no son abiertas llevan su etiqueta).
  const demoCatalog = useDemoCatalog();
  const th = useTranslations('homePage');

  const services = [
    {
      icon: ShoppingCartIcon,
      title: t('services.ecommerce.title'),
      description: t('services.ecommerce.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: t('services.chatbots.title'),
      description: t('services.chatbots.description'),
      href: '/services#planes-rag',
    },
    {
      icon: CubeIcon,
      title: t('services.integrations.title'),
      description: t('services.integrations.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: CodeBracketIcon,
      title: t('services.custom.title'),
      description: t('services.custom.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: t('services.mobile.title'),
      description: t('services.mobile.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: PaintBrushIcon,
      title: t('services.uxui.title'),
      description: t('services.uxui.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: ShieldCheckIcon,
      title: t('services.security.title'),
      description: t('services.security.description'),
      href: '/services#otras-soluciones',
    },
    {
      icon: CloudIcon,
      title: t('services.consulting.title'),
      description: t('services.consulting.description'),
      href: '/services#otras-soluciones',
    },
  ];

  // Demos destacadas: el chatbot RAG (producto principal) va primero. La
  // segunda es la de cuentas médicas, presentada como "Sistema experto para
  // salud" (no usa embeddings ni búsqueda vectorial, así que no es un caso RAG).
  const featuredDemos = [
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: th('demos.chatbot.title'),
      description: th('demos.chatbot.description'),
      href: '/demo/chatbot',
      category: th('demos.chatbot.category'),
      color: 'from-purple-500 to-purple-700',
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: th('demos.medicalAudit.title'),
      description: th('demos.medicalAudit.description'),
      href: MEDICAL_ACCOUNTS_DEMO_PATH,
      category: th('demos.medicalAudit.category'),
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: ShoppingCartIcon,
      title: th('demos.ecommerce.title'),
      description: th('demos.ecommerce.description'),
      href: '/demo/ecommerce',
      category: th('demos.ecommerce.category'),
      color: 'from-green-500 to-green-700',
    },
    {
      icon: CubeIcon,
      title: th('demos.dashboard.title'),
      description: th('demos.dashboard.description'),
      href: '/demo/dashboard-ejecutivo',
      category: th('demos.dashboard.category'),
      color: 'from-indigo-500 to-indigo-700',
    },
    {
      icon: CodeBracketIcon,
      title: th('demos.projects.title'),
      description: th('demos.projects.description'),
      href: '/demo/control-proyectos',
      category: th('demos.projects.category'),
      color: 'from-orange-500 to-orange-700',
    },
    {
      icon: CloudIcon,
      title: th('demos.documents.title'),
      description: th('demos.documents.description'),
      href: '/demo/gestor-documentos',
      category: th('demos.documents.category'),
      color: 'from-cyan-500 to-cyan-700',
    },
    {
      icon: PaintBrushIcon,
      title: th('demos.cms.title'),
      description: th('demos.cms.description'),
      href: '/demo/gestor-contenido',
      category: th('demos.cms.category'),
      color: 'from-pink-500 to-pink-700',
    },
    {
      icon: CheckCircleIcon,
      title: th('demos.reservations.title'),
      description: th('demos.reservations.description'),
      href: '/demo/sistema-reservas',
      category: th('demos.reservations.category'),
      color: 'from-teal-500 to-teal-700',
    },
  ];

  return (
    <>
      {/* Hero Section - SEO Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black">
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
                <Link href="/demo/chatbot">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services#planes-rag">{t('hero.cta2')}</Link>
              </Button>
            </div>
          </div>

          {/* Datos verificables (sin cifras de clientes ni calificaciones) */}
          <HomeHighlights className="mt-20" />
        </div>
      </section>

      {/* Featured Demos Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="primary" size="md" className="mb-4">
              {th('demos.sectionBadge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {th('demos.sectionTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {th('demos.sectionSubtitle', { count: DEMO_COUNT })}
            </p>
          </div>

          {/* Demos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {featuredDemos.map((demo, index) => {
              const Icon = demo.icon;
              const gated = gatedInfo(demoCatalog, demoSlugFromPath(demo.href));
              return (
                <Link key={index} href={demo.href}>
                  <Card
                    variant="bordered"
                    className="h-full hover:shadow-large hover:border-primary-400 dark:hover:border-primary-600 transition-all group"
                  >
                    <CardHeader>
                      <div className={`w-14 h-14 bg-gradient-to-br ${demo.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          {demo.category}
                        </span>
                        {gated && <DemoAccessBadge mode={gated.mode} activo={gated.activo} />}
                      </div>
                      <CardTitle className="text-lg font-bold">{demo.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {demo.description}
                      </CardDescription>
                      <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                        {th('demos.exploreDemo')}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Key Benefits */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-950 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-8 text-center">
              {th('demos.whyTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {th('demos.benefit1Title')}
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {th('demos.benefit1Desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {th('demos.benefit2Title')}
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {th('demos.benefit2Desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  {th('demos.benefit3Title')}
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {th('demos.benefit3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Services Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('services.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Link key={index} href={service.href}>
                  <Card
                    variant="bordered"
                    className="h-full hover:shadow-medium hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                  >
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/services">{t('common.learnMore')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
            {th('cta.title')}
          </h2>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 mb-10">
            {th('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">{t('common.requestQuote')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services#planes-rag">{th('cta.button')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
