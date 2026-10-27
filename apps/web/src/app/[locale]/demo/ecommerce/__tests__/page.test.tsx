/**
 * Smoke test demo/ecommerce: la página renderiza sin errores ni claves de
 * traducción inválidas, en español y en inglés, con el encabezado (qué es, para
 * quién, por dónde empezar), las salidas comerciales y el recorrido.
 */
import Page from '../page';
import { smokeRenderPage, smokeRenderPageAsync } from '@/test-utils/smoke';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/demo/ecommerce',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('Demo ecommerce', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each(['es', 'en'] as const)('muestra el encabezado, las salidas y el recorrido (%s)', async (locale) => {
    const container = await smokeRenderPageAsync(Page, { locale });
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('a[href$="/demo"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/solicitar-demo?demos=ecommerce"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/contact?service=ecommerce"]')).not.toBeNull();
    expect(container.querySelector('#ecommerce-recorrido')).not.toBeNull();
    expect(container.querySelectorAll('[data-tour-step]')).toHaveLength(5);
    expect(container.textContent).not.toMatch(/Servientrega|Coordinadora|Interrapid/);
  });
});
