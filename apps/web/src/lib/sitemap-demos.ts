/**
 * Demos que lista el sitemap: las abiertas y activas según el catálogo que
 * edita el administrador (Admin › Catálogo de demos, `GET /api/demo-catalog`).
 * Si el backend no responde, se usa la tabla de respaldo
 * (`lib/demo-access-defaults.ts`). Solo se listan rutas que existen (una
 * carpeta de `src/app/demo/<slug>`): las demos con solicitud o invitación, o
 * desactivadas, muestran una pantalla de acceso `noindex` a quien no tiene
 * acceso, así que no se listan.
 */
import { API_BASE } from './backend-url';
import { DEMO_ACCESS_DEFAULTS, isKnownDemoSlug } from './demo-access-defaults';

export interface SitemapCatalogEntry {
  slug?: unknown;
  accessMode?: unknown;
  activo?: unknown;
}

/** Slugs abiertos y activos de un catálogo (o de la semilla si `catalog` es null). */
export function openDemoSlugs(catalog: SitemapCatalogEntry[] | null): string[] {
  if (!catalog) {
    return DEMO_ACCESS_DEFAULTS.filter((d) => d.accessMode === 'publico').map((d) => d.slug);
  }
  const slugs = catalog
    .filter((item) => item && item.accessMode === 'publico' && item.activo !== false)
    .map((item) => String(item.slug ?? ''))
    .filter((slug) => isKnownDemoSlug(slug));
  return Array.from(new Set(slugs)).sort((a, b) => a.localeCompare(b));
}

const CATALOG_TIMEOUT_MS = 4000;
/** El sitemap se regenera como mucho cada hora (ISR). */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

/** Lee el catálogo público; null si el backend no responde o la respuesta no sirve. */
export async function fetchSitemapCatalog(): Promise<SitemapCatalogEntry[] | null> {
  try {
    const res = await fetch(`${API_BASE}/demo-catalog`, {
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    return Array.isArray(json?.data) ? (json.data as SitemapCatalogEntry[]) : null;
  } catch {
    return null;
  }
}
