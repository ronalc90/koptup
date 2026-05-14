/**
 * Smoke test demo/code-review-ia: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo code-review-ia', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
