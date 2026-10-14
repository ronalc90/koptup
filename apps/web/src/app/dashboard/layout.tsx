import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AreaDocumentTitle from '@/components/seo/AreaDocumentTitle';

/**
 * El portal es privado: no se indexa (el middleware además exige sesión).
 * Título propio del área; cada sección lo afina en el navegador
 * (AreaDocumentTitle).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageTitles.dashboard');
  return {
    title: t('default'),
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AreaDocumentTitle area="dashboard" />
      {children}
    </>
  );
}
