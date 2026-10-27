import { absoluteUrl } from '@/lib/site';

/**
 * Rutas por idioma. El español va sin prefijo (`/about`) y el inglés con `/en`
 * (`/en/about`); ver src/i18n/routing.ts.
 */
export function localizedPath(path: string, locale: string): string {
  const clean = path === '/' ? '' : path;
  if (locale === 'en') return clean ? `/en${clean}` : '/en';
  return clean || '/';
}

export function localizedUrl(path: string, locale: string): string {
  return absoluteUrl(localizedPath(path, locale));
}

/**
 * Canonical y hreflang de una página: la versión de cada idioma se apunta a sí
 * misma y el español también es `x-default`.
 */
export function localeAlternates(path: string, locale: string) {
  return {
    canonical: localizedUrl(path, locale),
    languages: {
      es: localizedUrl(path, 'es'),
      en: localizedUrl(path, 'en'),
      'x-default': localizedUrl(path, 'es'),
    },
  };
}
