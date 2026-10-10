'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isKnownDemoSlug } from '@/lib/demo-access-defaults';
import { apiRequest, hasSessionCookie, type DemoAccessDecision } from '@/lib/demo-system';

/** Cada cuánto se revisa el acceso con la demo abierta. */
const CHECK_EVERY_MS = 60_000;
/** Al volver a la pestaña se revisa, como mucho, cada 15 s. */
const MIN_GAP_MS = 15_000;
/** Motivos que significan que la persona ya no puede usar la demo. */
const LOST = new Set(['sin_sesion', 'sin_acceso', 'expirado', 'revocado', 'desactivada']);

/**
 * Vigila el acceso a una demo con acceso controlado mientras está abierta.
 * El middleware decide al cargar la página; varias demos funcionan solo en
 * el navegador, así que si el acceso vence, se revoca o la demo se desactiva
 * con la pestaña abierta, antes seguían funcionando hasta recargar. Ahora la
 * página se recarga y el middleware muestra la pantalla de acceso.
 *
 * - Las demos abiertas y el equipo no se vigilan (el primer chequeo lo dice).
 * - Si el backend no responde, no se hace nada (no se saca a nadie por una
 *   falla momentánea).
 * - El chequeo no cuenta como visita (`registrar=0`).
 */
export default function DemoAccessWatcher() {
  const pathname = usePathname();
  const slug = pathname?.split('/')[2] ?? '';

  useEffect(() => {
    if (!isKnownDemoSlug(slug)) return;
    let stopped = false;
    let lastCheck = 0;
    let timer: number | undefined;

    const check = async () => {
      if (stopped) return;
      lastCheck = Date.now();
      try {
        const d = await apiRequest<DemoAccessDecision>(`/demo-access/${encodeURIComponent(slug)}?registrar=0`, { auth: hasSessionCookie() });
        if (stopped) return;
        if (!d.allowed && LOST.has(d.reason)) {
          stopped = true;
          window.location.reload();
          return;
        }
        // Abierta al público o del equipo: no hay acceso que pueda vencer.
        if (d.allowed && (d.reason === 'publico' || d.reason === 'staff')) stop();
      } catch {
        /* backend no disponible: se reintenta en el siguiente ciclo */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > MIN_GAP_MS) void check();
    };
    const stop = () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };

    void check();
    timer = window.setInterval(() => void check(), CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return stop;
  }, [slug]);

  return null;
}
