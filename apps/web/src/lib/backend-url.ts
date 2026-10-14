/**
 * Fuente única de verdad para la URL base del backend.
 *
 * Toda llamada al backend debe derivar de aquí. El valor sale de
 * `NEXT_PUBLIC_API_URL` (se fija al compilar):
 *  - En Vercel y en `next build`/`next start`, Next carga `.env.production`,
 *    que tiene la URL pública de la API.
 *  - En `next dev` (y en las pruebas), sin la variable se usa el backend local
 *    `http://localhost:3001`: así un entorno de desarrollo nunca llama a la API
 *    de producción por accidente. Para otro puerto, crea `apps/web/.env.local`.
 */
const PRODUCTION_FALLBACK = 'https://koptupbackend-production.up.railway.app';
const DEVELOPMENT_FALLBACK = 'http://localhost:3001';

const RAW = (
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? PRODUCTION_FALLBACK : DEVELOPMENT_FALLBACK)
).trim();

const WITH_SCHEME = /^https?:\/\//i.test(RAW) ? RAW : `https://${RAW}`;

/** Origen del backend, sin slash final, sin sufijo `/api`. Ej: `https://host`. */
export const BACKEND_URL = WITH_SCHEME.replace(/\/+$/, '');

/** Base de la API REST, con `/api`. Ej: `https://host/api`. */
export const API_BASE = `${BACKEND_URL}/api`;
