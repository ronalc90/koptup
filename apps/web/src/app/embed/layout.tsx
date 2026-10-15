import type { Metadata } from 'next';

/**
 * Rutas /embed/*: páginas pensadas para mostrarse dentro de un iframe en el
 * sitio de un cliente (ver apps/web/public/widget.js). No se indexan.
 * next.config.js permite incrustarlas en cualquier sitio (frame-ancestors *).
 */
export const metadata: Metadata = {
  title: 'Demo de KopTup',
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
