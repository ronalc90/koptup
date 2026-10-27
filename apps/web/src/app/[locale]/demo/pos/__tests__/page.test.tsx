/**
 * Smoke test demo/pos: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo pos', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
