'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface DemoCTAProps {
  demoName?: string;
}

export default function DemoCTA({ demoName }: DemoCTAProps) {
  const t = useTranslations('demoCTA');

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {demoName ? t('titleWithName', { demoName }) : t('title')}
        </h3>
        <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
          {t('description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="outline" className="bg-white text-primary-700 border-white hover:bg-primary-50" asChild>
            <Link href="/contact">{t('requestQuote')}</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10" asChild>
            <Link href="/pricing">{t('viewPricing')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
