import { notFound } from 'next/navigation';

/**
 * Cualquier ruta sin página bajo el segmento de idioma: 404 dentro de
 * [locale]/layout.tsx, así la página de error sale con el idioma de la URL
 * (lang y textos). Las rutas con página tienen prioridad sobre este comodín.
 */
export default function CatchAllNotFound() {
  notFound();
}
