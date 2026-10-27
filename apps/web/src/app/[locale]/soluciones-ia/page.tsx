import { permanentRedirect } from '@/i18n/navigation';
import { RAG_PATH } from '@/lib/rag-page';

/** Esta página se unió a la oferta RAG completa: redirección permanente. */
export default function SolucionesIaPage({ params: { locale } }: { params: { locale: string } }) {
  permanentRedirect({ href: RAG_PATH, locale });
}
