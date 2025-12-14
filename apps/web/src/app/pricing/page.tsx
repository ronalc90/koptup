'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export default function PricingPage() {
  const t = useTranslations('pricingPage');
  const tc = useTranslations('common');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: t('plans.starter.name'),
      description: t('plans.starter.description'),
      icon: SparklesIcon,
      monthlyPrice: 499,
      annualPrice: 4970, // 17% de descuento
      popular: false,
      features: [
        { name: t('plans.starter.features.website5'), included: true },
        { name: t('plans.starter.features.customDesign'), included: true },
        { name: t('plans.starter.features.contactForm'), included: true },
        { name: t('plans.starter.features.basicSEO'), included: true },
        { name: t('plans.starter.features.hosting1year'), included: true },
        { name: t('plans.starter.features.ssl'), included: true },
        { name: t('plans.starter.features.revisions2'), included: true },
        { name: t('plans.starter.features.emailSupport'), included: true },
        { name: t('plans.starter.features.adminPanel'), included: false },
        { name: t('plans.starter.features.ecommerce'), included: false },
        { name: t('plans.starter.features.apiIntegrations'), included: false },
        { name: t('plans.starter.features.prioritySupport'), included: false },
      ],
      deliveryTime: t('plans.starter.deliveryTime'),
      support: t('plans.starter.support'),
    },
    {
      name: t('plans.professional.name'),
      description: t('plans.professional.description'),
      icon: RocketLaunchIcon,
      monthlyPrice: 1299,
      annualPrice: 12938, // 17% de descuento
      popular: true,
      features: [
        { name: t('plans.professional.features.website15'), included: true },
        { name: t('plans.professional.features.advancedDesign'), included: true },
        { name: t('plans.professional.features.adminPanel'), included: true },
        { name: t('plans.professional.features.blog'), included: true },
        { name: t('plans.professional.features.basicEcommerce'), included: true },
        { name: t('plans.professional.features.advancedSEO'), included: true },
        { name: t('plans.professional.features.googleAnalytics'), included: true },
        { name: t('plans.professional.features.hosting1year'), included: true },
        { name: t('plans.professional.features.ssl'), included: true },
        { name: t('plans.professional.features.revisions4'), included: true },
        { name: t('plans.professional.features.prioritySupport'), included: true },
        { name: t('plans.professional.features.apiIntegrations'), included: true },
        { name: t('plans.professional.features.training'), included: true },
        { name: t('plans.professional.features.basicChatbot'), included: false },
      ],
      deliveryTime: t('plans.professional.deliveryTime'),
      support: t('plans.professional.support'),
    },
    {
      name: t('plans.enterprise.name'),
      description: t('plans.enterprise.description'),
      icon: BuildingOfficeIcon,
      monthlyPrice: 2999,
      annualPrice: 29870, // 17% de descuento
      popular: false,
      features: [
        { name: t('plans.enterprise.features.unlimitedPages'), included: true },
        { name: t('plans.enterprise.features.premiumDesign'), included: true },
        { name: t('plans.enterprise.features.advancedAdmin'), included: true },
        { name: t('plans.enterprise.features.fullEcommerce'), included: true },
        { name: t('plans.enterprise.features.memberships'), included: true },
        { name: t('plans.enterprise.features.aiChatbot'), included: true },
        { name: t('plans.enterprise.features.mobileApp'), included: true },
        { name: t('plans.enterprise.features.unlimitedAPI'), included: true },
        { name: t('plans.enterprise.features.premiumSEO'), included: true },
        { name: t('plans.enterprise.features.dedicatedHosting'), included: true },
        { name: t('plans.enterprise.features.advancedSSL'), included: true },
        { name: t('plans.enterprise.features.unlimitedRevisions'), included: true },
        { name: t('plans.enterprise.features.support247'), included: true },
        { name: t('plans.enterprise.features.consulting'), included: true },
        { name: t('plans.enterprise.features.sla'), included: true },
      ],
      deliveryTime: t('plans.enterprise.deliveryTime'),
      support: t('plans.enterprise.support'),
    },
  ];

  const addons = [
    {
      name: t('addons.items.aiChatbot.name'),
      description: t('addons.items.aiChatbot.description'),
      price: 800,
      duration: t('addons.items.aiChatbot.duration'),
    },
    {
      name: t('addons.items.mobileApp.name'),
      description: t('addons.items.mobileApp.description'),
      price: 3500,
      duration: t('addons.items.mobileApp.duration'),
    },
    {
      name: t('addons.items.memberships.name'),
      description: t('addons.items.memberships.description'),
      price: 1200,
      duration: t('addons.items.memberships.duration'),
    },
    {
      name: t('addons.items.apiIntegration.name'),
      description: t('addons.items.apiIntegration.description'),
      price: 400,
      duration: t('addons.items.apiIntegration.duration'),
    },
    {
      name: t('addons.items.premiumSEO.name'),
      description: t('addons.items.premiumSEO.description'),
      price: 500,
      duration: t('addons.items.premiumSEO.duration'),
    },
    {
      name: t('addons.items.maintenance.name'),
      description: t('addons.items.maintenance.description'),
      price: 200,
      duration: t('addons.items.maintenance.duration'),
    },
  ];

  const faqs = [
    {
      question: t('faq.items.hosting.question'),
      answer: t('faq.items.hosting.answer'),
    },
    {
      question: t('faq.items.changePlan.question'),
      answer: t('faq.items.changePlan.answer'),
    },
    {
      question: t('faq.items.moreFeatures.question'),
      answer: t('faq.items.moreFeatures.answer'),
    },
    {
      question: t('faq.items.sourceCode.question'),
      answer: t('faq.items.sourceCode.answer'),
    },
    {
      question: t('faq.items.guarantee.question'),
      answer: t('faq.items.guarantee.answer'),
    },
    {
      question: t('faq.items.payment.question'),
      answer: t('faq.items.payment.answer'),
    },
    {
      question: t('faq.items.training.question'),
      answer: t('faq.items.training.answer'),
    },
    {
      question: t('faq.items.technologies.question'),
      answer: t('faq.items.technologies.answer'),
    },
  ];

  const getPrice = (monthlyPrice: number, annualPrice: number) => {
    return billingPeriod === 'monthly' ? monthlyPrice : Math.round(annualPrice / 12);
  };

  const getSavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - annualPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

  const formatPrice = (price: number) => {
    // Usar formato consistente sin locale para evitar problemas de hidratación
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <>
      {/* Hero Section */}
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
            <p className="text-xl md:text-2xl mb-10 text-primary-100">
              {t('hero.subtitle')}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full p-2 max-w-[95vw]">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-5 py-3 text-sm sm:px-8 sm:text-base rounded-full transition-all duration-300 ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-primary-600 font-semibold shadow-lg'
                      : 'text-white hover:text-primary-100 hover:bg-white/5'
                  }`}
                >
                  {t('billing.monthly')}
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-5 py-3 text-sm sm:px-8 sm:text-base rounded-full transition-all duration-300 relative ${
                    billingPeriod === 'annual'
                      ? 'bg-white text-primary-600 font-semibold shadow-lg'
                      : 'text-white hover:text-primary-100 hover:bg-white/5'
                  }`}
                >
                  {t('billing.annual')}
                </button>
              </div>
              <div className={`flex items-center gap-2 transition-opacity duration-300 ${
                billingPeriod === 'annual' ? 'opacity-100' : 'opacity-0'
              }`}>
                <span className="text-sm font-semibold bg-green-500 text-white px-4 py-1.5 rounded-full shadow-lg">
                  {t('billing.save')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = getPrice(plan.monthlyPrice, plan.annualPrice);
              const savings = getSavings(plan.monthlyPrice, plan.annualPrice);

              return (
                <Card
                  key={plan.name}
                  variant={plan.popular ? 'elevated' : 'bordered'}
                  className={`relative ${
                    plan.popular
                      ? 'border-primary-500 dark:border-primary-500 shadow-xl md:scale-105 md:z-10'
                      : 'hover:shadow-large'
                  } transition-all`}
                >
                  {plan.popular && (
                    <div className="mt-2 mb-4 flex justify-center md:absolute md:-top-4 md:left-1/2 md:-translate-x-1/2 md:mt-0 md:mb-0">
                      <Badge variant="primary" size="lg">
                        {t('plans.professional.popular')}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>

                    <div className="mt-6">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white">
                          ${formatPrice(price)}
                        </span>
                        <span className="text-secondary-600 dark:text-secondary-400">
                          /{t('billing.perMonth')}
                        </span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          {t('billing.saveAnnually').replace('{percent}', savings.toString())}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-secondary-400 dark:text-secondary-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              feature.included
                                ? 'text-secondary-700 dark:text-secondary-300'
                                : 'text-secondary-500 dark:text-secondary-500 line-through'
                            }`}
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Stats */}
                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          {t('stats.delivery')}
                        </span>
                        <span className="font-semibold text-secondary-900 dark:text-white">
                          {plan.deliveryTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                          <UserGroupIcon className="h-4 w-4" />
                          {t('stats.support')}
                        </span>
                        <span className="font-semibold text-secondary-900 dark:text-white">{plan.support}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      fullWidth
                      variant={plan.popular ? 'primary' : 'outline'}
                      asChild
                    >
                      <Link href="/contact">{t('ctaButton')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('addons.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('addons.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <Card key={addon.name} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    {addon.name}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                    {addon.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${addon.price}
                    </span>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {addon.duration}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              <Link href="/contact">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                {t('faq.contactButton')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CurrencyDollarIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('customPlan.title')}
          </h2>
          <p className="text-xl mb-10 text-primary-100">
            {t('customPlan.subtitle')}
          </p>
          <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
            <Link href="/contact">{t('customPlan.button')}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
