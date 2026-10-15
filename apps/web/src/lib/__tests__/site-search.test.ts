import { DEMOS_VISIBLES } from '@/lib/demo-showcase';
import { SEARCH_ENTRIES, normalizeSearchText, searchSite } from '@/lib/site-search';

describe('buscador del sitio', () => {
  it('tiene una entrada con nombre para cada demo visible y ninguna oculta', () => {
    const hrefs = SEARCH_ENTRIES.map((entry) => entry.href);
    for (const slug of DEMOS_VISIBLES) {
      expect(hrefs).toContain(`/demo/${slug}`);
    }
    for (const href of hrefs.filter((href) => href.startsWith('/demo/'))) {
      expect(DEMOS_VISIBLES).toContain(href.replace('/demo/', ''));
    }
  });

  it('no busca sin texto', () => {
    expect(searchSite('', 'es')).toEqual([]);
    expect(searchSite('   ', 'en')).toEqual([]);
  });

  it('ignora tildes y mayúsculas', () => {
    expect(normalizeSearchText('Facturación Électrónica')).toBe('facturacion electronica');
    expect(searchSite('FACTURACION', 'es').map((r) => r.href)).toContain('/demo/facturacion-electronica');
  });

  it('exige todas las palabras buscadas', () => {
    expect(searchSite('chatbot ecommerce', 'es')).toEqual([]);
    expect(searchSite('precios planes', 'es')[0]?.href).toBe('/services');
  });

  it('devuelve la etiqueta del idioma pedido', () => {
    expect(searchSite('contacto', 'en')[0]?.label).toBe('Contact and 30-minute call');
    expect(searchSite('contacto', 'es')[0]?.label).toBe('Contacto y agenda de 30 minutos');
  });

  it('no devuelve demos ocultas', () => {
    expect(searchSite('erp', 'es').map((r) => r.href)).not.toContain('/demo/erp');
    expect(searchSite('telemedicina', 'es')).toEqual([]);
  });
});
