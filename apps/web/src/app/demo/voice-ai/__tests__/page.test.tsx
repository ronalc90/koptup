/**
 * Smoke test demo/voice-ai: la página debe renderizar sin throw.
 */
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';

describe('Demo voice-ai', () => {
  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });
});
