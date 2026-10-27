import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AreaDocumentTitle from '@/components/seo/AreaDocumentTitle';

/**
 * El panel es privado: no se indexa (el middleware además exige sesión y rol).
 * Título propio del área; cada sección lo afina en el navegador
 * (AreaDocumentTitle).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageTitles.admin');
  return {
    title: t('default'),
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AreaDocumentTitle area="admin" />
      {children}
    </>
  );
}
