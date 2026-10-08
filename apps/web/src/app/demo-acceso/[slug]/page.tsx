import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import DemoAccessGate from '@/components/demo/DemoAccessGate';
import { DEMO_ACCESS_MODES, DEMO_DEFAULTS_BY_SLUG, type DemoAccessMode, isKnownDemoSlug } from '@/lib/demo-access-defaults';
import { type DemoAccessReason, isDeniedReason } from '@/lib/demo-system';

/**
 * Pantalla "Solicita acceso" de una demo (wiki 04, §9 y §10).
 *
 * El middleware (src/middleware.ts) reescribe aquí /demo/<slug> cuando la demo
 * requiere acceso y la sesión no lo tiene, con `?motivo=…&modo=…&ruta=…` (la
 * URL del navegador sigue siendo /demo/<slug>). Si se abre directamente sin
 * motivo, el componente consulta GET /api/demo-access/<slug>.
 */
export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
  searchParams: { motivo?: string; modo?: string; vence?: string; ruta?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const robots = { index: false, follow: false };
  const demo = DEMO_DEFAULTS_BY_SLUG[params.slug];
  if (!demo) return { robots };
  const [locale, t] = await Promise.all([getLocale(), getTranslations('demoAccess')]);
  return {
    title: t('metaTitle', { name: locale === 'en' ? demo.nombreEn : demo.nombre }),
    robots,
    alternates: { canonical: `/demo/${demo.slug}` },
  };
}

export default function DemoAccessPage({ params, searchParams }: Props) {
  const slug = params.slug;
  if (!isKnownDemoSlug(slug)) notFound();

  const reason: DemoAccessReason | null = isDeniedReason(searchParams.motivo) ? searchParams.motivo : null;
  const mode: DemoAccessMode | null = (DEMO_ACCESS_MODES as readonly string[]).includes(searchParams.modo ?? '')
    ? (searchParams.modo as DemoAccessMode)
    : null;
  const expiresAt = searchParams.vence && !Number.isNaN(Date.parse(searchParams.vence)) ? searchParams.vence : null;
  // Solo rutas de esta demo (evita redirecciones abiertas desde el enlace de inicio de sesión).
  const ruta = searchParams.ruta ?? '';
  const returnPath = ruta === `/demo/${slug}` || ruta.startsWith(`/demo/${slug}/`) || ruta.startsWith(`/demo/${slug}?`) ? ruta : `/demo/${slug}`;

  return <DemoAccessGate slug={slug} initialReason={reason} initialMode={mode} expiresAt={expiresAt} returnPath={returnPath} />;
}
