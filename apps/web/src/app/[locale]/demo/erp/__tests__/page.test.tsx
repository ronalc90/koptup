/**
 * Smoke test demo/erp: la página renderiza sin errores ni claves de traducción
 * inválidas, en español y en inglés, y después de montar arma los datos de
 * ejemplo (filtros, indicadores, recorrido y módulos).
 */
import Page from '../page';
import { smokeRenderPage, smokeRenderPageAsync } from '@/test-utils/smoke';

describe('Demo erp', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each(['es', 'en'] as const)('después de montar muestra la demo completa (%s)', async (locale) => {
    const container = await smokeRenderPageAsync(Page, { locale });
    expect(container.querySelector('#erp-search')).not.toBeNull();
    expect(container.querySelector('#erp-recorrido')).not.toBeNull();
    expect(container.querySelectorAll('[role="tab"][id^="erp-tab-"]')).toHaveLength(7);
    expect(container.querySelector('a[href$="/demo"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/solicitar-demo?demos=erp"]')).not.toBeNull();
    expect(container.querySelector('a[href*="/contact?service=erp-modular"]')).not.toBeNull();
  });
});
