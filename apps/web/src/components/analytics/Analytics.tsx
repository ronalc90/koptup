'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { GA_ID, GOOGLE_ADS_ID, HAS_TRACKING_TAGS, LINKEDIN_PARTNER_ID } from '@/lib/analytics';
import { onCookiePreferencesChange, readCookiePreferences } from '@/lib/cookie-consent';

/**
 * Etiquetas de medición para anuncios, montadas una vez en el layout raíz.
 *
 * Nada se carga si falta la variable de entorno de la etiqueta o si el
 * visitante no aceptó su categoría de cookies:
 *  - Google tag (gtag.js) + `config` de GA4: `NEXT_PUBLIC_GA_ID` y `analytics`.
 *  - Google tag + `config` de Google Ads: `NEXT_PUBLIC_GOOGLE_ADS_ID` y
 *    `marketing`.
 *  - LinkedIn Insight Tag: `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` y `marketing`.
 *
 * Escucha `cookie-consent-changed` (banner y /cookies) y `storage` (otras
 * pestañas): al aceptar, carga lo que falte sin recargar. Un script ya cargado
 * no se puede descargar; si se retira el consentimiento, se actualiza el modo
 * de consentimiento de Google a `denied` y se desactiva GA4
 * (`ga-disable-<ID>`), y /cookies recarga la página para que no quede ninguna
 * etiqueta activa (LinkedIn no tiene forma de apagarse en caliente).
 *
 * En las rutas cuya URL lleva secretos (`NO_TRACKING_PATHS`) las etiquetas no
 * se inicializan, para que esa URL no llegue a Google ni a LinkedIn.
 */

/**
 * Rutas con tokens en la URL: `/auth/callback?accessToken=…&refreshToken=…`
 * (OAuth) y `/reset-password?token=…`. Se llega a ellas con una carga completa
 * (redirección del backend o enlace del email), así que ninguna etiqueta está
 * cargada todavía; se cargan al salir hacia otra ruta si hay consentimiento.
 */
const NO_TRACKING_PATHS = ['/auth', '/reset-password'];

function isNoTrackingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return NO_TRACKING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js';
const LINKEDIN_SRC = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

interface Consent {
  analytics: boolean;
  marketing: boolean;
}

// Estado de la página (las etiquetas son globales a la pestaña): sobrevive a
// un remontaje del componente y evita configurar dos veces.
const loaded = {
  gtagSrcId: null as string | null,
  ga: false,
  ads: false,
  linkedin: false,
};

function readConsent(): Consent {
  const prefs = readCookiePreferences();
  return { analytics: prefs?.analytics === true, marketing: prefs?.marketing === true };
}

/** Estado para el modo de consentimiento de Google. */
function googleConsentState(consent: Consent): Record<string, 'granted' | 'denied'> {
  const ads = consent.marketing ? 'granted' : 'denied';
  return {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

function setGaDisabled(id: string, disabled: boolean): void {
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = disabled;
}

function gtag(...args: unknown[]): void {
  window.gtag?.(...args);
}

/** Define `dataLayer`/`gtag` y el consentimiento inicial (antes de cargar gtag.js). */
function initGoogleTag(consent: Consent): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtagShim() {
      // gtag.js espera el objeto `arguments`, no un array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
  gtag('consent', 'default', googleConsentState(consent));
  gtag('set', 'ads_data_redaction', !consent.marketing);
  gtag('js', new Date());
}

function initLinkedIn(partnerId: string): void {
  window._linkedin_partner_id = partnerId;
  const ids = (window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []);
  if (!ids.includes(partnerId)) ids.push(partnerId);
  if (!window.lintrk) {
    const queue: unknown[] = [];
    const lintrk = ((a: unknown, b: unknown) => {
      queue.push([a, b]);
    }) as NonNullable<Window['lintrk']>;
    lintrk.q = queue;
    window.lintrk = lintrk;
  }
}

/**
 * Aplica el consentimiento guardado. Devuelve qué scripts hay que pintar.
 */
function applyConsent(): { gtagSrcId: string | null; linkedin: boolean } {
  const consent = readConsent();
  const useGa = Boolean(GA_ID) && consent.analytics;
  const useAds = Boolean(GOOGLE_ADS_ID) && consent.marketing;

  if (loaded.gtagSrcId) {
    // gtag.js ya está en la página: refleja el cambio (también los retiros).
    gtag('consent', 'update', googleConsentState(consent));
    gtag('set', 'ads_data_redaction', !consent.marketing);
    if (GA_ID && loaded.ga) setGaDisabled(GA_ID, !consent.analytics);
  } else if (useGa || useAds) {
    initGoogleTag(consent);
    loaded.gtagSrcId = useGa ? GA_ID : GOOGLE_ADS_ID;
  }

  if (useGa && GA_ID && !loaded.ga) {
    setGaDisabled(GA_ID, false);
    gtag('config', GA_ID);
    loaded.ga = true;
  }
  if (useAds && GOOGLE_ADS_ID && !loaded.ads) {
    gtag('config', GOOGLE_ADS_ID);
    loaded.ads = true;
  }

  if (LINKEDIN_PARTNER_ID && consent.marketing && !loaded.linkedin) {
    initLinkedIn(LINKEDIN_PARTNER_ID);
    loaded.linkedin = true;
  }

  return { gtagSrcId: loaded.gtagSrcId, linkedin: loaded.linkedin };
}

export default function Analytics() {
  const paused = isNoTrackingPath(usePathname());
  const [gtagSrcId, setGtagSrcId] = useState<string | null>(loaded.gtagSrcId);
  const [linkedin, setLinkedin] = useState(loaded.linkedin);

  useEffect(() => {
    if (!HAS_TRACKING_TAGS || paused) return;
    const sync = () => {
      const next = applyConsent();
      setGtagSrcId(next.gtagSrcId);
      setLinkedin(next.linkedin);
    };
    sync();
    return onCookiePreferencesChange(sync);
  }, [paused]);

  if (!HAS_TRACKING_TAGS) return null;

  return (
    <>
      {gtagSrcId ? (
        <Script
          id="google-tag"
          src={`${GTAG_SRC}?id=${encodeURIComponent(gtagSrcId)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {linkedin ? <Script id="linkedin-insight" src={LINKEDIN_SRC} strategy="afterInteractive" /> : null}
    </>
  );
}
