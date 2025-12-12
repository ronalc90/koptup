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
  DocumentMagnifyingGlassIcon,
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

  // SEO-focused medical services for Colombia
  const medicalServices = [
    {
      icon: DocumentMagnifyingGlassIcon,
      title: 'Auditoría Médica con IA',
      description: 'Auditoría automatizada de cuentas médicas con inteligencia artificial. Valida procedimientos, diagnósticos y tarifas.',
      href: '/demo/auditoria-medica',
      keywords: 'auditoría médica, IA salud, validación facturas',
    },
    {
      icon: CheckCircleIcon,
      title: 'Gestión de Glosas',
      description: 'Identifica y previene glosas administrativas y técnicas. Reduce rechazos en facturación médica hasta un 80%.',
      href: '/demo/cuentas-medicas',
      keywords: 'glosas médicas, reducción glosas, facturación salud',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Liquidación Automatizada',
      description: 'Liquidación de cuentas médicas con tarifas SOAT, ISS y contratos EPS (Nueva EPS, Salud Total, Compensar).',
      href: '/demo/cuentas-medicas',
      keywords: 'liquidación médica, tarifas SOAT, contratos EPS',
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: 'Chatbot Médico IA',
      description: 'Asistente virtual inteligente para consultas sobre normatividad, CUPS, CIE-10 y procedimientos médicos.',
      href: '/demo/chatbot',
      keywords: 'chatbot médico, asistente IA salud, normatividad',
    },
  ];

  return (
    <>
      {/* SEO Structured Data */}
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="softwareApplication" />
      <FAQStructuredData />

      {/* Hero Section - SEO Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-padding">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
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

      {/* Medical Services Section - SEO Optimized */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="primary" size="md" className="mb-4">
              Soluciones para el Sector Salud
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Auditoría Médica y Gestión de Glosas con Inteligencia Artificial
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Optimiza la facturación hospitalaria, reduce glosas y automatiza la auditoría médica con IA.
              Soluciones especializadas para IPS, hospitales y clínicas en Colombia.
            </p>
          </div>

          {/* Medical Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {medicalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Link key={index} href={service.href}>
                  <Card
                    variant="bordered"
                    className="h-full hover:shadow-large hover:border-primary-400 dark:hover:border-primary-600 transition-all group"
                  >
                    <CardHeader>
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {service.description}
                      </CardDescription>
                      <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Ver demo →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Key Benefits - SEO Content */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-950 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-8 text-center">
              ¿Por qué elegir KopTup para tu institución de salud?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  Reduce glosas hasta 80%
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Identifica y corrige errores antes de radicar. Valida automáticamente códigos CUPS, CIE-10 y tarifas.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  Optimiza facturación médica
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Liquida automáticamente con tarifas SOAT, ISS 2001, ISS 2004 y contratos EPS actualizados.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                  Cumple normatividad vigente
                </h4>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Integra Ley 100, Resolución 3047, guías de práctica clínica y normatividad actualizada del sector salud.
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
