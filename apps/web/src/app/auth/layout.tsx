import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { privatePageMetadata } from '@/lib/seo-config';

/**
 * /auth/callback (retorno del inicio de sesión con Google): título propio,
 * `noindex` y canonical a su propia ruta, sin los parámetros de la URL.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageTitles');
  return privatePageMetadata(t('authCallback'), '/auth/callback');
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
