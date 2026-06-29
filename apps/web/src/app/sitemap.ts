import { MetadataRoute } from 'next';
import { OFFERINGS } from '@/lib/services-catalog';

const baseUrl = 'https://koptup.com';

/**
 * Fecha de última modificación estable. Usamos una constante (no `new Date()`)
 * para no marcar TODO el sitio como "modificado hoy" en cada deploy, lo que
 * envía una señal de frescura falsa a Google.
 */
const lastModified = new Date('2026-06-29');

/**
 * Demos auxiliares que existen como ruta y tienen SEO propio pero no forman
 * parte del catálogo de OFFERINGS.
 */
const AUX_DEMO_SLUGS = ['cuentas-medicas', 'sistema-experto', 'linkedin-ads'];

export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas indexables. `/pricing` se omite a propósito: redirige a
  // `/services`, y los sitemaps no deben listar URLs que redirigen.
  const staticPages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/desarrollo-web-colombia', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/chatbots-ia', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/soluciones-ia', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/demo', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Demos derivadas del catálogo (deduplicadas: algunos offerings comparten demo).
  const demoSlugs = Array.from(
    new Set([
      ...OFFERINGS.map((o) => o.demoSlug).filter(Boolean),
      ...AUX_DEMO_SLUGS,
    ]),
  );

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const demoEntries: MetadataRoute.Sitemap = demoSlugs.map((slug) => ({
    url: `${baseUrl}/demo/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...demoEntries];
}
