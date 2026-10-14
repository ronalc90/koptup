/**
 * Smoke test demo/facturacion-electronica: la página renderiza sin errores ni claves de
 * traducción inválidas, en español y en inglés, y después de montar arma los datos de
 * ejemplo con la fecha de hoy (indicadores, recorrido, emisión, documentos, RADIAN y libros).
 */
import Page from '../page';
import { smokeRenderPage, smokeRenderPageAsync } from '@/test-utils/smoke';

describe('Demo facturacion-electronica', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each(['es', 'en'] as const)('después de montar muestra la demo completa (%s)', async (locale) => {
    const container = await smokeRenderPageAsync(Page, { locale });
    expect(container.querySelector('#recorrido')).not.toBeNull();
    expect(container.querySelectorAll('[role="tab"][id^="fe-tab-"]')).toHaveLength(5);
    for (const id of ['emision', 'documentos', 'recepcion', 'reportes']) expect(container.querySelector(`#${id}`)).not.toBeNull();
    expect(container.querySelector('a[href="/demo"]')).not.toBeNull();
    expect(container.querySelector('a[href="/solicitar-demo?demos=facturacion-electronica"]')).not.toBeNull();
    expect(container.querySelector('a[href="/contact?service=facturacion-electronica"]')).not.toBeNull();
  });
});
