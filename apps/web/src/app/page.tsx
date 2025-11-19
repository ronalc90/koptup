'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ShoppingCartIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CloudIcon,
  CubeIcon,
  PaintBrushIcon,
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

  return (
    <>
      {/* Hero Section */}
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

      {/* Services Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
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
