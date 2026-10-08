/**
 * Piezas puras del sistema de demos: semilla del catálogo, vigencia de un
 * acceso, normalización y enmascarado de emails y escape de HTML.
 */
import fs from 'fs';
import path from 'path';
import { DEMO_CATALOG_SEED } from '../../data/demo-catalog.seed';
import { DEFAULT_DEMO_ACCESS_MODES } from '../../middleware/access';
import { daysLeft, effectiveGrantState } from '../../services/demo-access.service';
import { escapeHtml, maskEmail, normalizeEmailLikeAuth } from '../../utils/email-address';
import { generateRequestCode } from '../../services/demo-requests.service';
import { hashToken, isWellFormedToken } from '../../services/magic-link.service';

const DAY = 24 * 60 * 60 * 1000;

describe('semilla del catálogo de demos', () => {
  it('tiene las 28 demos con los modos fijados (18 públicas, 8 por solicitud, 2 privadas)', () => {
    expect(DEMO_CATALOG_SEED).toHaveLength(28);
    expect(new Set(DEMO_CATALOG_SEED.map((d) => d.slug)).size).toBe(28);
    expect(DEMO_CATALOG_SEED.map((d) => d.slug).sort()).toEqual(Object.keys(DEFAULT_DEMO_ACCESS_MODES).sort());
    const byMode = (mode: string) => DEMO_CATALOG_SEED.filter((d) => d.accessMode === mode).map((d) => d.slug).sort();
    expect(byMode('solicitud')).toEqual(['delivery', 'erp', 'hrms', 'linkedin-ads', 'lms', 'telemedicina', 'voice-ai', 'wms-logistica']);
    expect(byMode('privado')).toEqual(['cuentas-medicas', 'sistema-experto']);
    expect(byMode('publico')).toHaveLength(18);
    for (const d of DEMO_CATALOG_SEED) {
      expect(d.nombre.length).toBeGreaterThan(2);
      expect(d.nombreEn.length).toBeGreaterThan(2);
      expect(d.activo).toBe(true);
      expect(d.duracionDiasPorDefecto).toBe(14);
    }
  });

  it('cada demo de la semilla es una carpeta real de apps/web/src/app/demo (y viceversa)', () => {
    const demoDir = path.resolve(__dirname, '../../../../web/src/app/demo');
    const folders = fs
      .readdirSync(demoDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(demoDir, e.name, 'page.tsx')))
      .map((e) => e.name)
      .sort();
    expect(DEMO_CATALOG_SEED.map((d) => d.slug).sort()).toEqual(folders);
  });
});

describe('vigencia de un acceso', () => {
  const now = new Date('2026-10-08T12:00:00Z');

  it('activo con fecha futura → activo; con fecha pasada → expirado aunque diga activo', () => {
    expect(effectiveGrantState({ estado: 'activo', expiresAt: new Date(now.getTime() + DAY) }, now)).toBe('activo');
    expect(effectiveGrantState({ estado: 'activo', expiresAt: new Date(now.getTime() - 1) }, now)).toBe('expirado');
    expect(effectiveGrantState({ estado: 'activo', expiresAt: now }, now)).toBe('expirado');
    expect(effectiveGrantState({ estado: 'expirado', expiresAt: new Date(now.getTime() + DAY) }, now)).toBe('expirado');
    expect(effectiveGrantState({ estado: 'revocado', expiresAt: new Date(now.getTime() + DAY) }, now)).toBe('revocado');
  });

  it('días restantes redondea hacia arriba y nunca es negativo', () => {
    expect(daysLeft(new Date(now.getTime() + 14 * DAY), now)).toBe(14);
    expect(daysLeft(new Date(now.getTime() + 13 * DAY + 1), now)).toBe(14);
    expect(daysLeft(new Date(now.getTime() + 60_000), now)).toBe(1);
    expect(daysLeft(new Date(now.getTime() - DAY), now)).toBe(0);
  });
});

describe('emails y textos', () => {
  it('normaliza igual que el login (minúsculas; Gmail sin puntos ni +alias)', async () => {
    expect(await normalizeEmailLikeAuth('John.Doe+demo@Gmail.com')).toBe('johndoe@gmail.com');
    expect(await normalizeEmailLikeAuth('  Ana.Perez@Empresa.CO ')).toBe('ana.perez@empresa.co');
    expect(await normalizeEmailLikeAuth('no-es-email')).toBeNull();
    expect(await normalizeEmailLikeAuth(42)).toBeNull();
  });

  it('enmascara el email y escapa HTML', () => {
    expect(maskEmail('ana.perez@empresa.co')).toBe('a***z@empresa.co');
    expect(maskEmail('al@x.co')).toBe('a***@x.co');
    expect(escapeHtml('<script>alert("x")</script> & \'y\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
  });

  it('código de solicitud y tokens', () => {
    expect(generateRequestCode(new Date('2026-01-01T00:00:00Z'))).toMatch(/^DR-2026-[A-HJ-NP-Z2-9]{6}$/);
    expect(isWellFormedToken('a'.repeat(43))).toBe(true);
    expect(isWellFormedToken('../etc/passwd')).toBe(false);
    expect(isWellFormedToken(undefined)).toBe(false);
    expect(hashToken('abc')).toMatch(/^[a-f0-9]{64}$/);
  });
});
