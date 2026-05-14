/**
 * Smoke test demo/moderacion-contenido: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo moderacion-contenido', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
