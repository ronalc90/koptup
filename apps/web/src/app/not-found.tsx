import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import BackButton from '@/components/errors/BackButton';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * Página 404. Título propio y sin la canonical ni el og:url de la home. El
 * `noindex` lo agrega Next a toda respuesta 404, así que aquí `robots: null`
 * quita el `index, follow` heredado del layout raíz y queda un solo meta robots.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFoundPage');
  return {
    title: t('metaTitle'),
    description: t('subtitle'),
    robots: null,
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}

export default async function NotFoundPage() {
  const t = await getTranslations('notFoundPage');

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
            <BackButton label={t('backButton')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
