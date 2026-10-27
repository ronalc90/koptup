/**
 * Humo de demo/delivery: la página monta en español y en inglés, ya con el
 * estado hidratado (fecha de hoy), sin claves de traducción faltantes, con la
 * salida al catálogo, las salidas comerciales y el recorrido sugerido.
 */
import Page from '../page';
import { smokeRenderPageAsync } from '@/test-utils/smoke';

describe('Demo delivery', () => {
  it('renderiza sin crashear en español', async () => {
    const container = await smokeRenderPageAsync(Page);
    const text = container.textContent ?? '';
    expect(text).toContain('Volver al catálogo de demos');
    expect(text).toContain('Recorrido sugerido');
    expect(text).toContain('Datos de ejemplo');
    expect(container.querySelector('a[href="/solicitar-demo?demos=delivery"]')).not.toBeNull();
    expect(container.querySelector('a[href="/contact?service=app-delivery"]')).not.toBeNull();
  });

  it('renderiza sin crashear en inglés', async () => {
    const container = await smokeRenderPageAsync(Page, { locale: 'en' });
    const text = container.textContent ?? '';
    expect(text).toContain('Back to the demo catalog');
    expect(text).toContain('Suggested walkthrough');
    expect(text).toContain('Sample data');
  });
});
