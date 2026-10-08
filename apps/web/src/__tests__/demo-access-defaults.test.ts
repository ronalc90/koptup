/**
 * La tabla de respaldo del acceso a demos (src/lib/demo-access-defaults.ts)
 * debe coincidir con las carpetas de src/app/demo y con la semilla del
 * backend (apps/backend/src/middleware/access.ts y data/demo-catalog.seed.ts).
 * Si alguien agrega una demo o cambia un modo por defecto, esta prueba avisa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEMO_ACCESS_DEFAULTS, DEMO_DEFAULTS_BY_SLUG, PUBLIC_DEMO_SLUGS, isKnownDemoSlug } from '@/lib/demo-access-defaults';
import { DEMO_CATALOG_SLUGS } from '@/lib/demos';
import { DEMO_CARDS, EXTRA_DEMOS } from '@/components/demo/demo-cards';
import { parseDemoSlugsParam, whatsappLink, whatsappNumber } from '@/lib/demo-system';

const WEB = path.join(__dirname, '..', '..');
const BACKEND = path.join(WEB, '..', 'backend', 'src');

function demoFolders(): string[] {
  const dir = path.join(WEB, 'src', 'app', 'demo');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'page.tsx')))
    .map((e) => e.name)
    .sort();
}

describe('tabla de respaldo del acceso a demos', () => {
  it('tiene una entrada por cada carpeta de src/app/demo, sin repetir', () => {
    const slugs = DEMO_ACCESS_DEFAULTS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(demoFolders());
  });

  it('coincide con los modos por defecto del backend (DEFAULT_DEMO_ACCESS_MODES)', () => {
    const src = fs.readFileSync(path.join(BACKEND, 'middleware', 'access.ts'), 'utf8');
    const block = src.slice(src.indexOf('DEFAULT_DEMO_ACCESS_MODES'), src.indexOf('};', src.indexOf('DEFAULT_DEMO_ACCESS_MODES')));
    const backendModes: Record<string, string> = {};
    for (const m of block.matchAll(/'?([a-z0-9-]+)'?:\s*'(publico|solicitud|privado)'/g)) backendModes[m[1]] = m[2];
    const webModes = Object.fromEntries(DEMO_ACCESS_DEFAULTS.map((d) => [d.slug, d.accessMode]));
    expect(webModes).toEqual(backendModes);
  });

  it('usa los mismos nombres que la semilla del backend', () => {
    const src = fs.readFileSync(path.join(BACKEND, 'data', 'demo-catalog.seed.ts'), 'utf8');
    const names: Record<string, [string, string]> = {};
    for (const m of src.matchAll(/\['([a-z0-9-]+)',\s*'([^']+)',\s*'([^']+)'\]/g)) names[m[1]] = [m[2], m[3]];
    for (const d of DEMO_ACCESS_DEFAULTS) {
      expect([d.slug, d.nombre, d.nombreEn]).toEqual([d.slug, ...names[d.slug]]);
    }
  });

  it('la semilla deja abierta la demo del chatbot RAG y privadas las de salud', () => {
    expect(DEMO_DEFAULTS_BY_SLUG.chatbot.accessMode).toBe('publico');
    expect(DEMO_DEFAULTS_BY_SLUG['cuentas-medicas'].accessMode).toBe('privado');
    expect(DEMO_DEFAULTS_BY_SLUG['sistema-experto'].accessMode).toBe('privado');
    expect(PUBLIC_DEMO_SLUGS).not.toContain('erp');
    expect(isKnownDemoSlug('erp')).toBe(true);
    expect(isKnownDemoSlug('no-existe')).toBe(false);
    expect(isKnownDemoSlug('__proto__')).toBe(false);
  });

  it('el hub /demo pinta una tarjeta por cada demo del catálogo y las demás van en «Más demos»', () => {
    expect(DEMO_CARDS.map((c) => c.slug)).toEqual([...DEMO_CATALOG_SLUGS]);
    const covered = new Set([...DEMO_CARDS.map((c) => c.slug), ...EXTRA_DEMOS.map((c) => c.slug)]);
    expect([...covered].sort()).toEqual(demoFolders());
  });
});

describe('utilidades del sistema de demos', () => {
  it('?demos= acepta solo demos conocidas, sin repetir y máximo 10', () => {
    expect(parseDemoSlugsParam('erp, LMS,erp,no-existe', 'telemedicina')).toEqual(['erp', 'lms', 'telemedicina']);
    expect(parseDemoSlugsParam(null, undefined)).toEqual([]);
    const many = DEMO_ACCESS_DEFAULTS.map((d) => d.slug).join(',');
    expect(parseDemoSlugsParam(many)).toHaveLength(10);
  });

  it('número de WhatsApp: agrega el 57 a un celular colombiano sin indicativo', () => {
    expect(whatsappNumber('300 123 4567')).toBe('573001234567');
    expect(whatsappNumber('+57 (300) 123-4567')).toBe('573001234567');
    expect(whatsappNumber('0052 55 1234 5678')).toBe('525512345678');
    expect(whatsappNumber('123')).toBeNull();
    expect(whatsappNumber(null)).toBeNull();
    expect(whatsappLink('+573001234567', 'Hola & bienvenida')).toBe('https://wa.me/573001234567?text=Hola%20%26%20bienvenida');
    expect(whatsappLink('', 'x')).toBeNull();
  });
});
