/**
 * Utilidades del portal del cliente y del panel de operación: tipos de las
 * respuestas del backend, formato de fechas y montos, descargas con sesión y
 * mensajes de error.
 *
 * Fechas: el backend devuelve los días como `AAAA-MM-DD` ya en hora de
 * Colombia. `formatDay` los muestra sin volver a convertir la zona horaria
 * (antes, `new Date('2026-10-09')` se leía como medianoche UTC y en Colombia
 * se mostraba el 8 de octubre).
 */
import { API_BASE } from './backend-url';
import { authFetch } from './auth-token';
import { ApiError } from './demo-system';

// ---------------------------------------------------------------------------
//   Tipos
// ---------------------------------------------------------------------------

export type OrderStatus = 'pending' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type DeliverableStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type Currency = 'COP' | 'USD';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'in_progress', 'shipped', 'completed', 'cancelled'];
export const INVOICE_STATUSES: InvoiceStatus[] = ['pending', 'overdue', 'paid', 'cancelled'];
export const DELIVERABLE_STATUSES: DeliverableStatus[] = ['in_review', 'approved', 'rejected'];
export const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

/** Colores de la etiqueta de estado de un pedido (portal y panel). */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300',
  in_progress: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  shipped: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
  completed: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
};

/** Colores de la etiqueta de estado de una factura. */
export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
  pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300',
  paid: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300',
  overdue: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
  cancelled: 'bg-secondary-200 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
};
export const USER_ROLES = ['admin', 'manager', 'sales', 'developer', 'client', 'prospect', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface InvoiceView {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  projectId: string | null;
  projectName: string | null;
  orderId: string | null;
  client: { id: string; name: string; email: string; company: string | null };
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentMethod: string | null;
  notes: string | null;
  terms: string | null;
  createdAt: string;
}

export interface DeliverableView {
  id: string;
  title: string;
  description: string;
  type: 'design' | 'code' | 'documentation' | 'prototype' | 'other';
  status: DeliverableStatus;
  storage: 'file' | 'link';
  fileName: string;
  fileSize: number;
  fileType: string | null;
  url: string | null;
  version: number;
  uploadDate: string | null;
  approvedDate: string | null;
  rejectedDate: string | null;
  comments: string | null;
  project: { id: string; name: string | null } | null;
  client: { id: string; name: string | null; email: string | null };
  uploadedBy: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

export interface AdminProjectView {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: string;
  progress: number;
  budget: number | null;
  currency: Currency;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string; email: string; company: string | null } | null;
  manager: { id: string; name: string; email: string } | null;
  proposalId: string | null;
  createdAt: string;
  invoices?: number;
  deliverables?: number;
  orders?: number;
  conversation?: string | null;
}

export interface ClientAccount {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string;
  phone: string | null;
}

/** Preferencias de correo del portal (GET /api/auth/me → notificationPrefs). */
export const NOTIFICATION_EMAIL_CATEGORIES = ['pedidos', 'facturacion', 'proyectos', 'mensajes'] as const;
export type NotificationEmailCategory = (typeof NOTIFICATION_EMAIL_CATEGORIES)[number];
export type NotificationPrefs = { email: Record<NotificationEmailCategory, boolean> };

// ---------------------------------------------------------------------------
//   Formato
// ---------------------------------------------------------------------------

function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-US' : 'es-CO';
}

/** Día `AAAA-MM-DD` (ya en hora de Colombia) como «09 oct 2026», sin desfase de zona. */
export function formatDay(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return '—';
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return new Intl.DateTimeFormat(intlLocale(locale), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** Fecha (sin hora) de un instante, en hora de Colombia. */
export function formatDate(value: string | Date | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(intlLocale(locale), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }).format(date);
}

/** Fecha y hora en hora de Colombia. */
export function formatDateTime(value: string | Date | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(date);
}

/** Monto con su moneda (COP sin decimales). */
export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, locale: string): string {
  const value = Number(amount ?? 0);
  const cur = currency || 'USD';
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: cur === 'COP' ? 0 : 2,
      minimumFractionDigits: cur === 'COP' ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

/** Tamaño de archivo legible. */
export function formatFileSize(bytes: number | null | undefined): string {
  const b = Number(bytes ?? 0);
  if (b <= 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/** Hoy en Colombia (`AAAA-MM-DD`), para valores por defecto de fechas. */
export function todayInColombia(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// ---------------------------------------------------------------------------
//   Errores
// ---------------------------------------------------------------------------

export type ErrorTexts = { network: string; rateLimited: string; server: string; generic: string };

/**
 * Mensaje para mostrar: sin conexión, demasiados intentos, error del
 * servidor o el mensaje del backend (en español) para un error 4xx.
 */
export function describeError(err: unknown, locale: string, texts: ErrorTexts): string {
  const e = err as { status?: number; message?: string; response?: { status?: number; data?: { message?: string } }; code?: string };
  const status = e?.status ?? e?.response?.status ?? 0;
  const backendMessage = e?.response?.data?.message ?? (err instanceof ApiError ? err.message : undefined);
  if (!status || e?.code === 'network_error' || e?.code === 'ERR_NETWORK') return texts.network;
  if (status === 429) return locale === 'es' && backendMessage && !/^HTTP \d+/.test(backendMessage) ? backendMessage : texts.rateLimited;
  if (status >= 500) return texts.server;
  if (locale === 'es' && backendMessage && !/^HTTP \d+/.test(backendMessage) && !/status code/i.test(backendMessage)) return backendMessage;
  return texts.generic;
}

// ---------------------------------------------------------------------------
//   Descargas con sesión
// ---------------------------------------------------------------------------

/** Descarga un archivo del backend con la sesión (lanza ApiError si falla). */
export async function downloadWithSession(path: string): Promise<Blob> {
  let res: Response;
  try {
    res = await authFetch(`${API_BASE}${path}`, { cache: 'no-store' });
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : 'network_error', 0, 'network_error');
  }
  if (!res.ok) {
    let body: { message?: string; code?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* sin cuerpo JSON */
    }
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status, body.code);
  }
  return res.blob();
}

/** Guarda un Blob como archivo en el equipo de la persona. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre un enlace externo (solo http/https). */
export function openExternal(url: string | null | undefined): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/** Evento que avisa a los menús que deben volver a contar (solicitudes, mensajes…). */
export const PANEL_COUNTS_EVENT = 'koptup:panel-counts';

export function refreshPanelCounts(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PANEL_COUNTS_EVENT));
}
