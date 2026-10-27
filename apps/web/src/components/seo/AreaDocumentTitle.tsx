'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { TITLE_TEMPLATE } from '@/lib/site';

type Area = 'admin' | 'dashboard';

/**
 * Título del documento en el panel (/admin) y en el portal (/dashboard): sus
 * páginas son de cliente y no declaran metadata, así que el título sale de la
 * sección de la ruta (`pageTitles.<área>.<sección>`), p. ej. «Solicitudes de
 * demo · Panel | KopTup». Una sección sin título propio usa el del área. El
 * layout del área ya entrega en el HTML el título del área.
 */
export function areaTitleKey(area: Area, pathname: string | null): string {
  const parts = (pathname ?? '').split('/').filter(Boolean);
  if (parts[0] !== area) return 'default';
  return parts[1] ? parts[1] : 'home';
}

export default function AreaDocumentTitle({ area }: { area: Area }) {
  const t = useTranslations(`pageTitles.${area}`);
  const pathname = usePathname();

  useEffect(() => {
    const key = areaTitleKey(area, pathname);
    const section = key !== 'default' && t.has(key) ? t(key) : null;
    const title = section ? `${section} · ${t('suffix')}` : t('default');
    document.title = TITLE_TEMPLATE.replace('%s', title);
  }, [area, pathname, t]);

  return null;
}
