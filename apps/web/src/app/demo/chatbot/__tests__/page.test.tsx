/**
 * Smoke test demo/chatbot: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo chatbot', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
