/**
 * Medición para anuncios: IDs de las etiquetas y helper `track()` de eventos.
 *
 * Las etiquetas (GA4, Google Ads y LinkedIn Insight Tag) las carga
 * `components/analytics/Analytics.tsx`, solo si existe su variable de entorno
 * y solo después de que el visitante acepte cookies (`lib/cookie-consent.ts`):
 *  - GA4 (`NEXT_PUBLIC_GA_ID`, "G-…"): categoría `analytics`.
 *  - Google Ads (`NEXT_PUBLIC_GOOGLE_ADS_ID`, "AW-…"): categoría `marketing`.
 *  - LinkedIn Insight Tag (`NEXT_PUBLIC_LINKEDIN_PARTNER_ID`, numérico):
 *    categoría `marketing`.
 *
 * Eventos (GA4; las conversiones de Google Ads se importan desde GA4, no hay
 * etiquetas de conversión propias en el código):
 *  - `generate_lead`: formulario enviado con éxito; `lead_source` indica cuál
 *    (`contact_form` en /contact, `demo-request` en /solicitar-demo).
 *  - `demo_start`: primera pregunta en /demo/chatbot (por carga de página).
 *  - `demo_upload`: documento subido con éxito en "Prueba con tu documento".
 *  - `whatsapp_click`: clic en un enlace de WhatsApp.
 *  - `plan_click`: clic en el CTA de un plan (`plan_name`).
 */
import { readCookiePreferences } from '@/lib/cookie-consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    lintrk?: ((...args: unknown[]) => void) & { q?: unknown[] };
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
  }
}

/* -------------------------------------------------------------------------- */
/* IDs (variables NEXT_PUBLIC_*: Next las fija en el build)                    */
/* -------------------------------------------------------------------------- */

/** ID de medición de GA4 ("G-XXXXXXXXXX"); `null` si falta o no es válido. */
export const GA_ID = parseId(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]+$/i);

/**
 * ID de la etiqueta de Google Ads ("AW-123456789"). Se acepta también solo el
 * número y se le antepone "AW-".
 */
export const GOOGLE_ADS_ID = parseId(withAwPrefix(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID), /^AW-\d+$/i);

/** Partner ID de LinkedIn Insight Tag (numérico). */
export const LINKEDIN_PARTNER_ID = parseId(process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID, /^\d+$/);

/**
 * ¿Hay al menos una etiqueta configurada en este build? Sin ninguna no se
 * carga nada y tampoco se muestra el banner de cookies (no hay cookies
 * opcionales que aceptar); /cookies sigue disponible.
 */
export const HAS_TRACKING_TAGS = Boolean(GA_ID || GOOGLE_ADS_ID || LINKEDIN_PARTNER_ID);

/**
 * Un ID que no tiene el formato esperado se ignora (la etiqueta no se carga):
 * los IDs terminan dentro de URLs y llamadas a las etiquetas.
 */
function parseId(raw: string | undefined, pattern: RegExp): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  if (!pattern.test(value)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[analytics] ID con formato inválido, se ignora: "${value}"`);
    }
    return null;
  }
  return value.toUpperCase();
}

function withAwPrefix(raw: string | undefined): string | undefined {
  const value = (raw ?? '').trim();
  return /^\d+$/.test(value) ? `AW-${value}` : raw;
}

/* -------------------------------------------------------------------------- */
/* Eventos                                                                     */
/* -------------------------------------------------------------------------- */

export type AnalyticsEventName =
  | 'generate_lead'
  | 'demo_start'
  | 'demo_upload'
  | 'whatsapp_click'
  | 'plan_click';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Envía un evento a las etiquetas de Google cargadas (GA4 y, si está
 * configurada y aceptada, Google Ads). No hace nada —ni falla— si el
 * visitante no ha aceptado cookies, si las etiquetas no están cargadas o si
 * se llama en el servidor. Los parámetros vacíos (`undefined`/`null`/'') no
 * se envían. Nunca envíes datos personales (email, nombre, teléfono).
 */
export function track(event: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const consent = readCookiePreferences();
    if (!consent || !(consent.analytics || consent.marketing)) return;
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;

    const clean: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      clean[key] = value;
    }
    gtag('event', event, clean);
  } catch {
    // La medición nunca debe romper la página.
  }
}

/** Clic en el CTA de un plan (planes RAG y "Otras soluciones a medida"). */
export interface PlanClickParams extends AnalyticsParams {
  /** Nombre del plan tal como se muestra (p. ej. "Piloto RAG", "CRM con IA"). */
  plan_name: string;
  /** ID estable del plan: id del plan RAG o slug de la solución del catálogo. */
  plan_id: string;
  /** `planes_rag` o `otras_soluciones`. */
  plan_group: 'planes_rag' | 'otras_soluciones';
  /** Qué botón: `quote` (cotizar/contratar), `details` (ver más) o `demo`. */
  cta: 'quote' | 'details' | 'demo';
}

export function trackPlanClick(params: PlanClickParams): void {
  track('plan_click', params);
}

/** Clic en un enlace de WhatsApp. `link_location`: dónde está el enlace. */
export function trackWhatsappClick(linkLocation: string): void {
  track('whatsapp_click', { link_location: linkLocation });
}

/** ¿Hay alguna etiqueta de medición cargada en esta página? */
export function areTrackingTagsLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.gtag === 'function' || typeof window.lintrk === 'function';
}
