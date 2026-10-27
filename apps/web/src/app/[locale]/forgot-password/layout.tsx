import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { privatePageMetadata } from '@/lib/seo-config';

/** Página de cuenta: título propio, `noindex` y canonical a su propia ruta. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageTitles');
  return privatePageMetadata(t('forgotPassword'), '/forgot-password', await getLocale());
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
