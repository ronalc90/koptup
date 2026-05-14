/**
 * Smoke test demo/helpdesk-ia: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo helpdesk-ia', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
