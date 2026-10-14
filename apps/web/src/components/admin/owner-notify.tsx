'use client';

import { useLocale, useTranslations } from 'next-intl';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/demo-system';

// ---------------------------------------------------------------------------
//   Tipos de la API de avisos al dueño (apps/backend: owner-notify.service.ts,
//   GET /api/admin/notifications/status, POST /api/admin/notifications/test,
//   POST /api/admin/contacts/:id/notify y el campo `notificaciones` de
//   GET /api/admin/contacts).
// ---------------------------------------------------------------------------

export type NotifyChannel = 'email' | 'whatsapp';

export const NOTIFY_CHANNELS: readonly NotifyChannel[] = ['email', 'whatsapp'];

export type ChannelState = 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'fallido' | 'no_configurado';

const CHANNEL_STATES: readonly ChannelState[] = ['pendiente', 'enviado', 'entregado', 'leido', 'fallido', 'no_configurado'];

/** Estados en los que el aviso ya salió (no hace falta reenviarlo). */
export const DELIVERED_STATES: readonly ChannelState[] = ['enviado', 'entregado', 'leido'];

/** Resultado de un canal guardado en el contacto (Contact.notificaciones.<canal>). */
export interface ContactChannelStatus {
  estado: ChannelState;
  intentos?: number;
  ultimoIntento?: string | null;
  proximoIntento?: string | null;
  error?: string | null;
  idProveedor?: string | null;
  respaldo?: string | null;
}

export type ContactNotifications = Partial<Record<NotifyChannel, ContactChannelStatus | null>>;

/** Estado de un canal en GET /api/admin/notifications/status. */
interface ChannelHealth {
  configurado: boolean;
  destino: string | null;
  ultimoExito: string | null;
  ultimoFallo: string | null;
  ultimoError: string | null;
  faltan: string[];
}

export interface NotifyStatus {
  email: ChannelHealth & { proveedor: 'resend' | 'smtp' | null; remitente: string | null };
  whatsapp: ChannelHealth & {
    proveedor: 'meta' | null;
    plantilla: string | null;
    webhook: boolean;
    /** Último evento de estado recibido por el webhook (null: ninguno todavía). */
    webhookUltimoEvento?: string | null;
    /** WHATSAPP_PROVIDER pide un proveedor retirado (twilio, ultramsg u otro). */
    proveedorNoSoportado?: boolean;
  };
  latido: { activo: boolean; cadaDias: number; ultimo: string | null; proximo: string | null };
}

/** Resultado de un canal en POST /api/admin/notifications/test. */
export interface TestChannelResult {
  configurado: boolean;
  enviado: boolean;
  id?: string | null;
  error?: string | null;
  respaldo?: string | null;
}

export type NotifyTestResult = Record<NotifyChannel, TestChannelResult>;

/** Normaliza el estado de un canal (valores desconocidos → null). */
export function channelState(status: ContactChannelStatus | null | undefined): ChannelState | null {
  const estado = status?.estado;
  return estado && (CHANNEL_STATES as readonly string[]).includes(estado) ? estado : null;
}

/** ¿Algún canal del contacto todavía no salió? (para "Reenviar aviso" o "Volver a enviar"). */
export function hasUndeliveredChannel(notificaciones: ContactNotifications | null | undefined): boolean {
  if (!notificaciones) return true;
  return NOTIFY_CHANNELS.some((c) => {
    const estado = channelState(notificaciones[c]);
    return !estado || !DELIVERED_STATES.includes(estado);
  });
}

const STATE_STYLES: Record<ChannelState | 'none', string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  enviado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  entregado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  leido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  fallido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  no_configurado: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
  none: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
};

function ChannelIcon({ channel, className }: { channel: NotifyChannel; className?: string }) {
  return channel === 'email' ? (
    <EnvelopeIcon className={cn('h-3.5 w-3.5', className)} aria-hidden="true" />
  ) : (
    <FaWhatsapp className={cn('h-3.5 w-3.5', className)} aria-hidden="true" />
  );
}

/**
 * Estado del aviso de un canal en una píldora: "Correo: Enviado",
 * "WhatsApp: Falló". `data-estado` deja leer el estado en las pruebas.
 */
export function ChannelStatusPill({ channel, status }: { channel: NotifyChannel; status: ContactChannelStatus | null | undefined }) {
  const t = useTranslations('adminNotify.status');
  const estado = channelState(status);
  const label = estado ? t(`states.${estado}`) : t('states.none');
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', STATE_STYLES[estado ?? 'none'])}
      data-testid={`notify-${channel}`}
      data-estado={estado ?? 'sin_registro'}
      title={estado === 'fallido' && status?.error ? status.error : undefined}
    >
      <ChannelIcon channel={channel} />
      {t(`channels.${channel}`)}: {label}
    </span>
  );
}

/** Las dos píldoras (correo y WhatsApp) de un contacto, para la lista. */
export function ContactNotifyPills({ notificaciones }: { notificaciones: ContactNotifications | null | undefined }) {
  const t = useTranslations('adminNotify.status');
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={t('label')}>
      {NOTIFY_CHANNELS.map((c) => (
        <ChannelStatusPill key={c} channel={c} status={notificaciones?.[c]} />
      ))}
    </div>
  );
}

/** Detalle por canal (estado, intentos, último intento, reintento, error) para el panel lateral. */
export function ContactNotifyDetail({ notificaciones }: { notificaciones: ContactNotifications | null | undefined }) {
  const t = useTranslations('adminNotify.status');
  const locale = useLocale();
  if (!notificaciones) {
    return (
      <div className="space-y-2">
        <ContactNotifyPills notificaciones={null} />
        <p className="text-xs text-secondary-500">{t('noneHint')}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {NOTIFY_CHANNELS.map((c) => {
        const status = notificaciones[c];
        const estado = channelState(status);
        return (
          <li key={c} className="space-y-1" data-testid={`notify-detail-${c}`}>
            <ChannelStatusPill channel={c} status={status} />
            <div className="text-xs text-secondary-600 dark:text-secondary-400 space-y-0.5">
              {estado === 'fallido' && status?.error && (
                <p className="text-red-700 dark:text-red-300 break-words">{t('reason', { error: status.error })}</p>
              )}
              {estado === 'no_configurado' && <p>{t('notConfiguredHint')}</p>}
              {estado === 'pendiente' && <p>{t('pendingHint')}</p>}
              {estado === 'enviado' && <p>{t(`sentHint.${c}`)}</p>}
              {typeof status?.intentos === 'number' && status.intentos > 0 && (
                <p>
                  {t('attempts', { count: status.intentos })}
                  {status.ultimoIntento ? ` · ${t('lastAttempt', { date: formatDate(status.ultimoIntento, locale, true) })}` : ''}
                </p>
              )}
              {(estado === 'fallido' || estado === 'pendiente') && status?.proximoIntento && (
                <p>{t('nextAttempt', { date: formatDate(status.proximoIntento, locale, true) })}</p>
              )}
              {status?.respaldo && <p className="text-amber-800 dark:text-amber-200">{t(`fallbackUsed.${c}`, { name: status.respaldo })}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
