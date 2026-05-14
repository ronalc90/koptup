/**
 * Smoke test demo/automatizacion: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo automatizacion', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
