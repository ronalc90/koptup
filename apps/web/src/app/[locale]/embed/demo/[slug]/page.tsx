import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import ChatbotDemoPage from '@/app/[locale]/demo/chatbot/page';
import HelpdeskIaDemoPage from '@/app/[locale]/demo/helpdesk-ia/page';
import GestorDocumentosPage from '@/app/[locale]/demo/gestor-documentos/page';
import DashboardEjecutivoPage from '@/app/[locale]/demo/dashboard-ejecutivo/page';
import EcommerceDemoPage from '@/app/[locale]/demo/ecommerce/page';
import { DEMOS_VITRINA } from '@/lib/demo-showcase';

/**
 * /embed/demo/[slug] — una demo de vitrina sin el menú ni el pie del sitio,
 * para mostrarla dentro de un iframe. Solo las de `DEMOS_VITRINA`; cualquier
 * otra ruta responde 404. La cabecera frame-ancestors de /embed/* lo permite
 * (next.config.js). No se indexa (robots en embed/layout.tsx).
 */
const EMBEDDABLE_DEMOS: Record<string, ComponentType> = {
  chatbot: ChatbotDemoPage,
  'helpdesk-ia': HelpdeskIaDemoPage,
  'gestor-documentos': GestorDocumentosPage,
  'dashboard-ejecutivo': DashboardEjecutivoPage,
  ecommerce: EcommerceDemoPage,
};

export function generateStaticParams() {
  return DEMOS_VITRINA.filter((slug) => slug in EMBEDDABLE_DEMOS).map((slug) => ({ slug }));
}

export default async function EmbedDemoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const Demo = EMBEDDABLE_DEMOS[params.slug];
  if (!Demo || !(DEMOS_VITRINA as readonly string[]).includes(params.slug)) notFound();
  return <Demo />;
}
