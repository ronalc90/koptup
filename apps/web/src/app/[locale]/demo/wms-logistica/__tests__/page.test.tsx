/**
 * Smoke test demo/wms-logistica: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo wms-logistica', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
