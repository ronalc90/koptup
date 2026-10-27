import { MetadataRoute } from 'next';
import { RAG_PATH, RAG_SECTORS } from '@/lib/rag-page';
import { SITE_URL } from '@/lib/site';
import { fetchSitemapCatalog, openDemoSlugs } from '@/lib/sitemap-demos';
import { isDemoVitrina } from '@/lib/demo-showcase';
import LAST_MODIFIED from '@/lib/sitemap-lastmod.json';

// Se regenera cada hora: así sigue al catálogo de demos que edita el admin.
// Next 15 lee esta opción sin ejecutar el módulo y solo acepta un literal
// (con la constante importada falla el build): es SITEMAP_REVALIDATE_SECONDS
// de lib/sitemap-demos.ts, y src/__tests__/sitemap-demos.test.ts comprueba
// que coincidan.
export const revalidate = 3600;

// Dominio canónico (con www).
const baseUrl = SITE_URL;

/**
 * Fecha de última modificación de cada URL: la del último commit que tocó sus
 * archivos (lib/sitemap-lastmod.json, generado por scripts/gen-lastmod.mjs).
 * Sin `new Date()` por deploy: no marcamos todo el sitio como "modificado hoy".
 * Una URL sin fecha en ese archivo sale sin `lastmod` en vez de con una inventada.
 */
const lastModifiedFor = (route: string): Date | undefined => {
  const date = (LAST_MODIFIED as Record<string, string>)[route];
  return date ? new Date(date) : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas indexables. `/pricing` se omite a propósito: redirige a
  // `/services`, y los sitemaps no deben listar URLs que redirigen.
  const staticPages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '', changeFrequency: 'weekly', priority: 1.0 },
    // Página principal de sistemas RAG y sus landings por sector
    // (/rag/salud, /rag/legal, /rag/soporte; fuente: src/lib/rag-page.ts).
    { path: RAG_PATH, changeFrequency: 'monthly', priority: 0.9 },
    ...RAG_SECTORS.map((s) => ({ path: s.path, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { path: '/desarrollo-web-colombia', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/chatbots-ia', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/demo', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/solicitar-demo', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Demos abiertas y activas según el catálogo que edita el admin (o la
  // tabla de respaldo si el backend no responde): las que requieren acceso o
  // invitación muestran una pantalla de acceso (noindex) a quien no lo tiene,
  // así que no se listan (lib/sitemap-demos.ts).
  // Solo las demos de vitrina se indexan (lib/demo-showcase.ts).
  const demoSlugs = openDemoSlugs(await fetchSitemapCatalog()).filter(isDemoVitrina);

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified: lastModifiedFor(p.path || '/'),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const demoEntries: MetadataRoute.Sitemap = demoSlugs.map((slug) => ({
    url: `${baseUrl}/demo/${slug}`,
    lastModified: lastModifiedFor(`/demo/${slug}`),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...demoEntries];
}
