import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VerifyView from '../components/VerifyView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoLms.verify');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: { index: false, follow: false },
  };
}

export default function VerifyCertificatePage() {
  return <VerifyView />;
}
