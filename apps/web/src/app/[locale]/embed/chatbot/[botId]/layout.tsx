import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'Chat del asistente', template: '%s | KopTup' } };

/**
 * Chat del widget: ocupa toda la ventana del iframe, sin scroll ni margen para
 * la barra de desplazamiento. Va solo aquí; las demos embebidas sí scrollean.
 */
export default function EmbedChatbotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{'html{scrollbar-gutter:auto!important}html,body{overflow:hidden!important}'}</style>
      {children}
    </>
  );
}
