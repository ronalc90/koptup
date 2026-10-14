import { permanentRedirect } from 'next/navigation';

// La antigua página de precios vive ahora en la sección de planes RAG de
// /services. Redirección permanente (308): los buscadores pasan la señal a
// /services.
export default function PricingPage() {
  permanentRedirect('/services#planes-rag');
}
