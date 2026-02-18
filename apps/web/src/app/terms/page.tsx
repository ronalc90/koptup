'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  DocumentCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface ContentItem {
  subtitle?: string;
  text: string;
}

interface Section {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  content: ContentItem[];
}

interface AdditionalTerm {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  content: string;
}

export default function TermsPage() {
  const t = useTranslations('termsPage');

  const sections: Section[] = [
    {
      icon: DocumentCheckIcon,
      title: t('s1.title'),
      content: [
        { text: t('s1.c1.text') },
        { text: t('s1.c2.text') },
        { text: t('s1.c3.text') },
      ],
    },
    {
      icon: CodeBracketIcon,
      title: t('s2.title'),
      content: [
        { subtitle: t('s2.c1.subtitle'), text: t('s2.c1.text') },
        { subtitle: t('s2.c2.subtitle'), text: t('s2.c2.text') },
        { subtitle: t('s2.c3.subtitle'), text: t('s2.c3.text') },
      ],
    },
    {
      icon: BanknotesIcon,
      title: t('s3.title'),
      content: [
        { subtitle: t('s3.c1.subtitle'), text: t('s3.c1.text') },
        { subtitle: t('s3.c2.subtitle'), text: t('s3.c2.text') },
        { subtitle: t('s3.c3.subtitle'), text: t('s3.c3.text') },
        { subtitle: t('s3.c4.subtitle'), text: t('s3.c4.text') },
      ],
    },
    {
      icon: ScaleIcon,
      title: t('s4.title'),
      content: [
        { subtitle: t('s4.c1.subtitle'), text: t('s4.c1.text') },
        { subtitle: t('s4.c2.subtitle'), text: t('s4.c2.text') },
        { subtitle: t('s4.c3.subtitle'), text: t('s4.c3.text') },
        { subtitle: t('s4.c4.subtitle'), text: t('s4.c4.text') },
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: t('s5.title'),
      content: [
        { subtitle: t('s5.c1.subtitle'), text: t('s5.c1.text') },
        { subtitle: t('s5.c2.subtitle'), text: t('s5.c2.text') },
        { subtitle: t('s5.c3.subtitle'), text: t('s5.c3.text') },
      ],
    },
    {
      icon: ClockIcon,
      title: t('s6.title'),
      content: [
        { subtitle: t('s6.c1.subtitle'), text: t('s6.c1.text') },
        { subtitle: t('s6.c2.subtitle'), text: t('s6.c2.text') },
        { subtitle: t('s6.c3.subtitle'), text: t('s6.c3.text') },
      ],
    },
    {
      icon: ExclamationTriangleIcon,
      title: t('s7.title'),
      content: [
        { subtitle: t('s7.c1.subtitle'), text: t('s7.c1.text') },
        { subtitle: t('s7.c2.subtitle'), text: t('s7.c2.text') },
        { subtitle: t('s7.c3.subtitle'), text: t('s7.c3.text') },
        { subtitle: t('s7.c4.subtitle'), text: t('s7.c4.text') },
      ],
    },
  ];

  const additionalTerms: AdditionalTerm[] = [
    { icon: UserGroupIcon, title: t('at1.title'), content: t('at1.content') },
    { icon: ExclamationTriangleIcon, title: t('at2.title'), content: t('at2.content') },
    { icon: ScaleIcon, title: t('at3.title'), content: t('at3.content') },
    { icon: DocumentCheckIcon, title: t('at4.title'), content: t('at4.content') },
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
              <ScaleIcon className="h-5 w-5" />
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
                  <DocumentCheckIcon className="h-6 w-6 text-white dark:text-secondary-900" />
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
                    {section.content.map((item: ContentItem, idx) => (
                      <div key={idx}>
                        {item.subtitle && (
                          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                            {item.subtitle}
                          </h3>
                        )}
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

      {/* Additional Terms */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {additionalTerms.map((term, index) => {
            const Icon = term.icon;
            return (
              <Card key={index} variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">
                        {term.title}
                      </h2>
                      <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                        {term.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4 text-center">
                {t('contact.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-6 text-center">
                {t('contact.text')}
              </p>
              <div className="space-y-3 text-secondary-700 dark:text-secondary-300 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">{t('contact.labelCompany')}</strong>
                  <span>KopTup - Soluciones Tecnológicas</span>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">{t('contact.labelEmail')}</strong>
                  <a href="mailto:ronald@koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ronald@koptup.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">{t('contact.labelPhone')}</strong>
                  <a href="tel:+573024794842" className="text-primary-600 dark:text-primary-400 hover:underline">
                    +57 302 479 4842
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <strong className="min-w-[100px]">{t('contact.labelAddress')}</strong>
                  <span>Av. 68 #1-63, Bogotá, Colombia</span>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">{t('contact.labelWeb')}</strong>
                  <a href="https://www.koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    www.koptup.com
                  </a>
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
          <p className="text-sm text-secondary-500 dark:text-secondary-500 mb-2">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              {t('footer.linkPrivacy')}
            </a>
            <span className="text-secondary-400">•</span>
            <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
              {t('footer.linkCookies')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
