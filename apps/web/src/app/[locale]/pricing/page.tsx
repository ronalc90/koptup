import { permanentRedirect } from '@/i18n/navigation';

// La antigua página de precios vive ahora en la sección de planes RAG de
// /services. Redirección permanente (308): los buscadores pasan la señal a
// /services.
export default function PricingPage({ params: { locale } }: { params: { locale: string } }) {
  permanentRedirect({ href: '/services#planes-rag', locale });
}
