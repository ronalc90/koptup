/**
 * Smoke test demo/telemedicina: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo telemedicina', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
