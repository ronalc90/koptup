import { redirect } from '@/i18n/navigation';

// Ruta heredada: el panel de administración vive ahora en la vista "Admin" de
// la demo (/demo/ecommerce?view=admin), con el mismo catálogo y precios en COP.
export default function LegacyEcommerceAdminPage({ params: { locale } }: { params: { locale: string } }) {
  redirect({ href: { pathname: '/demo/ecommerce', query: { view: 'admin' } }, locale });
}
