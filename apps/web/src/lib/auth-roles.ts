/**
 * Roles que dan acceso a las áreas internas de la web. Los usa el middleware
 * (verificación en el servidor) y los layouts del cliente, para que ambos
 * apliquen la misma regla. El backend vuelve a verificar cada endpoint.
 */

/** Panel /admin. */
export const ADMIN_PANEL_ROLES: readonly string[] = ['admin', 'manager'];

/** Equipo de KopTup (herramientas internas como /liquidacion). */
export const STAFF_ROLES: readonly string[] = ['admin', 'manager', 'sales'];

export function hasRole(role: string | null | undefined, allowed: readonly string[]): boolean {
  return !!role && allowed.includes(role);
}
