/** Utilidades de texto puras (sin DOM): slugs, HTML seguro, palabras, CSV. */
import type { FieldValue, L10n, Locale } from './types';

export const emptyL10n = (): L10n => ({ es: '', en: '' });

export function isL10n(v: FieldValue | undefined): v is L10n {
  return !!v && typeof v === 'object' && !Array.isArray(v) && 'es' in v && 'en' in v;
}

/** Valor en el idioma pedido; si está vacío, el de español (idioma por defecto). */
export function pick(v: L10n | undefined | null, locale: Locale): string {
  if (!v) return '';
  const own = v[locale]?.trim();
  return own ? v[locale] : v.es;
}

/** Igual que `pick`, pero dice si se usó el respaldo en español. */
export function pickWithFallback(v: L10n | undefined | null, locale: Locale): { text: string; fallback: boolean } {
  if (!v) return { text: '', fallback: false };
  if (v[locale]?.trim()) return { text: v[locale], fallback: false };
  return { text: v.es, fallback: locale !== 'es' && !!v.es.trim() };
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Texto plano de un HTML sencillo (párrafos, listas, enlaces y negritas). */
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Convierte texto plano (por ejemplo, la respuesta de la IA) en párrafos HTML seguros. */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Enlaces (href) presentes en un HTML. */
export function linksIn(html: string): string[] {
  const out: string[] = [];
  const re = /<a\s[^>]*href="([^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href.trim());
}

/** Una celda CSV con comillas cuando hace falta (y sin fórmulas de hoja de cálculo). */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Quita tildes y pasa a minúsculas (para búsquedas). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Número de WhatsApp listo para enlace wa.me (solo dígitos). */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
