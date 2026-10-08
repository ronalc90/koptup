/**
 * Humo de TODAS las demos del catálogo (src/app/demo/<slug>/page.tsx), en
 * español y en inglés. La lista sale de las carpetas, así que una demo nueva
 * queda cubierta sin tocar este archivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { smokeRenderPageAsync } from '@/test-utils/smoke';
import type { TestLocale } from '@/test-utils/messages';

const DEMO_DIR = path.join(__dirname, '..', 'app', 'demo');

const slugs = fs
  .readdirSync(DEMO_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DEMO_DIR, entry.name, 'page.tsx')))
  .map((entry) => entry.name)
  .sort();

const LOCALES: TestLocale[] = ['es', 'en'];

describe('demos del catálogo', () => {
  it('encuentra las demos', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  describe.each(slugs)('demo %s', (slug) => {
    it.each(LOCALES)('renderiza en %s', async (locale) => {
      const Page = require(path.join(DEMO_DIR, slug, 'page.tsx')).default;
      await smokeRenderPageAsync(Page, { locale });
    });
  });
});
