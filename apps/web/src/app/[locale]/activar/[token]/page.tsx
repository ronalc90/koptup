import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import ActivateAccount from '@/components/demo-request/ActivateAccount';
import { privatePageMetadata } from '@/lib/seo-config';

/**
 * Activación de la cuenta con el enlace de un solo uso que se genera al
 * aprobar una solicitud de demo (wiki 04, §7.2). La página valida el enlace al
 * cargar (POST /api/auth/activate/check, sin consumirlo) y lo consume al
 * fijar la contraseña (POST /api/auth/activate), que devuelve la sesión.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('activate');
  // noindex y sin canonical: el segmento de la ruta es el token de un solo uso.
  return privatePageMetadata(t('metaTitle'), null, await getLocale());
}

export default async function ActivatePage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  return <ActivateAccount token={decodeURIComponent(params.token ?? '')} />;
}
