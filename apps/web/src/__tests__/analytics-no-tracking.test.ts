/**
 * Rutas cuya URL lleva un secreto, y el chat del widget (/embed/*) dentro del
 * sitio de un cliente: las etiquetas de medición no se cargan ahí ni se
 * muestra el banner de cookies (components/analytics/Analytics.tsx).
 */
import { isNoTrackingPath } from '@/components/analytics/Analytics';

describe('analítica: rutas sin medición', () => {
  it.each(['/auth/callback', '/reset-password', '/activar/abc123token', '/activar', '/embed/chatbot/kbot_abc123', '/embed'])('%s no se mide', (path) => {
    expect(isNoTrackingPath(path)).toBe(true);
  });

  it.each(['/', '/login', '/dashboard', '/activaciones', '/authors', '/demo/chatbot', '/embedded'])('%s sí se mide', (path) => {
    expect(isNoTrackingPath(path)).toBe(false);
  });
});
