/**
 * Smoke test demo/hrms: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo hrms', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
