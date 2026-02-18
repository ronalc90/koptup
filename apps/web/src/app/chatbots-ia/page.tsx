'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function ChatbotsIAPage() {
  const t = useTranslations('chatbotsPage');

  const benefits = [
    { icon: ClockIcon, title: t('b1t'), desc: t('b1d') },
    { icon: DevicePhoneMobileIcon, title: t('b2t'), desc: t('b2d') },
    { icon: BoltIcon, title: t('b3t'), desc: t('b3d') },
    { icon: ArrowPathIcon, title: t('b4t'), desc: t('b4d') },
    { icon: UserGroupIcon, title: t('b5t'), desc: t('b5d') },
    { icon: CurrencyDollarIcon, title: t('b6t'), desc: t('b6d') },
  ];

  const useCases = [
    { title: t('u1t'), desc: t('u1d') },
    { title: t('u2t'), desc: t('u2d') },
    { title: t('u3t'), desc: t('u3d') },
    { title: t('u4t'), desc: t('u4d') },
    { title: t('u5t'), desc: t('u5d') },
    { title: t('u6t'), desc: t('u6d') },
  ];

  const process = [
    { title: t('p1t'), desc: t('p1d') },
    { title: t('p2t'), desc: t('p2d') },
    { title: t('p3t'), desc: t('p3d') },
    { title: t('p4t'), desc: t('p4d') },
  ];

  const faqs = [
    { q: t('q1q'), a: t('q1a') },
    { q: t('q2q'), a: t('q2a') },
    { q: t('q3q'), a: t('q3a') },
    { q: t('q4q'), a: t('q4a') },
    { q: t('q5q'), a: t('q5a') },
    { q: t('q6q'), a: t('q6a') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" asChild>
                <Link href="/demo/chatbot">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
                <Link href="/contact">{t('hero.cta2')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: t('stats.s1v'), l: t('stats.s1l') },
              { v: t('stats.s2v'), l: t('stats.s2l') },
              { v: t('stats.s3v'), l: t('stats.s3l') },
              { v: t('stats.s4v'), l: t('stats.s4l') },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">{s.v}</div>
                <div className="text-sm md:text-base text-secondary-600 dark:text-secondary-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('why.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('why.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{b.title}</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">{b.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('useCasesTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('useCasesSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((u, i) => (
              <Card key={i} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{u.title}</h3>
                  </div>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">{u.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-gradient-to-br from-purple-50 to-secondary-50 dark:from-secondary-900 dark:to-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('processTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('processSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{p.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-12 text-center">
            {t('faqTitle')}
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Card key={i} variant="bordered">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-3">{f.q}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-purple-600 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-xl text-purple-100 mb-10">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50" asChild>
              <Link href="/demo/chatbot">{t('ctaButton')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href="/contact">{useTranslations('common')('requestQuote')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
