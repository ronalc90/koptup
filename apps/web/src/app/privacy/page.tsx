'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  const t = useTranslations('privacyPage');

  const sections = [
    {
      icon: DocumentTextIcon,
      title: t('s1.title'),
      content: [
        { subtitle: t('s1.c1.subtitle'), text: t('s1.c1.text') },
        { subtitle: t('s1.c2.subtitle'), text: t('s1.c2.text') },
        { subtitle: t('s1.c3.subtitle'), text: t('s1.c3.text') },
      ],
    },
    {
      icon: UserGroupIcon,
      title: t('s2.title'),
      content: [
        { subtitle: t('s2.c1.subtitle'), text: t('s2.c1.text') },
        { subtitle: t('s2.c2.subtitle'), text: t('s2.c2.text') },
        { subtitle: t('s2.c3.subtitle'), text: t('s2.c3.text') },
        { subtitle: t('s2.c4.subtitle'), text: t('s2.c4.text') },
      ],
    },
    {
      icon: LockClosedIcon,
      title: t('s3.title'),
      content: [
        { subtitle: t('s3.c1.subtitle'), text: t('s3.c1.text') },
        { subtitle: t('s3.c2.subtitle'), text: t('s3.c2.text') },
        { subtitle: t('s3.c3.subtitle'), text: t('s3.c3.text') },
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: t('s4.title'),
      content: [
        { subtitle: t('s4.c1.subtitle'), text: t('s4.c1.text') },
        { subtitle: t('s4.c2.subtitle'), text: t('s4.c2.text') },
        { subtitle: t('s4.c3.subtitle'), text: t('s4.c3.text') },
        { subtitle: t('s4.c4.subtitle'), text: t('s4.c4.text') },
      ],
    },
    {
      icon: ClockIcon,
      title: t('s5.title'),
      content: [
        { subtitle: t('s5.c1.subtitle'), text: t('s5.c1.text') },
        { subtitle: t('s5.c2.subtitle'), text: t('s5.c2.text') },
        { subtitle: t('s5.c3.subtitle'), text: t('s5.c3.text') },
      ],
    },
  ];

  const rights = [
    { title: t('rights.r1.title'), description: t('rights.r1.description') },
    { title: t('rights.r2.title'), description: t('rights.r2.description') },
    { title: t('rights.r3.title'), description: t('rights.r3.description') },
    { title: t('rights.r4.title'), description: t('rights.r4.description') },
    { title: t('rights.r5.title'), description: t('rights.r5.description') },
    { title: t('rights.r6.title'), description: t('rights.r6.description') },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('updatedBadge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-100">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>{t('heroClaim')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-600 dark:bg-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-white dark:text-secondary-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                    {t('intro.title')}
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                    {t('intro.p1')}
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    {t('intro.p2')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Sections */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} variant="bordered" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary-50 dark:bg-primary-950 p-6 border-b border-secondary-200 dark:border-secondary-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-600 dark:bg-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white dark:text-secondary-900" />
                      </div>
                      <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {section.content.map((item, idx) => (
                      <div key={idx}>
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                          {item.subtitle}
                        </h3>
                        <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* User Rights */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('rights.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('rights.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((right, index) => (
              <Card key={index} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                      {right.title}
                    </h3>
                  </div>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {right.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card variant="bordered" className="mt-8 bg-secondary-50 dark:bg-secondary-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">
                {t('rights.exerciseTitle')}
              </h3>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                {t('rights.exerciseText')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <a href="mailto:ronald@koptup.com" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    ronald@koptup.com
                  </a>
                </div>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-4">
                {t('rights.responseTime')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Sections */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Cookies */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('s6.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('s6.p1')}</p>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('s6.p2')}</p>
              <p className="text-secondary-700 dark:text-secondary-300">
                {t('s6.p3')}{' '}
                <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
                  {t('s6.link')}
                </a>.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('s7.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('s7.p1')}</p>
              <p className="text-secondary-700 dark:text-secondary-300">{t('s7.p2')}</p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('s8.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300">{t('s8.p1')}</p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('s9.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('s9.p1')}</p>
              <p className="text-secondary-700 dark:text-secondary-300">{t('s9.p2')}</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('s10.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('s10.text')}</p>
              <div className="space-y-2 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center gap-2">
                  <strong>{t('s10.labelEmail')}</strong>
                  <a href="mailto:ronald@koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ronald@koptup.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <strong>{t('s10.labelPhone')}</strong>
                  <a href="tel:+573024794842" className="text-primary-600 dark:text-primary-400 hover:underline">
                    +57 302 479 4842
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <strong>{t('s10.labelAddress')}</strong>
                  <span>Av. 68 #1-63, Bogotá, Colombia</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Note */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-secondary-600 dark:text-secondary-400 mb-4">
            <ClockIcon className="h-5 w-5" />
            <span className="text-sm">{t('footer.updated')}</span>
          </div>
          <p className="text-sm text-secondary-500 dark:text-secondary-500">
            {t('footer.copyright')}
          </p>
        </div>
      </section>
    </>
  );
}
