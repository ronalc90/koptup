/**
 * Smoke test demo/erp: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo erp', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
