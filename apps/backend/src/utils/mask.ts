/**
 * mask.ts — enmascara destinos (correo y teléfono) para mostrarlos en el
 * panel y en los logs sin exponerlos completos, y limpia los mensajes de
 * error de los proveedores antes de guardarlos (sin secretos ni correos).
 */

/** `rosa.perez@gmail.com` → `ro***@gmail.com`. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const value = email.trim();
  const at = value.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = value.slice(0, at);
  return `${local.slice(0, Math.min(2, local.length))}***${value.slice(at)}`;
}

/** Varios destinos separados por coma, cada uno enmascarado. */
export function maskEmailList(emails: readonly string[]): string | null {
  if (emails.length === 0) return null;
  return emails.map((e) => maskEmail(e)).join(', ');
}

/** Solo los dígitos de un número (quita +, espacios, guiones y paréntesis). */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * `573001234567` → `+57 *** *** 4567`. Con más de 10 dígitos, lo que sobra al
 * inicio se toma como indicativo de país; solo se muestran los 4 últimos.
 */
export function maskPhone(value: string | null | undefined): string | null {
  const digits = phoneDigits(value);
  if (!digits) return null;
  const last4 = digits.slice(-4);
  const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
  return `${cc ? `+${cc} ` : ''}*** *** ${last4}`;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/**
 * Deja un mensaje de error listo para guardar o registrar: quita los secretos
 * indicados, enmascara cualquier correo, lo pone en una sola línea y lo
 * recorta (300 caracteres por defecto).
 */
export function cleanErrorText(raw: unknown, secrets: Array<string | null | undefined> = [], max = 300): string {
  let text = typeof raw === 'string' ? raw : raw instanceof Error ? raw.message : JSON.stringify(raw ?? '');
  for (const secret of secrets) {
    if (secret && secret.length >= 4) text = text.split(secret).join('***');
  }
  text = text
    .replace(/Bearer\s+[A-Za-z0-9._\-~+/=]+/gi, 'Bearer ***')
    .replace(EMAIL_RE, (m) => maskEmail(m) ?? '***')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
