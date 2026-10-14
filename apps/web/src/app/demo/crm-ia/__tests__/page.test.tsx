/**
 * Humo de demo/crm-ia: la página monta en español y en inglés, ya con el
 * estado hidratado (fecha de hoy), sin claves de traducción faltantes.
 */
import Page from '../page';
import { smokeRenderPageAsync } from '@/test-utils/smoke';

describe('Demo crm-ia', () => {
  it('renderiza sin crashear en español', async () => {
    const container = await smokeRenderPageAsync(Page);
    expect(container.textContent).toContain('Recorrido sugerido');
    expect(container.textContent).toContain('Embudo de ventas');
  });

  it('renderiza sin crashear en inglés', async () => {
    const container = await smokeRenderPageAsync(Page, { locale: 'en' });
    expect(container.textContent).toContain('Suggested tour');
    expect(container.textContent).toContain('Sales pipeline');
  });
});
