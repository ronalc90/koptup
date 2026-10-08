/**
 * Consentimiento de cookies: fuente única para leer y guardar la elección del
 * visitante.
 *
 * Se guarda en `localStorage['cookie_preferences']` (la misma clave que ya
 * usaba la página /cookies) como
 * `{ essential, functional, analytics, marketing, timestamp }`.
 *
 * - `analytics`: habilita Google Analytics 4.
 * - `marketing`: habilita la etiqueta de Google Ads y LinkedIn Insight Tag.
 * - Un valor ausente o distinto de `true` cuenta como `false` (conservador):
 *   las preferencias guardadas antes de que existiera `marketing` no lo
 *   habilitan.
 *
 * Quien guarda (banner o /cookies) usa `saveCookiePreferences`, que emite
 * `CONSENT_CHANGED_EVENT` en `window` para que las etiquetas se carguen sin
 * recargar la página (ver `components/analytics/Analytics.tsx`).
 */

export const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

/** Evento de `window` que se emite cada vez que se guarda una elección. */
export const CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

/** Categorías opcionales que el visitante puede aceptar o rechazar. */
export interface CookieConsentChoice {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookiePreferences extends CookieConsentChoice {
  /** Las esenciales siempre están activas. */
  essential: true;
  /** Momento de la elección (ISO 8601). */
  timestamp: string;
}

/** "Aceptar" / "Aceptar todas": todas las categorías activas. */
export const ACCEPT_ALL_CHOICE: CookieConsentChoice = {
  functional: true,
  analytics: true,
  marketing: true,
};

/** "Rechazar" / "Solo esenciales": ninguna categoría opcional. */
export const ESSENTIAL_ONLY_CHOICE: CookieConsentChoice = {
  functional: false,
  analytics: false,
  marketing: false,
};

// Si el navegador bloquea localStorage (modo privado estricto, cookies
// deshabilitadas…), la elección se respeta igual durante la visita.
let memoryPreferences: CookiePreferences | null = null;

function normalize(raw: unknown): CookiePreferences | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  return {
    essential: true,
    functional: value.functional === true,
    analytics: value.analytics === true,
    marketing: value.marketing === true,
    timestamp: typeof value.timestamp === 'string' ? value.timestamp : '',
  };
}

/**
 * Elección guardada, o `null` si el visitante todavía no ha elegido (o si el
 * valor guardado no se puede leer). Solo en el navegador.
 */
export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (stored === null) return memoryPreferences;
    return normalize(JSON.parse(stored)) ?? memoryPreferences;
  } catch {
    return memoryPreferences;
  }
}

/** Guarda la elección y avisa a las etiquetas (`CONSENT_CHANGED_EVENT`). */
export function saveCookiePreferences(choice: CookieConsentChoice): CookiePreferences {
  const preferences: CookiePreferences = {
    essential: true,
    functional: choice.functional === true,
    analytics: choice.analytics === true,
    marketing: choice.marketing === true,
    timestamp: new Date().toISOString(),
  };
  memoryPreferences = preferences;
  if (typeof window === 'undefined') return preferences;
  try {
    window.localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Sin almacenamiento: queda en memoria hasta que se cierre la pestaña.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  return preferences;
}

/**
 * Se suscribe a los cambios de consentimiento: los de esta pestaña
 * (`CONSENT_CHANGED_EVENT`) y los de otras pestañas del mismo sitio (`storage`).
 * Devuelve la función para cancelar la suscripción.
 */
export function onCookiePreferencesChange(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === COOKIE_PREFERENCES_KEY) listener();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
