/**
 * El sitemap lista las demos abiertas y activas según el catálogo del
 * backend; si no responde, según la tabla de respaldo.
 */
import { SITEMAP_REVALIDATE_SECONDS, openDemoSlugs } from '@/lib/sitemap-demos';
import { DEMO_ACCESS_DEFAULTS } from '@/lib/demo-access-defaults';
import { revalidate } from '@/app/sitemap';

describe('revalidate de app/sitemap.ts', () => {
  it('es el mismo intervalo que la caché del catálogo', () => {
    // app/sitemap.ts repite el número como literal (Next 15 no acepta ahí una constante importada).
    expect(revalidate).toBe(SITEMAP_REVALIDATE_SECONDS);
  });
});

describe('openDemoSlugs', () => {
  it('sin catálogo usa las demos abiertas de la semilla', () => {
    const expected = DEMO_ACCESS_DEFAULTS.filter((d) => d.accessMode === 'publico').map((d) => d.slug);
    expect(openDemoSlugs(null)).toEqual(expected);
    expect(openDemoSlugs(null)).not.toContain('erp');
  });

  it('sigue el modo y el estado que fijó el administrador', () => {
    const slugs = openDemoSlugs([
      { slug: 'chatbot', accessMode: 'publico', activo: true },
      { slug: 'erp', accessMode: 'publico', activo: true }, // el admin la abrió
      { slug: 'crm-ia', accessMode: 'solicitud', activo: true }, // el admin la cerró
      { slug: 'pos', accessMode: 'publico', activo: false }, // desactivada
      { slug: 'cuentas-medicas', accessMode: 'privado', activo: true },
    ]);
    expect(slugs).toEqual(['chatbot', 'erp']);
  });

  it('ignora slugs sin ruta, repetidos o mal formados', () => {
    const slugs = openDemoSlugs([
      { slug: 'no-existe', accessMode: 'publico', activo: true },
      { slug: 'chatbot', accessMode: 'publico' },
      { slug: 'chatbot', accessMode: 'publico' },
      { slug: 42, accessMode: 'publico' },
      {},
    ]);
    expect(slugs).toEqual(['chatbot']);
  });
});
