'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StructuredData, { FAQStructuredData } from '@/components/seo/StructuredData';
import {
  ShoppingCartIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CloudIcon,
  CubeIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const t = useTranslations();
  const th = useTranslations('homePage');

  const services = [
    {
      icon: ShoppingCartIcon,
      title: t('services.ecommerce.title'),
      description: t('services.ecommerce.description'),
      href: '/services#ecommerce',
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: t('services.chatbots.title'),
      description: t('services.chatbots.description'),
      href: '/services#chatbots',
    },
    {
      icon: CubeIcon,
      title: t('services.integrations.title'),
      description: t('services.integrations.description'),
      href: '/services#integrations',
    },
    {
      icon: CodeBracketIcon,
      title: t('services.custom.title'),
      description: t('services.custom.description'),
      href: '/services#custom',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: t('services.mobile.title'),
      description: t('services.mobile.description'),
      href: '/services#mobile',
    },
    {
      icon: PaintBrushIcon,
      title: t('services.uxui.title'),
      description: t('services.uxui.description'),
      href: '/services#uxui',
    },
    {
      icon: ShieldCheckIcon,
      title: t('services.security.title'),
      description: t('services.security.description'),
      href: '/services#security',
    },
    {
      icon: CloudIcon,
      title: t('services.consulting.title'),
      description: t('services.consulting.description'),
      href: '/services#consulting',
    },
  ];

  const stats = [
    { value: '100+', label: th('stats.projects') },
    { value: '50+', label: th('stats.clients') },
    { value: '24/7', label: th('stats.support') },
    { value: '5★', label: th('stats.rating') },
  ];

  // Featured demos showcasing various industry solutions
  const featuredDemos = [
    {
      icon: ShoppingCartIcon,
      title: th('demos.ecommerce.title'),
      description: th('demos.ecommerce.description'),
      href: '/demo/ecommerce',
      category: th('demos.ecommerce.category'),
      color: 'from-green-500 to-green-700',
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: th('demos.chatbot.title'),
      description: th('demos.chatbot.description'),
      href: '/demo/chatbot',
      category: th('demos.chatbot.category'),
      color: 'from-purple-500 to-purple-700',
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
      {/* SEO Structured Data */}
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="softwareApplication" />
      <StructuredData type="localBusiness" />
      <FAQStructuredData />

      {/* Hero Section - SEO Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-padding">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            {/* Product Hunt Badge */}
            <div className="flex justify-center mb-6">
              <a
                href="https://www.producthunt.com/products/koptup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#DA552F]/10 hover:bg-[#DA552F]/20 border border-[#DA552F]/30 text-[#DA552F] dark:text-orange-400 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                <svg viewBox="0 0 40 40" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm4.375 22.5H16.25V30h-3.75V10H24.375a6.25 6.25 0 0 1 0 12.5z"/>
                  <path d="M24.375 13.75H16.25v5h8.125a2.5 2.5 0 0 0 0-5z"/>
                </svg>
                Nos verás en Product Hunt
              </a>
            </div>
            <Badge variant="primary" size="lg" className="mb-6">
              {t('common.tagline')}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-400 mb-10 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/pricing">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">{t('hero.cta2')}</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-secondary-600 dark:text-secondary-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
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
              {th('demos.sectionSubtitle')}
            </p>
          </div>

          {/* Demos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {featuredDemos.map((demo, index) => {
              const Icon = demo.icon;
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
                      <div className="mb-2">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          {demo.category}
                        </span>
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
              <Link href="/pricing">{th('cta.button')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
