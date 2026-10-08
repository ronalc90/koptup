/**
 * Normalización de emails idéntica a la del registro y el login
 * (`body('email').isEmail().normalizeEmail()` de express-validator):
 * minúsculas y, en Gmail, sin puntos ni +alias. Las cuentas que crea el
 * sistema de demos (aprobación o invitación directa) deben guardarse igual,
 * o su dueño no podría iniciar sesión después con su email.
 */
import { body, validationResult } from 'express-validator';
import type { Request } from 'express';

/** Devuelve el email normalizado, o null si no es un email válido. */
export async function normalizeEmailLikeAuth(raw: unknown): Promise<string | null> {
  if (typeof raw !== 'string' || raw.length > 254) return null;
  const holder = { body: { email: raw } } as unknown as Request;
  await body('email').trim().isEmail().normalizeEmail().run(holder);
  if (!validationResult(holder).isEmpty()) return null;
  const value = (holder.body as { email?: unknown }).email;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** "ana.perez@empresa.co" → "a***z@empresa.co" (para mostrar sin exponer el email completo). */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.length <= 2 ? `${local[0] ?? ''}***` : `${local[0]}***${local[local.length - 1]}`;
  return `${visible}@${domain}`;
}

/** Escapa texto para insertarlo en HTML (correos). */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
