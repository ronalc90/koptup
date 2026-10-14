/**
 * Smoke test demo/code-review-ia: la página debe renderizar sin throw y sin
 * claves de traducción inválidas, en español y en inglés.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo code-review-ia', () => {
  it('renderiza sin crashear (es)', () => {
    smokeRenderPage(Page);
  });

  it('renderiza sin crashear (en)', () => {
    smokeRenderPage(Page, { locale: 'en' });
  });
});
