/**
 * Smoke test demo/loyalty: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo loyalty', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
