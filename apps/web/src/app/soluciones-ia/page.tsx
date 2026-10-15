import { permanentRedirect } from 'next/navigation';
import { RAG_PATH } from '@/lib/rag-page';

/** Esta página se unió a la oferta RAG completa: redirección permanente. */
export default function SolucionesIaPage() {
  permanentRedirect(RAG_PATH);
}
