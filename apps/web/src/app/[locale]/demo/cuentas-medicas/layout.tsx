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

export default function CuentasMedicasLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Sistema experto para salud', url: '/demo/cuentas-medicas' },
  ]);

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
