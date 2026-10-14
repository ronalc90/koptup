/**
 * html.ts — helpers para armar HTML de correos con datos del usuario.
 *
 * Toda plantilla de correo (services/*-emails.service.ts, email.service.ts,
 * team-notify.service.ts) inserta texto con `escapeHtml` y enlaces con
 * `safeHref`. La prueba src/__tests__/unit/email-templates.test.ts renderiza
 * cada plantilla con datos hostiles y verifica que no quede marcado sin
 * escapar ni enlaces `javascript:`.
 */

/** Escapa texto para insertarlo en HTML (contenido o valor de atributo). */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Texto escapado con los saltos de línea como `<br>`. */
export function escapeMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

/** true si la URL es absoluta y su esquema es `https:`, `http:` o `mailto:`. */
export function isSafeUrl(url: unknown): boolean {
  const raw = String(url ?? '').trim();
  if (!raw) return false;
  try {
    return ['https:', 'http:', 'mailto:'].includes(new URL(raw).protocol);
  } catch {
    return false;
  }
}

/**
 * Valor seguro para un `href`: solo `https:`, `http:` y `mailto:`; cualquier
 * otro esquema (`javascript:`, `data:`…) o un valor inválido devuelve `#`.
 * Ya viene escapado para el atributo.
 */
export function safeHref(url: unknown): string {
  return isSafeUrl(url) ? escapeHtml(String(url).trim()) : '#';
}

/** La URL como texto visible ("copia este enlace"), solo si es segura; si no, vacío. */
export function safeUrlText(url: unknown): string {
  return isSafeUrl(url) ? escapeHtml(String(url).trim()) : '';
}

/** Asunto de correo en una sola línea (sin saltos que puedan colarse en las cabeceras). */
export function safeSubject(subject: unknown): string {
  return String(subject ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 200);
}
