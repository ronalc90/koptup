/**
 * Smoke test demo/delivery: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo delivery', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
