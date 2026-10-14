/**
 * provider-url.ts — URL base de un proveedor (Resend, Graph de Meta) con una
 * variable que solo sirve para pruebas (RESEND_API_URL, WHATSAPP_GRAPH_URL).
 *
 * Esas URL reciben la key de Resend o el token de Meta en cada envío. En
 * producción (NODE_ENV=production) solo se aceptan si apuntan a la propia
 * máquina (localhost, 127.0.0.1 o ::1), que es lo que usa el mock de la suite
 * e2e en CI; cualquier otro host se ignora y se usa la URL oficial, para que
 * un valor copiado por error no mande las credenciales a otro servidor.
 */

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** ¿La URL apunta a la propia máquina? */
export function isLoopbackUrl(raw: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(raw).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * URL base efectiva (sin `/` final): la de la variable de prueba si se
 * permite, si no la oficial. `ignored` dice si la variable se descartó.
 */
export function providerBaseUrl(
  raw: string | undefined,
  official: string,
  env: NodeJS.ProcessEnv,
): { url: string; custom: boolean; ignored: boolean } {
  const value = raw?.trim();
  if (!value) return { url: official, custom: false, ignored: false };
  if (env.NODE_ENV === 'production' && !isLoopbackUrl(value)) return { url: official, custom: false, ignored: true };
  return { url: value.replace(/\/+$/, ''), custom: true, ignored: false };
}
