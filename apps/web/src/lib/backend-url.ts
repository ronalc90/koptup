/**
 * Fuente única de verdad para la URL base del backend.
 *
 * Toda llamada al backend debe derivar de aquí. El fallback canónico es la URL
 * de producción en Railway; en local definí `NEXT_PUBLIC_API_URL` en `.env`.
 */
const RAW = (process.env.NEXT_PUBLIC_API_URL || 'https://koptupbackend-production.up.railway.app').trim();

const WITH_SCHEME = /^https?:\/\//i.test(RAW) ? RAW : `https://${RAW}`;

/** Origen del backend, sin slash final, sin sufijo `/api`. Ej: `https://host`. */
export const BACKEND_URL = WITH_SCHEME.replace(/\/+$/, '');

/** Base de la API REST, con `/api`. Ej: `https://host/api`. */
export const API_BASE = `${BACKEND_URL}/api`;
