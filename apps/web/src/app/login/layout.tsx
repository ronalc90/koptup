import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { privatePageMetadata } from '@/lib/seo-config';

/** Página de cuenta: título propio, `noindex` y canonical a su propia ruta. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageTitles');
  return privatePageMetadata(t('login'), '/login');
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
