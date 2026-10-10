/**
 * Rutas cuya URL lleva un secreto: las etiquetas de medición no se cargan ahí
 * (components/analytics/Analytics.tsx).
 */
import { isNoTrackingPath } from '@/components/analytics/Analytics';

describe('analítica: rutas sin medición', () => {
  it.each(['/auth/callback', '/reset-password', '/activar/abc123token', '/activar'])('%s no se mide', (path) => {
    expect(isNoTrackingPath(path)).toBe(true);
  });

  it.each(['/', '/login', '/dashboard', '/activaciones', '/authors', '/demo/chatbot'])('%s sí se mide', (path) => {
    expect(isNoTrackingPath(path)).toBe(false);
  });
});
