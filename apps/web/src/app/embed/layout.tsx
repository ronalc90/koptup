import type { Metadata } from 'next';

/**
 * Rutas /embed/*: páginas pensadas para mostrarse dentro de un iframe en el
 * sitio de un cliente (ver apps/web/public/widget.js). No se indexan.
 * next.config.js permite incrustarlas en cualquier sitio (frame-ancestors *).
 */
export const metadata: Metadata = {
  title: 'Chat del asistente',
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* El chat ocupa toda la ventana del iframe: sin scroll ni márgenes reservados para la barra de desplazamiento. */}
      <style>{'html{scrollbar-gutter:auto!important}html,body{overflow:hidden!important}'}</style>
      {children}
    </>
  );
}
