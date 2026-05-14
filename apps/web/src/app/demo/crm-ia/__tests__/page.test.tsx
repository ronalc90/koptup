/**
 * Smoke test demo/crm-ia: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo crm-ia', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
