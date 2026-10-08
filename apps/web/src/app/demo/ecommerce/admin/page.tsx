import { redirect } from 'next/navigation';

// Ruta heredada: el panel de administración vive ahora en la vista "Admin" de
// la demo (/demo/ecommerce?view=admin), con el mismo catálogo y precios en COP.
export default function LegacyEcommerceAdminPage() {
  redirect('/demo/ecommerce?view=admin');
}
