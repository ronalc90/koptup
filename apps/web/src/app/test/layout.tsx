import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * `/test` es un playground interno para probar endpoints manualmente.
 * No debe ser accesible ni indexable en producción: devolvemos 404 cuando
 * `NODE_ENV === 'production'` y marcamos noindex en cualquier entorno.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <>{children}</>;
}
