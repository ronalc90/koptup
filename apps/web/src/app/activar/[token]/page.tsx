import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ActivateAccount from '@/components/demo-request/ActivateAccount';

/**
 * Activación de la cuenta con el enlace de un solo uso que se genera al
 * aprobar una solicitud de demo (wiki 04, §7.2). La página valida el enlace al
 * cargar (POST /api/auth/activate/check, sin consumirlo) y lo consume al
 * fijar la contraseña (POST /api/auth/activate), que devuelve la sesión.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('activate');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function ActivatePage({ params }: { params: { token: string } }) {
  return <ActivateAccount token={decodeURIComponent(params.token ?? '')} />;
}
