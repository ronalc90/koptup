'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  const t = useTranslations('notFoundPage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 flex items-center justify-center px-4">
      <Card variant="elevated" className="max-w-xl w-full shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <Badge variant="primary" size="md">{t('badge')}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/"><HomeIcon className="h-5 w-5 mr-2" />{t('homeButton')}</Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => typeof window !== 'undefined' && window.history.back()}>
              {t('backButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
