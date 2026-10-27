import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Enlaces, redirecciones y hooks que conservan el idioma de la URL. Úsalos en
 * lugar de `next/link` y de `usePathname`/`useRouter`/`redirect` de
 * `next/navigation`: los de Next no agregan el prefijo `/en`.
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } = createNavigation(routing);
