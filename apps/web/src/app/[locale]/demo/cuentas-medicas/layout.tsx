import { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

// Demo privada (solo con acceso concedido por el admin): no se indexa.
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...pageMetadata('demo-cuentas-medicas', await getLocale()),
    robots: { index: false, follow: false },
  };
}

export default async function CuentasMedicasLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Demos', nameEn: 'Demos', url: '/demo' },
    { name: 'Sistema experto para salud', nameEn: 'Healthcare expert system', url: '/demo/cuentas-medicas' },
  ], locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
