import { redirect } from 'next/navigation';

// La antigua página de precios vive ahora en la sección de planes RAG de /services.
export default function PricingPage() {
  redirect('/services#planes-rag');
}
