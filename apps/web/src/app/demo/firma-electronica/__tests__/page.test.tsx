/**
 * Smoke test demo/firma-electronica: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo firma-electronica', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
