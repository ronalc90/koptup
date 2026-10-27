/**
 * Smoke test demo/scraping: la página renderiza sin errores ni claves de
 * traducción inválidas, en español y en inglés, con el encabezado (qué es, para
 * quién, por dónde empezar), las salidas comerciales y el recorrido.
 */
import Page from '../page';
import { smokeRenderPage, smokeRenderPageAsync } from '@/test-utils/smoke';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/demo/scraping',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('Demo scraping', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each(['es', 'en'] as const)('muestra el encabezado, las salidas y el recorrido (%s)', async (locale) => {
    const container = await smokeRenderPageAsync(Page, { locale });
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('a[href$="/demo"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/solicitar-demo?demos=scraping"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/contact?service=scraping-extraccion"]')).not.toBeNull();
    expect(container.querySelector('#scraping-recorrido')).not.toBeNull();
    expect(container.querySelectorAll('[data-tour-step]')).toHaveLength(5);
    // Sin fecha fija en lo que se ve.
    expect(container.textContent).not.toMatch(/\b8 oct\. 2026|Oct 8, 2026/);
  });
});
