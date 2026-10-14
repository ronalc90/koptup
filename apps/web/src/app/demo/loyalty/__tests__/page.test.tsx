/**
 * Humo de demo/loyalty: la página monta, arma los datos con la fecha de hoy
 * después de montar y no usa claves de traducción inexistentes (ES y EN).
 */
import Page from '../page';
import { smokeRenderPageAsync } from '@/test-utils/smoke';

describe('Demo loyalty', () => {
  it('renderiza en español con los datos de hoy', async () => {
    const container = await smokeRenderPageAsync(Page, { locale: 'es' });
    expect(container.textContent).toContain('Primeros pasos');
    expect(container.textContent).toContain('Laura Martínez Ríos');
  });

  it('renderiza en inglés', async () => {
    const container = await smokeRenderPageAsync(Page, { locale: 'en' });
    expect(container.textContent).toContain('Getting started');
  });
});
