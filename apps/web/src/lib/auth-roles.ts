/**
 * Roles que dan acceso a las áreas internas de la web. Los usa el middleware
 * (verificación en el servidor) y los layouts del cliente, para que ambos
 * apliquen la misma regla. El backend vuelve a verificar cada endpoint.
 */

/** Panel /admin (secciones de operación: pedidos, facturas, usuarios…). */
export const ADMIN_PANEL_ROLES: readonly string[] = ['admin', 'manager'];

/**
 * Secciones comerciales del panel (solicitudes, accesos y catálogo de demos).
 * `sales` gestiona solicitudes y accesos; el backend limita qué puede hacer
 * cada rol (p. ej. solo `admin` edita el catálogo o aprueba demos privadas).
 */
export const DEMO_ADMIN_ROLES: readonly string[] = ['admin', 'manager', 'sales'];

/** Rutas del panel que usan DEMO_ADMIN_ROLES en lugar de ADMIN_PANEL_ROLES. */
export const DEMO_ADMIN_PATHS: readonly string[] = ['/admin/solicitudes', '/admin/accesos', '/admin/catalogo-demos'];

/** Equipo de KopTup (herramientas internas como /liquidacion). */
export const STAFF_ROLES: readonly string[] = ['admin', 'manager', 'sales'];

/** Portal de un prospecto: solo Mis demos y su perfil. */
export const PROSPECT_PATHS: readonly string[] = ['/dashboard/demos', '/dashboard/profile'];

export function hasRole(role: string | null | undefined, allowed: readonly string[]): boolean {
  return !!role && allowed.includes(role);
}

function underAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isDemoAdminPath(pathname: string): boolean {
  return underAny(pathname, DEMO_ADMIN_PATHS);
}

export function prospectCanAccess(pathname: string): boolean {
  return underAny(pathname, PROSPECT_PATHS);
}

/** Roles que pueden ver una ruta del panel /admin. */
export function adminRolesFor(pathname: string): readonly string[] {
  return isDemoAdminPath(pathname) ? DEMO_ADMIN_ROLES : ADMIN_PANEL_ROLES;
}

/** Página de inicio de cada rol después de iniciar sesión. */
export function homePathForRole(role: string | null | undefined): string {
  if (hasRole(role, ADMIN_PANEL_ROLES)) return '/admin';
  if (role === 'sales') return '/admin/solicitudes';
  if (role === 'prospect') return '/dashboard/demos';
  return '/dashboard';
}
