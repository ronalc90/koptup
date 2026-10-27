import LAST_MODIFIED from '@/lib/sitemap-lastmod.json';
import { DEMOS_VITRINA } from '@/lib/demo-showcase';

const dates = LAST_MODIFIED as Record<string, string>;

describe('fechas de última modificación del sitemap', () => {
  it('tiene fecha AAAA-MM-DD válida para cada ruta', () => {
    for (const [route, date] of Object.entries(dates)) {
      expect(route.startsWith('/')).toBe(true);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(date).getTime())).toBe(false);
    }
  });

  it('cubre la portada, las páginas públicas y las demos de vitrina', () => {
    for (const route of ['/', '/rag', '/services', '/demo', '/contact', '/about', '/privacy', '/terms', '/cookies']) {
      expect(dates[route]).toBeDefined();
    }
    for (const slug of DEMOS_VITRINA) {
      expect(dates[`/demo/${slug}`]).toBeDefined();
    }
  });

  it('no tiene fechas futuras', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const date of Object.values(dates)) {
      expect(date <= today).toBe(true);
    }
  });
});
