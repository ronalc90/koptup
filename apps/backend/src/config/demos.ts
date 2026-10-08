/**
 * demos.ts — constantes del sistema de solicitud y acceso a demos.
 *
 * Especificación: docs/wiki/04-Sistema-de-Demos.md (secciones 3, 4, 6 y 10).
 * Los modos por defecto de cada demo están en `DEFAULT_DEMO_ACCESS_MODES`
 * (middleware/access.ts) y los nombres en data/demo-catalog.seed.ts.
 */

export const DEMO_ACCESS_MODES = ['publico', 'solicitud', 'privado'] as const;

/** Estados de una solicitud de demo. */
export const DEMO_REQUEST_STATES = ['pendiente', 'en_revision', 'aprobada', 'rechazada'] as const;
export type DemoRequestState = (typeof DEMO_REQUEST_STATES)[number];
/** Estados desde los que se puede aprobar o rechazar. */
export const DEMO_REQUEST_OPEN_STATES: readonly DemoRequestState[] = ['pendiente', 'en_revision'];

/**
 * Estados de un acceso (grant). La vigencia real la decide `expiresAt`.
 * `convertido`: la persona pasó a cliente (propuesta convertida); conserva la
 * demo como referencia hasta `expiresAt` (90 días desde la conversión).
 */
export const DEMO_GRANT_STATES = ['activo', 'expirado', 'revocado', 'convertido'] as const;
export type DemoGrantState = (typeof DEMO_GRANT_STATES)[number];

/** Tamaño de la empresa del solicitante (número de personas). */
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;

/** Propósito de un enlace mágico. */
export const MAGIC_LINK_PURPOSES = ['activacion', 'reset'] as const;
export type MagicLinkPurpose = (typeof MAGIC_LINK_PURPOSES)[number];

/** Vigencia del enlace de activación (72 h) y del de restablecer contraseña (1 h). */
export const ACTIVATION_TOKEN_TTL_MS = 72 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Vigencia por defecto de un acceso y límites al aprobar o extender. */
export const DEFAULT_GRANT_DAYS = 14;
export const MIN_GRANT_DAYS = 1;
export const MAX_GRANT_DAYS = 365;

/** Días antes del vencimiento en que se envía el recordatorio. */
export const GRANT_REMINDER_DAYS_BEFORE = 3;

/**
 * Permisos por rol (wiki §3). Siempre se verifican en el servidor.
 *  - Leer solicitudes y accesos: admin, sales, manager.
 *  - Notas, rechazar y reenviar el enlace de activación: admin y sales.
 *  - Aprobar, invitar, extender y revocar: admin y sales; si alguna demo es
 *    `privado`, solo admin.
 *  - Editar el catálogo (modo, activo, vigencia, orden): solo admin.
 *  - Abrir cualquier demo (staff): admin, sales, manager, developer.
 */
export const DEMO_READ_ROLES = ['admin', 'sales', 'manager'] as const;
export const DEMO_MANAGE_ROLES = ['admin', 'sales'] as const;
export const DEMO_PRIVATE_ROLES = ['admin'] as const;
export const DEMO_CATALOG_MANAGE_ROLES = ['admin'] as const;
export const DEMO_STAFF_ROLES = ['admin', 'sales', 'manager', 'developer'] as const;

export function isDemoStaffRole(role: string | null | undefined): boolean {
  return !!role && (DEMO_STAFF_ROLES as readonly string[]).includes(role);
}

export function canManagePrivateDemos(role: string | null | undefined): boolean {
  return !!role && (DEMO_PRIVATE_ROLES as readonly string[]).includes(role);
}

/** Roles del equipo: una solicitud con el email de uno de ellos no se aprueba. */
export const TEAM_ROLES = ['admin', 'sales', 'manager', 'developer'] as const;

/** Versión vigente de la política de tratamiento de datos (Ley 1581 de 2012). */
export function currentPrivacyPolicyVersion(): string {
  const v = process.env.PRIVACY_POLICY_VERSION?.trim();
  return v && v.length <= 40 ? v : '2026-10';
}

/** URL pública de la web (enlaces de los correos y de activación). */
export function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
}
