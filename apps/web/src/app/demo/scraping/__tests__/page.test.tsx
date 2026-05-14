/**
 * Smoke test demo/scraping: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo scraping', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
